import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // We will overwrite this CSS file

// Import section components
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import PricingSection from '../components/landing/PricingSection';
import CTASection from '../components/landing/CTASection';

// Placeholder icons (ideally replace with actual SVGs or an icon library)
// This might be moved or removed if not needed directly here anymore
// const FeatureIcon = ({ children }) => <div className="feature-icon">{children}</div>;

const LandingPage = () => {
  // Function for smooth scrolling (basic example)
  // For robust solution, consider react-scroll library
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-saurai">
      {/* Header - Simplified for minimalism */}
      <header className="landing-header-saurai">
        <div className="logo-saurai">saur.ai</div>
        <nav>
          {/* Use onClick for smooth scroll */}
          <button onClick={() => scrollToSection('features')} className="nav-button">Features</button> 
          <button onClick={() => scrollToSection('pricing')} className="nav-button">Pricing</button>   
          <button onClick={() => scrollToSection('how-it-works')} className="nav-button">How it Works</button> 
        </nav>
        <div className="header-auth-buttons-saurai">
          <Link to="/login" className="login-btn-saurai">Login</Link>
          <Link to="/signup" className="signup-btn-saurai">Sign Up</Link>
        </div>
      </header>

      {/* Render section components with IDs */}
      <main>
        <HeroSection />
        <div id="features"><FeaturesSection /></div> 
        <div id="how-it-works"><HowItWorksSection /></div>
        <div id="pricing"><PricingSection /></div>
        <CTASection />
        {/* Add other sections like Use Cases, Testimonials, CTA here */} 
      </main>

      {/* Minimal Footer */}
      <footer className="landing-footer-saurai">
        <p>&copy; {new Date().getFullYear()} Saur.ai. All rights reserved.</p>
        <div className="footer-links">
           <Link to="/privacy">Privacy Policy</Link>
           <Link to="/terms">Terms of Service</Link>
           <Link to="/contact">Contact</Link> {/* Example link */}
        </div>
      </footer>

    </div>
  );
};

export default LandingPage; 