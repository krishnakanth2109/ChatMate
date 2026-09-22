// src/components/chat/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import api from '../../services/api';

const ChatWindow = ({ conversation, isGroupChat, onClose, onMinimize, onBack }) => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversation) return;
      setIsLoading(true);
      try {
        // This endpoint needs to be created on the backend for group chat history
        const endpoint = isGroupChat ? `/messages/group/${conversation._id}` : `/messages/${conversation._id}`;
        const { data } = await api.get(endpoint);
        setMessages(data);
      } catch (error) { console.error("Failed to fetch history:", error); }
      finally { setIsLoading(false); }
    };
    fetchMessages();
  }, [conversation, isGroupChat]);

  useEffect(() => {
    if (!socket) return;
    
    const messageListener = (newMessage) => {
      const targetId = isGroupChat ? newMessage.receiver : (newMessage.sender === (user?._id || user?.id) ? newMessage.receiver : newMessage.sender);
      if (targetId === conversation?._id) {
        setMessages(p => [...p, newMessage]);
      }
    };

    const deleteListener = ({ messageId }) => {
      setMessages(p => p.filter(msg => msg._id !== messageId));
    };

    // --- THIS IS THE NEW LISTENER FOR REACTIONS ---
    const updateListener = (updatedMessage) => {
      // Find the message in the state and replace it with the updated version
      setMessages(p => p.map(msg => msg._id === updatedMessage._id ? updatedMessage : msg));
    };

    socket.on('receive_message', messageListener);
    socket.on('message_deleted', deleteListener);
    socket.on('message_updated', updateListener); // Add the new listener

    return () => {
      socket.off('receive_message', messageListener);
      socket.off('message_deleted', deleteListener);
      socket.off('message_updated', updateListener); // Clean up the listener
    };
  }, [socket, conversation, user, isGroupChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (messageData) => {
    if (socket && user) {
      const fullMessageData = { sender: (user?._id || user?.id), receiver: conversation._id, ...messageData };
      socket.emit('send_message', fullMessageData);
    }
  };
  
  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this message? This cannot be undone.')) {
      socket.emit('delete_message', { messageId, userId: (user?._id || user?.id) });
    }
  };

  // --- THIS IS THE NEW HANDLER FOR REACTIONS ---
  const handleReactToMessage = (messageId, emoji) => {
    socket.emit('react_to_message', { messageId, userId: (user?._id || user?.id), emoji });
  };

  return (
    <div className="flex flex-col h-full w-full bg-black/40 backdrop-blur-2xl md:rounded-3xl shadow-2xl overflow-hidden md:border md:border-white/10">
      
      {/* Sleek Header */}
      <header className="flex-shrink-0 flex justify-between items-center p-4 md:px-6 border-b border-white/5 bg-black/20">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 rounded-full text-white/70 hover:bg-white/10 transition-colors md:hidden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {conversation?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">{conversation?.name}</h2>
              <p className="text-xs text-white/50">{isGroupChat ? 'Group Chat' : 'Online'}</p>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex space-x-3">
          <button onClick={onMinimize} className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={onClose} className="p-2 rounded-full text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </header>
      
      {/* Chat Messages Area */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwnMessage={msg.sender === (user?._id || user?.id)}
                onDelete={handleDeleteMessage}
                onReact={handleReactToMessage} 
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>
      
      {/* Input Area */}
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;