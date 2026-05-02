import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Briefcase, ShieldCheck, ArrowRight } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);

  const roles = [
    { id: 'developer', title: 'Developer', icon: <User size={40} />, desc: 'Register your twin and start the ladder climb.' },
    { id: 'senior_manager', title: 'Senior Manager', icon: <Briefcase size={40} />, desc: 'Orchestrate teams and optimize task allocation.' },
    { id: 'hrm', title: 'HRM', icon: <ShieldCheck size={40} />, desc: 'Monitor organizational health and prevent burnout.' }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handleProceed = () => {
    if (selectedRole === 'developer') {
      // Developers get the choice
      navigate('/onboarding/developer');
    } else {
      // Others go to login
      navigate(`/login?role=${selectedRole}`);
    }
  };

  return (
    <div className="landing-container animate-fade">
      <div className="landing-content">
        <h1 className="gradient-text main-title">Adaptive Developer Twin</h1>
        <p className="subtitle">Select your role to enter the ecosystem</p>

        <div className="role-grid">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className={`role-card glass-card ${selectedRole === role.id ? 'active' : ''}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <div className="role-icon">{role.icon}</div>
              <h3>{role.title}</h3>
              <p>{role.desc}</p>
            </div>
          ))}
        </div>

        {selectedRole && (
          <button className="btn-large animate-slide-up" onClick={handleProceed}>
            Proceed as {roles.find(r => r.id === selectedRole).title} <ArrowRight />
          </button>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
