// src/components/chat/Discover.jsx
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { motion } from 'framer-motion';

const Discover = () => {
  const [allUsers, setAllUsers] = useState([]); // Stores the full list
  const [filteredUsers, setFilteredUsers] = useState([]); // Stores the list to display
  const [query, setQuery] = useState(''); // The user's search input
  const [sentInvites, setSentInvites] = useState({});
  const { socket } = useSocket();

  // Fetch all discoverable users when the component first loads
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const { data } = await api.get('/users/discover');
        setAllUsers(data);
        setFilteredUsers(data); // Initially, display all users
      } catch (error) {
        console.error("Failed to fetch discoverable users:", error);
      }
    };
    fetchAllUsers();
  }, []);

  // --- THIS IS THE SEARCH LOGIC ---
  // This effect runs every time the user types in the search bar
  useEffect(() => {
    if (query.trim() === '') {
      setFilteredUsers(allUsers); // If search is empty, show all users
    } else {
      // Filter the full list based on the search query
      const results = allUsers.filter(user =>
        user.name.toLowerCase().includes(query.toLowerCase()) ||
        user.phone.includes(query)
      );
      setFilteredUsers(results);
    }
  }, [query, allUsers]);


  const handleSendInvite = async (userId) => {
    try {
      await api.post(`/users/invite/${userId}`);
      setSentInvites(prev => ({ ...prev, [userId]: true }));
      socket.emit('send_invite', { receiverId: userId });
    } catch (error) {
      console.error("Failed to send invite:", error);
      alert(error.response?.data?.msg || "Could not send invite.");
    }
  };

  const handleSyncContacts = async () => {
    // This is a simulation for web. In React Native, you would use a contacts library.
    const deviceContacts = ['+15551234567', '+15559876543']; // Example
    try {
        const { data } = await api.post('/users/sync-contacts', { phoneNumbers: deviceContacts });
        alert(`Found ${data.length} of your contacts on ChatMate! Invite them from the list below.`);
        // You could also highlight these found users in the list
    } catch (error) {
        console.error("Failed to sync contacts:", error);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      {/* The search input is now back */}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or phone..."
        className="w-full mb-4 px-4 py-2 rounded-lg bg-slate-700/50 placeholder-slate-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button onClick={handleSyncContacts} className="w-full mb-4 py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 font-semibold transition-colors">
        Sync Device Contacts
      </button>
      
      <p className="text-center text-xs text-slate-400 mb-2">Suggestions</p>
      
      <ul className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {filteredUsers.length > 0 ? (
          filteredUsers.map(user => (
            <li key={user._id} className="p-3 flex items-center justify-between bg-slate-700/50 rounded-lg">
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-slate-400">{user.phone}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendInvite(user._id)}
                disabled={sentInvites[user._id]}
                className="px-3 py-1 text-sm font-semibold rounded-md transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700"
              >
                {sentInvites[user._id] ? 'Sent' : 'Invite'}
              </motion.button>
            </li>
          ))
        ) : (
          <p className="text-center text-slate-400 mt-10">No users found.</p>
        )}
      </ul>
    </div>
  );
};

export default Discover;