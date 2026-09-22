// src/components/common/Spinner.jsx
import React from 'react';

const Spinner = () => (
  <div className="min-h-screen flex justify-center items-center bg-gray-900">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
  </div>
);

export default Spinner;