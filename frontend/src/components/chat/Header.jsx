// src/components/chat/Header.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';

const Header = ({ hasNotifications, onBellClick, onProfileClick }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-slate-900 p-4 flex justify-between items-center text-white shadow-lg z-30 flex-shrink-0">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-cyan-400 to-blue-500 rounded-full p-2 text-xl shadow-md">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </div>
        <h1 className="text-2xl font-bold tracking-wide">ChatMate</h1>
      </div>
      <div className="flex items-center space-x-2 md:space-x-4">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onBellClick}
          className="relative p-2 rounded-full hover:bg-slate-700 transition-colors"
          title="Show Notifications"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          {hasNotifications && (
            <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-slate-900" />
          )}
        </motion.button>
        
        {/* --- NEW: Clickable User Profile Section --- */}
        <button onClick={onProfileClick} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="font-semibold hidden sm:block">Welcome, {user?.name || 'User'}</span>
        </button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Logout
        </motion.button>
      </div>
    </header>
  );
};

export default Header;