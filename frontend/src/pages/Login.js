import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../App';
import '../styles/Auth.css';

// Placeholder icons (replace with actual icons/library)
const GoogleIcon = () => <span className="social-icon google-icon">{/* G */}</span>;
const GithubIcon = () => <span className="social-icon github-icon">{/* GH */}</span>;

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      navigate('/chat'); // Navigate to chat or dashboard after login
    } catch (error) {
      setError(error?.message || 'Invalid login credentials.');
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
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Left Panel */}
      <div className="auth-left-panel">
         <div className="auth-left-content">
          <div className="auth-logo">Saur.ai</div> 
          <h2>Welcome Back!</h2>
          <p>Log in to continue your seamless experience.</p>
          {/* Optional: Add graphic or different content for login */}
        </div>
      </div>

      {/* Right Panel (Form) */}
      <div className="auth-right-panel">
        <h2>Log In to Your Account</h2>
        <p className="auth-subtitle">Enter your credentials below.</p>

        <div className="social-logins">
          <button onClick={() => handleOAuthLogin('google')} className="social-button google" disabled={loading}>
            <GoogleIcon /> Google
          </button>
          <button onClick={() => handleOAuthLogin('github')} className="social-button github" disabled={loading}>
             <GithubIcon /> Github 
          </button>
        </div>

        <div className="divider-or">
          <span>Or</span>
        </div>

        {error && <div className="auth-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
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
              disabled={loading}
            />
            {/* Optional: Forgot Password Link */}
             {/* <Link to="/forgot-password" className="forgot-password-link">Forgot password?</Link> */}
          </div>

          <button type="submit" disabled={loading} className="auth-submit-button">
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <p className="auth-switch-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;