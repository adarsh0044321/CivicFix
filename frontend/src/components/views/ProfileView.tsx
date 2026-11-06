import React, { useState } from 'react';
import { Mail, Building2, User, Phone, ShieldCheck, Check } from 'lucide-react';
import type { UserRole } from '../../types';

interface ProfileViewProps {
  userName: string;
  currentRole: UserRole;
  onUpdateName: (name: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  userName,
  currentRole,
  onUpdateName,
}) => {
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(
    currentRole === 'ADMIN'
      ? 'admin.officer@citygov.in'
      : currentRole === 'WORKER'
      ? 'contact@abc-construction.in'
      : 'jonn@example.com'
  );
  const [org, setOrg] = useState(
    currentRole === 'ADMIN'
      ? 'City Government Central Administration'
      : currentRole === 'WORKER'
      ? 'ABC Infrastructure & Civil Works'
      : 'Citizen Resident • Ward 12'
  );
  const [phone, setPhone] = useState('+91 98765 43210');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.trim());
  };

  const validatePhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, plus sign, spaces, hyphens and parentheses
    const sanitized = e.target.value.replace(/[^0-9+\-\s()]/g, '');
    setPhone(sanitized);
    if (sanitized && !validatePhone(sanitized)) {
      setPhoneError('Please enter a valid 10-digit phone number (e.g. +91 98765 43210)');
    } else {
      setPhoneError(null);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (e.target.value && !validateEmail(e.target.value)) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
    } else {
      setEmailError(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }
    if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number (e.g. +91 98765 43210)');
      return;
    }

    setEmailError(null);
    setPhoneError(null);
    onUpdateName(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="view-container" style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <h1 className="page-title">Profile & Account Settings</h1>
        <p className="page-subtitle">Manage your credentials, jurisdiction, and contact preferences</p>
      </div>

      <div className="dashboard-card" style={{ padding: '32px' }}>
        <form onSubmit={handleSave} className="profile-form">
          {/* Role Pill Banner */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '18px' }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>{name}</h3>
                <span className={`role-badge-pill ${currentRole.toLowerCase()}`}>
                  <ShieldCheck size={12} />
                  {currentRole === 'ADMIN' ? 'Municipal Administrator' : currentRole === 'WORKER' ? 'Field Contractor' : 'Verified Citizen'}
                </span>
              </div>
            </div>
            {saved && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
                <Check size={16} /> Changes Saved!
              </span>
            )}
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div className="input-with-icon">
              <div className="input-icon-box">
                <User size={16} color="var(--text-muted)" />
              </div>
              <input
                type="text"
                className="custom-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email matching Screenshot 5 */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-with-icon">
              <div className="input-icon-box">
                <Mail size={16} color="var(--text-muted)" />
              </div>
              <input
                type="email"
                className="custom-input"
                value={email}
                onChange={handleEmailChange}
                required
                style={{ borderColor: emailError ? '#ef4444' : undefined }}
              />
            </div>
            {emailError && (
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                {emailError}
              </span>
            )}
          </div>

          {/* Organization matching Screenshot 5 */}
          <div className="form-group">
            <label className="form-label">Organization</label>
            <div className="input-with-icon">
              <div className="input-icon-box">
                <Building2 size={16} color="var(--text-muted)" />
              </div>
              <input
                type="text"
                className="custom-input"
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <div className="input-with-icon">
              <div className="input-icon-box">
                <Phone size={16} color="var(--text-muted)" />
              </div>
              <input
                type="tel"
                className="custom-input"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="+91 98765 43210"
                required
                style={{ borderColor: phoneError ? '#ef4444' : undefined }}
              />
            </div>
            {phoneError && (
              <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginTop: '4px', display: 'block' }}>
                {phoneError}
              </span>
            )}
          </div>

          {/* Save Changes Teal Button matching Screenshot 5 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button type="submit" className="primary-teal-btn" style={{ padding: '10px 24px' }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
