import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const ChatMessage = ({ message }) => {
  const { darkMode } = useTheme();
  const isBot = message.sender === 'bot';
  
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
      initial="hidden"
      animate="visible"
      variants={messageVariants}
      transition={{ duration: 0.3 }}
    >
      <div
        className={`max-w-3/4 p-3 rounded-lg ${
          isBot
            ? darkMode
              ? 'bg-blue-900 text-white'
              : 'bg-blue-100 text-gray-800'
            : darkMode
            ? 'bg-gray-700 text-white'
            : 'bg-gray-200 text-gray-800'
        } ${message.isError && 'bg-red-100 text-red-800'}`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>
        <div
          className={`text-xs mt-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;