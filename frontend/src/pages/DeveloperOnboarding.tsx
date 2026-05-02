import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

const DeveloperOnboarding = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container animate-fade">
      <div className="onboarding-content">
        <button className="btn-text" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Role Selection
        </button>
        
        <h2 className="gradient-text">Developer Onboarding</h2>
        <p className="subtitle">Are you new here or returning to your twin?</p>

        <div className="choice-container">
          <div className="choice-card glass-card" onClick={() => navigate('/login?role=developer')}>
            <LogIn size={48} className="accent-primary" />
            <h3>Existing User</h3>
            <p>Login to access your dashboard and skills graph.</p>
          </div>

          <div className="choice-card glass-card" onClick={() => navigate('/register')}>
            <UserPlus size={48} className="accent-secondary" />
            <h3>New Developer</h3>
            <p>Create your profile and generate your Extension ID.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperOnboarding;
