// src/components/chat/UserProfile.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const UserProfile = ({ onClose }) => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={onClose} // Close when clicking the background
    >
      <motion.div
        initial={{ y: 50, scale: 0.9, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 50, scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-slate-800 rounded-2xl w-full max-w-sm p-8 border border-slate-700 shadow-2xl flex flex-col items-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white flex items-center justify-center font-bold text-4xl mb-4 ring-4 ring-slate-700">
          {user.name.charAt(0).toUpperCase()}
        </div>
        
        <h2 className="text-3xl font-bold text-white mt-2">{user.name}</h2>
        <p className="text-slate-400 mt-1">{user.email}</p>

        <div className="w-full text-left mt-8">
            <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Role</p>
            <p className="text-lg text-white capitalize">{user.role}</p>
        </div>

        <button 
            onClick={onClose}
            className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
        >
            Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default UserProfile;