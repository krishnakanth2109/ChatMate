// src/components/chat/Invites.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import { motion } from 'framer-motion';

const Invites = ({ onInviteAccepted }) => {
  const [invites, setInvites] = useState([]);
  const { socket } = useSocket();

  const fetchInvites = async () => {
    try {
      const { data } = await api.get('/users/invites');
      setInvites(data);
    } catch (error) {
      console.error("Failed to fetch invites:", error);
    }
  };

  useEffect(() => {
    fetchInvites();
    socket?.on('new_invite', fetchInvites);
    return () => socket?.off('new_invite', fetchInvites);
  }, [socket]);

  const handleAcceptInvite = async (userId) => {
    try {
      await api.post(`/users/invite/accept/${userId}`);
      socket.emit('accept_invite', { senderId: userId });
      // Remove the accepted invite from the list visually
      setInvites(prev => prev.filter(invite => invite._id !== userId));
      onInviteAccepted(); // Tell the layout to update contacts
    } catch (error) {
      console.error("Failed to accept invite:", error);
    }
  };

  return (
    <div className="p-4">
      <ul className="overflow-y-auto h-[calc(100vh-200px)] space-y-2">
        {invites.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">No pending invites.</p>
        ) : (
          invites.map(invite => (
            <li key={invite._id} className="p-3 flex items-center justify-between bg-white/5 rounded-lg">
              <div>
                <p className="font-semibold">{invite.name}</p>
                <p className="text-sm text-gray-400">{invite.email}</p>
              </div>
              <motion.button
                 whileHover={{ scale: 1.1 }}
                 whileTap={{ scale: 0.95 }}
                onClick={() => handleAcceptInvite(invite._id)}
                className="px-3 py-1 text-sm font-semibold rounded-md transition-colors bg-green-600 hover:bg-green-700"
              >
                Accept
              </motion.button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Invites;