import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ChatInput = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const { darkMode } = useTheme();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        disabled={disabled}
        className={`flex-1 p-3 rounded-l-lg focus:outline-none focus:ring-2 ${
          darkMode
            ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500'
        }`}
      />
      
      <motion.button
        type="submit"
        disabled={!message.trim() || disabled}
        whileTap={{ scale: 0.95 }}
        className={`p-3 rounded-r-lg ${
          darkMode
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        } ${(!message.trim() || disabled) && 'opacity-50 cursor-not-allowed'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </motion.button>
    </form>
  );
};

export default ChatInput;
