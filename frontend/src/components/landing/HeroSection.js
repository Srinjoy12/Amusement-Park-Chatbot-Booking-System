import React, { /* Remove useState, useEffect if no longer needed for animation */ } from 'react';
import { Link } from 'react-router-dom';
// We might need to import the specific CSS if we split it, or rely on LandingPage.css
// import './HeroSection.css'; 

// Remove sample messages and useEffect logic if chat animation is removed

const HeroSection = () => {
  // Remove state and effect related to chat animation

  return (
    <section className="hero-section-saurai">
      <div className="hero-content">
        <h1>Your Ultimate Theme Park <span className="saurai-name">Companion</span></h1>
        <h2>AI-Powered Booking & Planning Assistant</h2>
        <p>
          Effortlessly book tickets, check wait times, and get personalized itineraries with our intelligent chatbot.
        </p>
        <Link to="/signup" className="get-started-btn-saurai">Plan Your Visit</Link>
      </div>
      <div className="hero-visual">
        {/* Use the chat interface screenshot */}
        <img 
          src="/Saur.png" /* Use path relative to public folder */
          alt="Amusement Park Chatbot Interface" 
          className="chat-screenshot-image" 
        />
      </div>
    </section>
  );
};

export default HeroSection; 