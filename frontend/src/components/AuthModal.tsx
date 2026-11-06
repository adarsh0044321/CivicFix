import React, { useState } from 'react';
import { X, Lock, Mail, Shield, User, Wrench, CheckCircle, Loader2 } from 'lucide-react';
import type { UserRole } from '../types';
import { loginUser } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onSelectRole: (role: UserRole, name: string, email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onSelectRole,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'demo'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const demoAccounts = [
    {
      role: 'CITIZEN' as UserRole,
      title: 'Citizen Account',
      name: 'Rohan Sharma',
      email: 'citizen@civicfix.gov.in',
      password: 'Citizen@123',
      icon: <User size={18} color="#0d9488" />,
      color: '#0d9488',
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Municipal Administrator',
      name: 'Elena Vance',
      email: 'admin@civicfix.gov.in',
      password: 'Admin@123',
      icon: <Shield size={18} color="#ef4444" />,
      color: '#ef4444',
    },
    {
      role: 'WORKER' as UserRole,
      title: 'Field Contractor',
      name: 'ABC Construction Ltd',
      email: 'worker@civicfix.gov.in',
      password: 'Worker@123',
      icon: <Wrench size={18} color="#d97706" />,
      color: '#d97706',
    },
  ];

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(email, password);
      onSelectRole(res.user.role, res.user.fullName, res.user.email);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (demo: typeof demoAccounts[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await loginUser(demo.email, demo.password);
      onSelectRole(res.user.role, res.user.fullName, res.user.email);
      onClose();
    } catch (err: any) {
      // Fallback if backend offline
      onSelectRole(demo.role, demo.name, demo.email);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '420px', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {authMode === 'login' ? 'Account Login' : 'Select Demo Persona'}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Sign in to CivicFix Municipal Portal
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', fontSize: '12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        {/* Tab switch */}
        <div style={{ display: 'flex', background: 'var(--bg-subtle)', borderRadius: '8px', padding: '3px', marginBottom: '18px' }}>
          <button
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              background: authMode === 'login' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'login' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onClick={() => setAuthMode('login')}
          >
            Sign In
          </button>
          <button
            style={{
              flex: 1,
              padding: '6px',
              fontSize: '12px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '6px',
              background: authMode === 'demo' ? 'var(--bg-card)' : 'transparent',
              color: authMode === 'demo' ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
            onClick={() => setAuthMode('demo')}
          >
            Quick Demo Personas
          </button>
        </div>

        {authMode === 'login' ? (
          <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Email Address</label>
              <div className="input-with-icon">
                <div className="input-icon-box" style={{ padding: '8px 10px' }}>
                  <Mail size={15} color="var(--text-muted)" />
                </div>
                <input
                  type="email"
                  className="custom-input"
                  placeholder="admin@civicfix.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '12px' }}>Password</label>
              <div className="input-with-icon">
                <div className="input-icon-box" style={{ padding: '8px 10px' }}>
                  <Lock size={15} color="var(--text-muted)" />
                </div>
                <input
                  type="password"
                  className="custom-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="primary-teal-btn"
              style={{ justifyContent: 'center', marginTop: '6px', padding: '10px' }}
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="spin" /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {demoAccounts.map((acc) => (
              <div
                key={acc.role}
                onClick={() => handleDemoSelect(acc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: currentRole === acc.role ? `1.5px solid ${acc.color}` : '1px solid var(--border-color)',
                  background: currentRole === acc.role ? 'var(--bg-subtle)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${acc.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {acc.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {acc.name}
                      </span>
                      <span style={{ fontSize: '10px', background: `${acc.color}20`, color: acc.color, padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {acc.title}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {acc.email}
                    </div>
                  </div>
                </div>
                {currentRole === acc.role && (
                  <CheckCircle size={16} color={acc.color} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
