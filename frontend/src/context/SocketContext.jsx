// src/context/SocketContext.jsx
import React, { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from '../hooks/useAuth';

// Read the base URL from the secure .env file with a robust fallback for production
const SOCKET_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://chatmate-lx08.onrender.com');

export const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Connect to the backend using the URL from our .env file
      const newSocket = io(SOCKET_URL, {
        query: { userId: user.id },
      });
      setSocket(newSocket);
      return () => newSocket.close();
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};