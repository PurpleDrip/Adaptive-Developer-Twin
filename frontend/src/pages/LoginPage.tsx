import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { LogIn, Shield, ArrowLeft } from 'lucide-react';

const GATEWAY_URL = "http://localhost:8000/api/v1";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'developer';
  
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // In a production app, we would call the /login endpoint
    // For now, we simulate the redirection based on role
    if (role === 'developer') {
        navigate('/dashboard');
    } else if (role === 'senior_manager') {
        navigate('/senior');
    } else if (role === 'hrm') {
        navigate('/hrm');
    }
  };

  const roleTitles = {
    developer: "Developer Portal",
    senior_manager: "Management Console",
    hrm: "HRM Analytics Suite"
  };

  return (
    <div className="landing-container animate-fade">
      <div className="login-card glass-card">
        <button className="btn-text" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back
        </button>

        <h2 className="gradient-text">{roleTitles[role]}</h2>
        <p className="subtitle">Secure authentication required</p>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{textAlign: 'left'}}>
            <label>Username</label>
            <input name="username" placeholder="Enter username" onChange={handleChange} required />
          </div>
          
          <div className="input-group" style={{textAlign: 'left', marginTop: '20px'}}>
            <label>Password</label>
            <input name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
          </div>

          <button type="submit" className="btn-large" style={{marginTop: '30px'}}>
            Sign In <LogIn size={18} />
          </button>
        </form>

        {(role === 'senior_manager' || role === 'hrm') && (
          <p className="hint-text">
            <Shield size={14} /> Credentials provided by Technical Support
          </p>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
