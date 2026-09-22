import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// A custom hook for handling long press on mobile and context menu on desktop
const useLongPress = (callback = () => {}, ms = 300) => {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    let timerId;
    if (startLongPress) {
      timerId = setTimeout(callback, ms);
    } else {
      clearTimeout(timerId);
    }
    return () => clearTimeout(timerId);
  }, [callback, ms, startLongPress]);

  return {
    onMouseDown: () => startLongPress(true),
    onMouseUp: () => startLongPress(false),
    onMouseLeave: () => startLongPress(false),
    onTouchStart: () => startLongPress(true),
    onTouchEnd: () => startLongPress(false),
  };
};

const MessageBubble = ({ message, isOwnMessage, onDelete, onReact }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const handleOpenMenu = () => {
    // Only the sender can open the menu for their own messages
    if (isOwnMessage) setShowMenu(true);
  };

  const longPressEvents = useLongPress(handleOpenMenu, 400);

  const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent default browser right-click menu
    handleOpenMenu();
  };
  
  const popularReactions = ['❤️', '👍', '😂', '😢', '😮', '🎉'];

  const renderContent = () => {
    switch (message.messageType) {
      case 'text': return <p className="break-words">{message.content}</p>;
      case 'voice': return <audio controls src={message.fileUrl} className="w-56 sm:w-64 h-10" />;
      case 'image': return <img src={message.fileUrl} alt="Shared media" className="rounded-lg max-w-[200px] h-auto cursor-pointer" onClick={() => window.open(message.fileUrl, '_blank')} />;
      case 'document': return (
          <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 p-2 bg-black/20 rounded-lg hover:bg-black/40">
            <span className="text-2xl">📄</span>
            <span className="font-semibold underline">{message.fileName || 'Document'}</span>
          </a>);
      case 'location': return (
          <div>
            <p className="font-semibold mb-1">Location Shared:</p>
            <p className="text-sm italic mb-2">{message.location.address}</p>
            <a href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:underline">View on Map</a>
          </div>);
      default: return <p>{message.content || 'Unsupported message'}</p>;
    }
  };

  return (
    <div className={`relative flex items-end my-2 gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
      <div 
        className="relative" 
        onContextMenu={handleContextMenu}
        {...longPressEvents}
      >
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ y: 10, scale: 0.8, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center bg-slate-800 border border-slate-700 rounded-full shadow-lg z-20 p-1"
            >
              {popularReactions.map(emoji => (
                <button key={emoji} onClick={() => { onReact(message._id, emoji); setShowMenu(false); }} className="p-1.5 text-xl rounded-full hover:bg-slate-700 transition-colors">{emoji}</button>
              ))}
              <div className="w-px h-6 bg-slate-700 mx-1"></div>
              <button onClick={() => { onDelete(message._id); setShowMenu(false); }} className="p-1.5 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`max-w-xs md:max-w-md px-4 py-2.5 shadow-sm text-white ${
            isOwnMessage 
              ? 'bg-gradient-to-tr from-purple-600 to-blue-500 rounded-3xl rounded-br-sm' 
              : 'bg-[#1e1e1e] rounded-3xl rounded-bl-sm border border-white/5'
          }`}
        >
          {renderContent()}
        </motion.div>

        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute -bottom-3 ${isOwnMessage ? 'right-2' : 'left-2'} flex items-center space-x-0.5`}>
            {/* Group reactions by emoji and show count */}
            {Object.entries(message.reactions.reduce((acc, r) => ({ ...acc, [r.emoji]: (acc[r.emoji] || 0) + 1 }), {})).slice(0, 4).map(([emoji, count]) => (
              <span key={emoji} className="text-xs bg-slate-800 rounded-full px-1.5 py-0.5 border border-slate-700 shadow-md">
                {emoji} {count > 1 && count}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* Click-away detector to close the menu */}
      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}
    </div>
  );
};

export default MessageBubble;