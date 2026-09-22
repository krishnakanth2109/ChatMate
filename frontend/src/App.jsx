// src/App.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext'; // Import SocketProvider
import Login from './pages/Login';
import Register from './pages/Register';
import ChatLayout from './pages/ChatLayout';
import Spinner from './components/common/Spinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = React.useContext(AuthContext);

  if (isLoading) {
    return <Spinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* Wrap the protected layout with the SocketProvider */}
              <SocketProvider>
                <ChatLayout />
              </SocketProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;