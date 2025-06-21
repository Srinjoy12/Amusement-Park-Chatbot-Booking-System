import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import '../styles/Auth.css';

// Placeholder icons (replace with actual icons/library)
const GoogleIcon = () => <span className="social-icon google-icon">{/* G */}</span>;
const GithubIcon = () => <span className="social-icon github-icon">{/* GH */}</span>;

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            first_name: firstName,
            last_name: lastName,
          }
        }
      });
      if (signUpError) throw signUpError;
      alert('Signup successful! Check your email for verification.');
      navigate('/login');
    } catch (error) {
      setError(error?.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
      // Redirect handled by Supabase
    } catch (error) {
      setError(error?.message || `Failed to login with ${provider}`);
      setLoading(false); // Keep loading false if OAuth fails immediately
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Panel */}
      <div className="auth-left-panel">
        <div className="auth-left-content">
          <div className="auth-logo">Saur.ai</div> {/* Placeholder */} 
          <h2>Get Started with Us</h2>
          <p>Complete these easy steps to register your account.</p>
          <div className="auth-steps">
            <div className="auth-step active">
              <span>1</span> Sign up your account
            </div>
            <div className="auth-step">
              <span>2</span> Set up your workspace (Example)
            </div>
            <div className="auth-step">
              <span>3</span> Set up your profile (Example)
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="auth-right-panel">
        <h2>Sign Up Account</h2>
        <p className="auth-subtitle">Enter your personal data to create your account.</p>

        <div className="social-logins">
          <button onClick={() => handleOAuthLogin('google')} className="social-button google" disabled={loading}>
            <GoogleIcon /> Google
          </button>
          {/* Add Github if configured in Supabase */}
          <button onClick={() => handleOAuthLogin('github')} className="social-button github" disabled={loading}>
             <GithubIcon /> Github 
          </button>
        </div>

        <div className="divider-or">
          <span>Or</span>
        </div>

        {error && <div className="auth-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group half-width">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                placeholder="eg. John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group half-width">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                placeholder="eg. Francisco"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="eg. johnfrans@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
             <p className="input-hint">Must be at least 8 characters.</p>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="auth-submit-button">
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-switch-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup; 