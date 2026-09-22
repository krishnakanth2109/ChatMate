// src/components/chat/ContactList.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const ContactList = ({ onSelectUser, selectedUserId, forceUpdate }) => {
  const [contacts, setContacts] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const { data } = await api.get('/users/contacts');
        setContacts(data);
      } catch (error) { console.error('Failed to fetch contacts', error); }
    };
    fetchContacts();
  }, [forceUpdate]);

  useEffect(() => {
    if (!socket) return;
    socket.on('getOnlineUsers', setOnlineUsers);
    
    const handleNewMessage = ({ senderId }) => {
      setContacts(prev => prev.map(c => 
        c._id === senderId ? { ...c, hasUnread: true } : c
      ));
    };
    socket.on('new_message_notification', handleNewMessage);

    return () => {
      socket.off('getOnlineUsers');
      socket.off('new_message_notification', handleNewMessage);
    };
  }, [socket]);

  return (
    <div className="h-[calc(100vh-125px)] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800">
      {contacts.length > 0 ? (
        <ul className="h-full">
          {contacts.map((contact) => (
            <li
              key={contact._id}
              onClick={() => onSelectUser(contact)}
              className={`p-3 flex items-center justify-between space-x-4 cursor-pointer transition-colors border-b border-slate-700 ${
                selectedUserId === contact._id ? 'bg-blue-600' : 'hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xl">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  {onlineUsers.includes(contact._id) && (
                    <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-slate-800" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-sm text-slate-400">{contact.email}</p>
                </div>
              </div>
              {contact.hasUnread && (
                <span className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0" title="Unread messages" />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center space-y-4">
          <span className="text-5xl">🔍</span>
          <p className="text-lg font-semibold text-white">No contacts yet</p>
          <p className="text-sm">Head over to the <strong className="text-blue-400">Discover</strong> tab to find users and send them an invite!</p>
        </div>
      )}
    </div>
  );
};

export default ContactList;