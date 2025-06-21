import React from 'react';
import { Link } from 'react-router-dom';

const PricingSection = () => {
  return (
    <section className="pricing-section-saurai">
      <h2>Simple, Transparent Pricing</h2>
      <p className="pricing-subtitle">Choose the plan that fits your park adventures.</p>
      <div className="pricing-grid">
        {/* Tier 1: Explorer (Free) */}
        <div className="pricing-tier">
          <h3>Explorer</h3>
          <p className="price">Free</p>
          <ul className="features-list">
            <li>Basic Park Info Chat</li>
            <li>Real-Time Wait Time Access</li>
            <li>General Recommendations</li>
            <li>Community Support</li>
          </ul>
          <Link to="/signup" className="cta-button secondary">Start Exploring</Link>
        </div>

        {/* Tier 2: Planner (Premium - Highlighted) */}
        <div className="pricing-tier highlighted">
          <div className="highlight-badge">Full Access</div>
          <h3>Planner</h3>
          <p className="price">$9<span className="term">/month (example)</span></p>
          <ul className="features-list">
            <li>Everything in Explorer</li>
            <li>AI-Powered Ticket Booking</li>
            <li>Personalized Itinerary Planning</li>
            <li>Exclusive Park Tips & Deals</li>
            <li>Priority Support</li>
          </ul>
          <Link to="/signup?plan=planner" className="cta-button primary">Get Planner Access</Link>
        </div>

        {/* Tier 3: Optional Group/Family Plan ? */}
        {/* <div className="pricing-tier"> ... </div> */}
      </div>
    </section>
  );
};

export default PricingSection; 