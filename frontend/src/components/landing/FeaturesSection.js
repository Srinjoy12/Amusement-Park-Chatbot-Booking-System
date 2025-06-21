import React from 'react';

// Placeholder icon component (keep or replace)
const FeatureIcon = ({ children }) => <div className="feature-icon">{children}</div>;

const FeaturesSection = () => {
  return (
    <section className="features-section-saurai">
      <h2>Everything You Need for the Perfect Park Day</h2>
      <div className="features-grid">
        <div className="feature-item">
          <FeatureIcon>🎟️</FeatureIcon> 
          <h3>Easy Ticket Booking</h3>
          <p>Securely purchase park tickets directly through chat.</p>
        </div>
        <div className="feature-item">
          <FeatureIcon>⏱️</FeatureIcon> 
          <h3>Real-Time Wait Times</h3>
          <p>Get live updates on ride wait times to plan smarter.</p>
        </div>
        <div className="feature-item">
          <FeatureIcon>🗺️</FeatureIcon> 
          <h3>Personalized Itineraries</h3>
          <p>Receive custom park plans based on your preferences.</p>
        </div>
         <div className="feature-item">
          <FeatureIcon>💡</FeatureIcon> 
          <h3>AI Recommendations</h3>
          <p>Discover hidden gems and dining options via smart suggestions.</p>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 