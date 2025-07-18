import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/NotFound.css';

const NotFound = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`not-found ${darkMode ? 'dark' : ''}`}>
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="home-button">
          Go Back Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 