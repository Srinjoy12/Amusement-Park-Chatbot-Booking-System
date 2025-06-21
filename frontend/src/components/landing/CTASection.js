import React from 'react';
import { Link } from 'react-router-dom';

const CTASection = () => {
  return (
    <section className="cta-section-saurai">
      <h2>Ready for Your Best Park Day Ever?</h2>
      <p>Let our AI assistant handle the planning and booking stress.</p>
      <Link to="/signup" className="cta-button primary large">Start Planning Now</Link>
      {/* Optional: Add secondary action like 'Learn More' or 'Contact Sales' */}
    </section>
  );
};

export default CTASection; 