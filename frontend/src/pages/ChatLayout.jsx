// src/pages/ChatLayout.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/chat/Header';
import Sidebar from '../components/chat/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';

const ChatLayout = () => {
  const [activeChat, setActiveChat] = useState(null); 
  const [minimizedChats, setMinimizedChats] = useState([]); 
  const [activeSidebarTab, setActiveSidebarTab] = useState('contacts'); 

  const [forceUpdate, setForceUpdate] = useState(0);
  const [pendingInvitesCount, setPendingInvitesCount] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  
  const { socket } = useSocket();

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
    socket?.on('new_message_notification', updateNotifications);
    socket?.on('invite_accepted', () => setForceUpdate(p => p + 1));
    return () => {
      socket?.off('new_invite', updateNotifications);
      socket?.off('new_message_notification', updateNotifications);
      socket?.off('invite_accepted');
    };
  }, [socket, forceUpdate]);

  const handleInviteAccepted = () => setForceUpdate(p => p + 1);

  const handleSelectUser = async (user) => {
    try {
      await api.post('/users/messages/mark-as-read', { senderId: user._id });
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
    setForceUpdate(p => p + 1);
    setMinimizedChats(prev => prev.filter(u => u._id !== user._id));
    setActiveChat(user);
  };

  const handleCloseChat = () => setActiveChat(null);
  const handleMinimizeChat = () => {
    if (!activeChat) return;
    if (!minimizedChats.find(u => u._id === activeChat._id)) {
      setMinimizedChats(prev => [...prev, activeChat]);
    }
    setActiveChat(null);
  };
  
  const handleBellClick = () => setActiveSidebarTab('invites');

  // --- THIS IS THE RESPONSIVE MAGIC ---
  // On medium screens and up (md:), the layout is flex. On mobile, it's a block.
  // The `overflow-hidden` on the parent prevents the ChatWindow from showing until it's ready.
  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 font-sans text-white">
      <Header hasNotifications={pendingInvitesCount > 0 || hasUnreadMessages} onBellClick={handleBellClick} />
      
      <div className="flex flex-1 relative overflow-hidden">
        
        {/* Sidebar: Always visible on desktop, translates on mobile */}
        <div 
          className={`absolute top-0 left-0 h-full w-full md:relative md:w-96 flex-shrink-0 z-10 transition-transform duration-300 ease-in-out ${activeChat ? '-translate-x-full md:translate-x-0' : 'translate-x-0'}`}
        >
          <Sidebar
            onSelectUser={handleSelectUser}
            selectedUserId={activeChat?._id || null}
            forceUpdate={forceUpdate}
            onInviteAccepted={handleInviteAccepted}
            pendingInvitesCount={pendingInvitesCount}
            activeTab={activeSidebarTab} 
            setActiveTab={setActiveSidebarTab} 
          />
        </div>
        
        {/* Main Content Area (Desktop) */}
        <main className="flex-1 hidden md:flex items-center justify-center p-0 md:p-6 relative w-full h-full">
          {!activeChat ? (
            <div className="flex items-center justify-center h-full text-white/70 flex-col text-center p-4">
              <span className="text-6xl mb-4">👋</span>
              <h2 className="text-2xl font-bold">Welcome to ChatMate</h2>
              <p className="mt-2 max-w-md">Select a contact to start messaging.</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChat._id}
                className="w-full h-full max-w-4xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <ChatWindow 
                  conversation={activeChat} 
                  isGroupChat={activeChat.isGroup}
                  onClose={handleCloseChat}
                  onMinimize={handleMinimizeChat}
                  onBack={() => setActiveChat(null)}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </main>
        
        {/* Mobile Chat Window: Takes over the screen */}
        <div className="md:hidden">
          <AnimatePresence>
            {activeChat && (
              <motion.div
                key={activeChat._id}
                className="absolute inset-0 z-50 bg-slate-900"
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <ChatWindow 
                  conversation={activeChat} 
                  isGroupChat={activeChat.isGroup}
                  onClose={handleCloseChat}
                  onMinimize={handleMinimizeChat}
                  onBack={() => setActiveChat(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Minimized chats bar remains at the bottom */}
      <div className="absolute bottom-0 left-0 md:left-96 right-0 h-16 bg-black/30 backdrop-blur-sm flex items-center px-4 space-x-2 z-20">
        {minimizedChats.map(chatUser => (
          <motion.button key={chatUser._id} onClick={() => handleSelectUser(chatUser)} className="flex items-center space-x-2 px-3 py-2 bg-white/10 rounded-lg hover:bg-white/20" layoutId={`minimized-${chatUser._id}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-sm">{chatUser.name.charAt(0).toUpperCase()}</div>
            <span className="font-semibold">{chatUser.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ChatLayout;