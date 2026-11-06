import React, { useState, useRef, useEffect } from 'react';
import { Search, Sun, Moon, Bell, User, FileText, LogOut, ArrowRightLeft, Shield, Wrench } from 'lucide-react';
import type { UserRole, NotificationItem } from '../types';
import { NotificationsPopover } from './NotificationsPopover';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  currentRole: UserRole;
  userName: string;
  userEmail?: string;
  onNavigateTab: (tab: string) => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  onSwitchRole?: (role: UserRole) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  isDarkMode,
  onToggleTheme,
  currentRole,
  userName,
  userEmail,
  onNavigateTab,
  onOpenLoginModal,
  onLogout,
  onSwitchRole,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const notifications: NotificationItem[] = [
    {
      id: '1',
      title: 'Your report has been approved',
      subtitle: 'Pothole on Main Street is now in bidding phase',
      timestamp: '2 hours ago',
      read: false,
      type: 'approval',
    },
    {
      id: '2',
      title: 'Contractor assigned',
      subtitle: 'ABC Construction will fix the broken water main',
      timestamp: 'Yesterday',
      read: false,
      type: 'assignment',
    },
    {
      id: '3',
      title: 'Work completed',
      subtitle: 'Graffiti removal has been marked as complete',
      timestamp: '3 days ago',
      read: true,
      type: 'completion',
    },
  ];

  return (
    <header className="topbar">
      {/* Search Input Box matching Reference Image 2 */}
      <div className="search-box">
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Right Controls matching Reference Image 2 */}
      <div className="topbar-right">
        {/* Prominent Quick Role Badge / Admin Login Gateway */}
        {currentRole === 'CITIZEN' && (
          <button
            onClick={() => {
              if (onSwitchRole) onSwitchRole('ADMIN');
              else onOpenLoginModal();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 13px',
              borderRadius: '8px',
              border: '1.5px solid #ef4444',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Log In to Municipal Administrator Command Triage"
          >
            <Shield size={14} />
            <span>Admin Login</span>
          </button>
        )}

        {currentRole === 'ADMIN' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <Shield size={13} />
            <span>MUNICIPAL ADMIN</span>
          </div>
        )}

        {currentRole === 'WORKER' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '8px',
              background: '#f59e0b',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}
          >
            <Wrench size={13} />
            <span>FIELD CONTRACTOR</span>
          </div>
        )}

        {/* Theme Toggle (Moon / Sun) */}
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#0f172a" />}
        </button>

        {/* Notifications Bell with Red Dot */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title="View Notifications"
          >
            <Bell size={18} />
            <span className="notification-dot" />
          </button>

          <NotificationsPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={notifications}
          />
        </div>

        {/* Clean Avatar Icon matching Reference Image 2 */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            className="goku-avatar-btn"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            title="My Account"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
              alt="User Avatar"
              className="goku-avatar-img"
            />
          </button>

          {/* Sleek Dropdown matching Reference Screenshot Image 2 */}
          {isMenuOpen && (
            <div className="account-dropdown-menu">
              <div className="account-dropdown-header">
                <div className="acc-name">{userName}</div>
                <div className="acc-email">{userEmail || 'citizen@civicfix.gov.in'}</div>
                <div className={`acc-role-badge ${currentRole.toLowerCase()}`}>
                  {currentRole === 'ADMIN' ? 'Administrator' : currentRole === 'WORKER' ? 'Field Contractor' : 'Citizen'}
                </div>
              </div>

              <div className="dropdown-divider" />

              <button
                className="dropdown-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateTab('profile');
                }}
              >
                <User size={15} />
                <span>Profile</span>
              </button>

              <button
                className="dropdown-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onNavigateTab('reports');
                }}
              >
                <FileText size={15} />
                <span>
                  {currentRole === 'ADMIN'
                    ? 'View Reports'
                    : currentRole === 'WORKER'
                    ? 'Work Orders'
                    : 'My Reports'}
                </span>
              </button>

              <div className="dropdown-divider" />

              {/* Direct Role Switching */}
              <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Switch Account / Role
              </div>

              {currentRole !== 'ADMIN' && (
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSwitchRole) onSwitchRole('ADMIN');
                  }}
                  style={{ color: '#ef4444' }}
                >
                  <Shield size={14} />
                  <span>Switch to Municipal Admin</span>
                </button>
              )}

              {currentRole !== 'WORKER' && (
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSwitchRole) onSwitchRole('WORKER');
                  }}
                  style={{ color: '#f59e0b' }}
                >
                  <Wrench size={14} />
                  <span>Switch to Contractor</span>
                </button>
              )}

              {currentRole !== 'CITIZEN' && (
                <button
                  className="dropdown-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onSwitchRole) onSwitchRole('CITIZEN');
                  }}
                  style={{ color: '#0d9488' }}
                >
                  <User size={14} />
                  <span>Switch to Citizen</span>
                </button>
              )}

              <button
                className="dropdown-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenLoginModal();
                }}
              >
                <ArrowRightLeft size={14} />
                <span>Open Login Gateway</span>
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-menu-item logout"
                onClick={() => {
                  setIsMenuOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={15} />
                <span>Log out to Login Page</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
