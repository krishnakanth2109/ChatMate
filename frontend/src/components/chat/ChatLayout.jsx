// src/pages/ChatLayout.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/chat/Header';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import UserProfile from '../components/chat/UserProfile';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';

const ChatLayout = () => {
  // --- STATE MANAGEMENT ---
  // The active chat can now be a user OR a group object
  const [activeChat, setActiveChat] = useState(null); 
  const [minimizedChats, setMinimizedChats] = useState([]); 
  const [activeSidebarTab, setActiveSidebarTab] = useState('contacts'); 
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const { socket } = useSocket();
  const { user } = useAuth(); // Get the current user

  // --- NOTIFICATION & DATA FETCHING ---
  useEffect(() => {
    const updateNotifications = async () => {
      try {
        const invitesRes = await api.get('/users/invites');
        setPendingInvitesCount(invitesRes.data.length);
        const contactsRes = await api.get('/users/contacts');
        setHasUnreadMessages(contactsRes.data.some(c => c.hasUnread));
      } catch (error) { console.error("Failed to fetch notifications:", error); }
    };

    updateNotifications();
    
    socket?.on('new_invite', updateNotifications);
    socket?.on('invite_accepted', () => setForceUpdate(p => p + 1));

    const handleToastNotification = ({ senderId, senderName, messageContent }) => {
      if (activeChat?._id !== senderId) {
        updateNotifications(); // Update counts and dots
        toast.custom(/* ... toast UI ... */);
      }
    };
    socket?.on('new_message_notification', handleToastNotification);
    
    return () => {
      socket?.off('new_invite', updateNotifications);
      socket?.off('new_message_notification', handleToastNotification);
      socket?.off('invite_accepted');
    };
  }, [socket, forceUpdate, activeChat]);

  // --- HANDLER FUNCTIONS ---
  const handleInviteAccepted = () => setForceUpdate(p => p + 1);

  const handleSelectConversation = async (conversation) => {
    // This function is now generic. 'conversation' can be a user or a group.
    
    // Check if it's a user chat to mark messages as read
    if (conversation.email) { // A simple check to see if it's a user object
      await api.post('/users/messages/mark-as-read', { senderId: conversation._id });
      setForceUpdate(p => p + 1);
    }
    
    setMinimizedChats(prev => prev.filter(c => c._id !== conversation._id));
    setActiveChat(conversation);
  };

  const handleCloseChat = () => setActiveChat(null);
  
  const handleMinimizeChat = () => {
    if (!activeChat) return;
    if (!minimizedChats.find(c => c._id === activeChat._id)) {
      setMinimizedChats(prev => [...prev, activeChat]);
    }
    setActiveChat(null);
  };
  
  const handleBellClick = () => {
    if (pendingInvitesCount > 0) setActiveSidebarTab('invites');
    else setActiveSidebarTab('contacts');
  };

  // --- RENDER LOGIC ---
  return (
    <div className="relative h-screen w-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 font-sans text-white overflow-hidden">
      <Toaster position="top-center" />
      <Header 
        hasNotifications={pendingInvitesCount > 0 || hasUnreadMessages} 
        onBellClick={handleBellClick}
        onProfileClick={() => setIsProfileVisible(true)}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-full md:w-96 flex-shrink-0">
          <Sidebar
            // The select handler is now generic
            onSelectConversation={handleSelectConversation}
            selectedConversationId={activeChat?._id || null}
            forceUpdate={forceUpdate}
            onInviteAccepted={handleInviteAccepted}
            pendingInvitesCount={pendingInvitesCount}
            activeTab={activeSidebarTab} 
            setActiveTab={setActiveSidebarTab} 
          />
        </div>
        
        <main className="flex-1 hidden md:flex items-center justify-center p-6 relative">
          <AnimatePresence>
            {activeChat && (
              <motion.div
                key={activeChat._id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full h-full max-w-4xl"
              >
                <ChatWindow 
                  // Pass the active chat object and a boolean to identify its type
                  conversation={activeChat}
                  isGroupChat={!!activeChat.members} // 'members' exists on groups, not users
                  onClose={handleCloseChat}
                  onMinimize={handleMinimizeChat}
                  onBack={() => setActiveChat(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {!activeChat && (
            <div className="flex items-center justify-center h-full text-white/70 flex-col text-center p-4">
              <span className="text-6xl mb-4">👋</span>
              <h2 className="text-2xl font-bold">Welcome to ChatMate</h2>
              <p className="mt-2 max-w-md">Select a contact or group to start messaging.</p>
            </div>
          )}
        </main>
      </div>

      <div className="absolute bottom-0 left-0 md:left-96 right-0 h-16 bg-black/30 backdrop-blur-sm flex items-center px-4 space-x-2 z-20">
        {minimizedChats.map(chat => (
          <motion.button key={chat._id} onClick={() => handleSelectConversation(chat)} className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20" layoutId={`minimized-${chat._id}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm">
              {chat.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold">{chat.name}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {isProfileVisible && (
          <UserProfile onClose={() => setIsProfileVisible(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatLayout;