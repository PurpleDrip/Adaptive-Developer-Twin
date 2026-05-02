import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, Lock, Globe, Code, Download, Copy, CheckCircle } from 'lucide-react';

const GATEWAY_URL = "http://localhost:8000/api/v1";

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Form, 2: Success/Download
  const [formData, setFormData] = useState({
    name: '', username: '', email: '', phone_number: '',
    gender: 'Male', password: '', experience_level: 'Junior',
    strong_domains: [], github_project_urls: []
  });
  const [ids, setIds] = useState({ userId: '', extensionId: '' });
  const [error, setError] = useState('');

  const domains = ["backend", "frontend", "devops", "ml", "neo4j", "mobile", "security", "cloud", "fullstack"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleDomain = (domain) => {
    const current = formData.strong_domains;
    if (current.includes(domain)) {
      setFormData({ ...formData, strong_domains: current.filter(d => d !== domain) });
    } else {
      setFormData({ ...formData, strong_domains: [...current, domain] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const resp = await axios.post(`${GATEWAY_URL}/auth/users/register`, formData);
      setIds({ userId: resp.data.user_id, extensionId: resp.data.extension_id });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check your data.");
    }
  };

  if (step === 2) {
    return (
      <div className="landing-container animate-fade">
        <div className="success-card glass-card">
          <CheckCircle size={64} className="accent-green" />
          <h2 className="gradient-text">Twin Initialized!</h2>
          <p>Your digital profile has been fused with the Temporal Skill Graph.</p>
          
          <div className="download-section">
            <p><strong>Step 1:</strong> Download the VS Code Extension</p>
            <a href="/downloads/adt-extension.vsix" className="btn-large">
              <Download /> Download .VSIX
            </a>
          </div>

          <div className="ids-section">
            <p><strong>Step 2:</strong> Connect your IDs in VS Code</p>
            <div className="id-box">
              <label>User ID</label>
              <div className="id-value">
                <code>{ids.userId}</code>
                <Copy size={16} className="copy-icon" onClick={() => navigator.clipboard.writeText(ids.userId)} />
              </div>
            </div>
            <div className="id-box">
              <label>Extension ID</label>
              <div className="id-value">
                <code>{ids.extensionId}</code>
                <Copy size={16} className="copy-icon" onClick={() => navigator.clipboard.writeText(ids.extensionId)} />
              </div>
            </div>
          </div>

          <button className="btn-text" onClick={() => navigate('/login?role=developer')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-container animate-fade">
      <div className="form-wrapper glass-card">
        <h2 className="gradient-text">Developer Registration</h2>
        <p className="subtitle">Initialize your profile in the ADT ecosystem</p>
        
        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="reg-form">
          <div className="form-section">
            <h3><User size={18} /> Basic Identity</h3>
            <div className="form-grid">
              <input name="name" placeholder="Full Name" onChange={handleInputChange} required />
              <input name="username" placeholder="Username" onChange={handleInputChange} required />
              <input name="email" type="email" placeholder="Email" onChange={handleInputChange} required />
              <input name="phone_number" placeholder="Phone Number" onChange={handleInputChange} required />
              <select name="gender" onChange={handleInputChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input name="password" type="password" placeholder="Password" onChange={handleInputChange} required />
            </div>
          </div>

          <div className="form-section">
            <h3><Code size={18} /> Technical Profile</h3>
            <label>Experience Level</label>
            <select name="experience_level" onChange={handleInputChange}>
              <option value="Intern">Intern</option>
              <option value="Junior">Junior</option>
              <option value="Mid">Mid-Level</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Principal">Principal</option>
            </select>

            <label style={{marginTop: '15px', display: 'block'}}>Strong Domains (Select at least one)</label>
            <div className="domain-tags">
              {domains.map(d => (
                <span 
                  key={d} 
                  className={`domain-tag ${formData.strong_domains.includes(d) ? 'active' : ''}`}
                  onClick={() => toggleDomain(d)}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-large" style={{marginTop: '30px'}}>
            Initialize Twin <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegistrationPage;
