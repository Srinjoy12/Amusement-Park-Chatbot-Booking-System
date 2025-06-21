import React from 'react';

const HowItWorksSection = () => {
  return (
    <section className="how-it-works-section-saurai">
      <h2>Simple Steps to Your Best Park Visit</h2>
      <p className="section-subtitle">Planning and booking your amusement park trip is easier than ever.</p>
      <div className="steps-container">
        <div className="step-item">
          <div className="step-number">1</div>
          <h3>Sign In / Sign Up</h3>
          <p>Quickly create an account or log in to get started.</p>
        </div>
        <div className="step-connector"></div>
        <div className="step-item">
          <div className="step-number">2</div>
          <h3>Chat & Plan</h3>
          <p>Tell the AI your preferences, ask questions, and build your plan.</p>
        </div>
        <div className="step-connector"></div>
        <div className="step-item">
          <div className="step-number">3</div>
          <h3>Book & Go!</h3>
          <p>Confirm bookings, get your e-tickets, and enjoy your day!</p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 