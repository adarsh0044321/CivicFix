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
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
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
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
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
                type="text"
                className="custom-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
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
