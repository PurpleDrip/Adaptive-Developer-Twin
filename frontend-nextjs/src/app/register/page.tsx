'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Code, ArrowRight, ArrowLeft, AlertTriangle } from 'lucide-react';
import { debounce } from 'lodash';

// Internal Libs
import { authApi } from '@/lib/api/auth';
import { patterns, getPasswordStrength } from '@/lib/utils/validation';

// Components
import { ValidationIcon } from '@/components/registration/ValidationIcon';
import { SuccessStep } from '@/components/registration/SuccessStep';

export default function RegistrationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', username: '', email: '', phone_number: '',
    gender: 'Male', password: '', experience_level: 'Junior',
    strong_domains: [] as string[], github_project_urls: [] as string[]
  });
  const [validity, setValidity] = useState<Record<string, 'idle' | 'checking' | 'valid' | 'invalid'>>({
    name: 'idle', username: 'idle', email: 'idle', phone_number: 'idle'
  });
  const [customDomain, setCustomDomain] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: 'Very Weak', color: 'bg-red-500' });
  const [ids, setIds] = useState({ userId: '', extensionId: '' });
  const [error, setError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const domains = ["backend", "frontend", "devops", "ml", "neo4j", "mobile", "security", "cloud", "fullstack"];

  // 0. Validation Logic (Debounced)
  const checkAvailability = useCallback(
    debounce(async (field: string, value: string) => {
        const pattern = patterns[field as keyof typeof patterns];
        if (pattern && !pattern.test(value)) {
            setValidity(prev => ({ ...prev, [field]: 'invalid' }));
            return;
        }

        setValidity(prev => ({ ...prev, [field]: 'checking' }));
        try {
            const isAvailable = await authApi.validateField(field, value);
            setValidity(prev => ({ ...prev, [field]: isAvailable ? 'valid' : 'invalid' }));
        } catch (e) {
            console.error("Validation failed", e);
        }
    }, 800),
    []
  );

  // 1. Session Management
  useEffect(() => {
    const loadSession = async () => {
      const sessionId = localStorage.getItem('adt_reg_session');
      if (sessionId) {
        try {
          const data = await authApi.getSession(sessionId);
          if (data && Object.keys(data).length > 0) {
            setFormData(prev => ({ ...prev, ...data }));
          }
        } catch (e) {
          console.error("Failed to restore session", e);
        }
      } else {
        localStorage.setItem('adt_reg_session', `sess_${Math.random().toString(36).substr(2, 9)}`);
      }
    };
    loadSession();
  }, []);

  const syncToRedis = useCallback(
    debounce(async (data) => {
      const sessionId = localStorage.getItem('adt_reg_session');
      if (sessionId) {
        setIsSyncing(true);
        try {
          await authApi.saveSession(sessionId, data);
        } catch (e) {
          console.error("Redis sync failed", e);
        } finally {
          setIsSyncing(false);
        }
      }
    }, 1000),
    []
  );

  useEffect(() => {
    syncToRedis(formData);
  }, [formData, syncToRedis]);

  // 2. Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') setPasswordStrength(getPasswordStrength(value));
    if (['name', 'username', 'email', 'phone_number'].includes(name)) {
        checkAvailability(name, value);
    }
  };

  const toggleDomain = (domain: string) => {
    const current = formData.strong_domains;
    const next = current.includes(domain) 
      ? current.filter(d => d !== domain) 
      : [...current, domain];
    setFormData({ ...formData, strong_domains: next });
  };

  const addCustomDomain = () => {
    if (customDomain && !formData.strong_domains.includes(customDomain)) {
        setFormData({ ...formData, strong_domains: [...formData.strong_domains, customDomain] });
        setCustomDomain('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (Object.values(validity).some(v => v === 'invalid')) {
        setError("Please correct the errors in the form before proceeding.");
        return;
    }

    try {
      const data = await authApi.registerUser(formData);
      setIds({ userId: data.user_id, extensionId: data.extension_id });
      setStep(2);
      localStorage.removeItem('adt_reg_session');
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed.");
    }
  };

  if (step === 2) return <SuccessStep ids={ids} />;

  return (
    <div className="min-h-screen py-20 px-6 bg-black flex justify-center">
      <div className="max-w-3xl w-full p-10 glass-card animate-fade">
        <div className="flex justify-between items-center mb-8">
            <button className="btn-text !mb-0" onClick={() => router.push('/onboarding/developer')}>
                <ArrowLeft size={16} /> Back
            </button>
            {isSyncing && <span className="text-[10px] text-blue-500 animate-pulse uppercase font-bold">Syncing...</span>}
        </div>

        <h2 className="text-4xl font-extrabold gradient-text mb-2">Developer Registration</h2>
        <p className="text-gray-400 mb-10">Initialize your digital twin</p>
        
        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg mb-8 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-10">
          <section>
            <div className="flex items-center gap-2 text-blue-500 font-bold mb-6">
                <User size={18} /> <h3>Basic Identity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <input name="name" value={formData.name} placeholder="Full Name (Min 2, Letters Only)" onChange={handleInputChange} className={`w-full bg-zinc-900 border p-3 rounded-lg outline-none transition-colors ${validity.name === 'invalid' ? 'border-red-500' : 'border-zinc-800 focus:border-blue-500'}`} required />
                <div className="absolute right-3 top-4"><ValidationIcon status={validity.name} /></div>
              </div>

              <div className="relative">
                <input name="username" value={formData.username} placeholder="Username (Alphanumeric)" onChange={handleInputChange} className={`w-full bg-zinc-900 border p-3 rounded-lg outline-none transition-colors ${validity.username === 'invalid' ? 'border-red-500' : 'border-zinc-800 focus:border-blue-500'}`} required />
                <div className="absolute right-3 top-4"><ValidationIcon status={validity.username} /></div>
              </div>

              <div className="relative">
                <input name="email" value={formData.email} type="email" placeholder="Gmail Address (@gmail.com)" onChange={handleInputChange} className={`w-full bg-zinc-900 border p-3 rounded-lg outline-none transition-colors ${validity.email === 'invalid' ? 'border-red-500' : 'border-zinc-800 focus:border-blue-500'}`} required />
                <div className="absolute right-3 top-4"><ValidationIcon status={validity.email} /></div>
              </div>

              <div className="relative">
                <input name="phone_number" value={formData.phone_number} placeholder="Phone (10 Digits)" onChange={handleInputChange} className={`w-full bg-zinc-900 border p-3 rounded-lg outline-none transition-colors ${validity.phone_number === 'invalid' ? 'border-red-500' : 'border-zinc-800 focus:border-blue-500'}`} required />
                <div className="absolute right-3 top-4"><ValidationIcon status={validity.phone_number} /></div>
              </div>

              <select name="gender" value={formData.gender} onChange={handleInputChange} className="bg-zinc-900 border border-zinc-800 p-3 h-[50px] rounded-lg outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>

              <div className="relative">
                <input name="password" value={formData.password} type="password" placeholder="Password" onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg outline-none focus:border-blue-500" required />
                <div className="mt-2 h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-500 ${passwordStrength.color}`} style={{ width: `${(passwordStrength.score + 1) * 20}%` }} />
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Strength: <span className="text-white font-bold">{passwordStrength.text}</span></p>
                <p className="text-[10px] text-blue-400 mt-2 italic flex items-center gap-1"><Lock size={10} /> Tip: Use uppercase, numbers, and special chars (!@#$)</p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 text-purple-500 font-bold mb-6">
                <Code size={18} /> <h3>Technical Profile</h3>
            </div>
            <div className="space-y-6">
                <div>
                    <label className="text-xs text-gray-500 block mb-2">Experience Level</label>
                    <select name="experience_level" value={formData.experience_level} onChange={handleInputChange} className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-lg outline-none focus:border-purple-500">
                        <option value="Intern">Intern</option>
                        <option value="Junior">Junior</option>
                        <option value="Mid">Mid-Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead">Lead</option>
                        <option value="Principal">Principal</option>
                    </select>
                </div>

                <div>
                    <label className="text-xs text-gray-500 block mb-2">Strong Domains</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {domains.map(d => (
                            <span 
                                key={d} 
                                className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer border transition-all ${
                                    formData.strong_domains.includes(d) 
                                    ? 'bg-purple-500 border-purple-500 text-white' 
                                    : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-purple-500/50'
                                }`}
                                onClick={() => toggleDomain(d)}
                            >
                                {d}
                            </span>
                        ))}
                        {formData.strong_domains.filter(d => !domains.includes(d)).map(d => (
                            <span key={d} className="px-4 py-2 rounded-full text-xs font-bold bg-purple-500 border border-purple-500 text-white">
                                {d}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2 max-w-sm">
                        <input 
                            value={customDomain} 
                            placeholder="Other domain..." 
                            onChange={(e) => setCustomDomain(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 p-2 text-xs rounded outline-none focus:border-purple-500 flex-1"
                        />
                        <button type="button" onClick={addCustomDomain} className="bg-zinc-800 px-3 rounded text-[10px] hover:bg-zinc-700 transition-colors">Add</button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-xs text-gray-500 block">Showcase Your Best Work</label>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">JUDGEMENT ZONE</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mb-4 italic">Give us your best projects so we can judge your expertise properly.</p>
                    
                    <div className="space-y-2 mb-4">
                        {formData.github_project_urls.map((url, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 p-2 rounded text-sm group hover:border-blue-500/30 transition-all">
                                <span className="text-blue-400 truncate text-xs">{url}</span>
                                <button type="button" onClick={() => setFormData({...formData, github_project_urls: formData.github_project_urls.filter((_, i) => i !== idx)})} className="text-red-500 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                            </div>
                        ))}
                    </div>
                    {formData.github_project_urls.length < 5 && (
                        <>
                            <div className="flex gap-2">
                                <input 
                                    id="github_url_input"
                                    placeholder="https://github.com/user/repo" 
                                    className="bg-zinc-900 border border-zinc-800 p-2 text-sm rounded outline-none focus:border-blue-500 flex-1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = (e.target as HTMLInputElement).value;
                                            if (val && !formData.github_project_urls.includes(val)) {
                                                setFormData({...formData, github_project_urls: [...formData.github_project_urls, val]});
                                                (e.target as HTMLInputElement).value = '';
                                            }
                                        }
                                    }}
                                />
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        const input = document.getElementById('github_url_input') as HTMLInputElement;
                                        if (input.value && !formData.github_project_urls.includes(input.value)) {
                                            setFormData({...formData, github_project_urls: [...formData.github_project_urls, input.value]});
                                            input.value = '';
                                        }
                                    }} 
                                    className="bg-blue-600 px-4 rounded text-xs font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/10"
                                >
                                    ADD PROJECT
                                </button>
                            </div>
                            <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1 font-semibold">
                                <AlertTriangle size={10} /> Repository must be public for automated analysis
                            </p>
                        </>
                    )}
                </div>
            </div>
          </section>

          <button type="submit" className="btn-large !mt-12 shadow-lg shadow-blue-500/20">
            Initialize Digital Twin <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
