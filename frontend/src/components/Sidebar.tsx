import React from 'react';
import {
  LayoutDashboard,
  FileText,
  MapPin,
  Briefcase,
  BarChart3,
  User as UserIcon,
  LogOut,
  Hammer,
  FileSpreadsheet,
  Shield,
} from 'lucide-react';
import type { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenReportModal: () => void;
  currentRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  onOpenAuthModal: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenReportModal,
  currentRole,
  onSwitchRole,
  onOpenAuthModal,
  onLogout,
}) => {
  return (
    <aside className="sidebar">
      {/* Brand Header matching Reference Screenshot */}
      <div className="brand-header">
        <div className="brand-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <span className="brand-title">CivicFix</span>
      </div>

      {/* Primary Action Button - Role Partitioned */}
      {currentRole === 'CITIZEN' && (
        <button
          className="report-action-btn"
          onClick={onOpenReportModal}
          title="Report a new civic issue"
        >
          <FileSpreadsheet size={18} />
          <span>Report an Issue</span>
        </button>
      )}

      {currentRole === 'ADMIN' && (
        <button
          className="report-action-btn"
          onClick={onOpenReportModal}
          title="Log a municipal emergency or official ticket"
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
        >
          <FileSpreadsheet size={18} />
          <span>+ Log Municipal Ticket</span>
        </button>
      )}

      {currentRole === 'WORKER' && (
        <button
          className="report-action-btn"
          onClick={() => onTabChange('reports')}
          title="View active repair assignments"
          style={{ background: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)' }}
        >
          <Hammer size={18} />
          <span>🔨 Active Work Queue</span>
        </button>
      )}

      {/* Navigation Menu */}
      <nav className="nav-menu">
        <button
          className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onTabChange('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>
            {currentRole === 'ADMIN'
              ? 'Command Dashboard'
              : currentRole === 'WORKER'
              ? 'Contractor Dashboard'
              : 'Dashboard'}
          </span>
        </button>

        {/* Role-Specific Reports Tab */}
        <button
          className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
          onClick={() => onTabChange('reports')}
        >
          <FileText size={18} />
          <span>
            {currentRole === 'ADMIN'
              ? 'View Reports'
              : currentRole === 'WORKER'
              ? 'Work Orders'
              : 'My Reports'}
          </span>
        </button>

        <button
          className={`nav-item ${currentTab === 'map' ? 'active' : ''}`}
          onClick={() => onTabChange('map')}
        >
          <MapPin size={18} />
          <span>{currentRole === 'WORKER' ? 'GIS Map & Zones' : 'GIS Map & Heatmap'}</span>
        </button>

        {/* Contractors Fleet (Admin Only) */}
        {currentRole === 'ADMIN' && (
          <button
            className={`nav-item ${currentTab === 'contractors' ? 'active' : ''}`}
            onClick={() => onTabChange('contractors')}
          >
            <Briefcase size={18} />
            <span>Contractors</span>
          </button>
        )}

        {/* Analytics (Admin Only) */}
        {currentRole === 'ADMIN' && (
          <button
            className={`nav-item ${currentTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onTabChange('analytics')}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </button>
        )}

        <button
          className={`nav-item ${currentTab === 'profile' ? 'active' : ''}`}
          onClick={() => onTabChange('profile')}
        >
          <UserIcon size={18} />
          <span>Profile</span>
        </button>

        {/* Quick Portal Switch Link if Resident */}
        {currentRole === 'CITIZEN' && (
          <button
            className="nav-item"
            onClick={() => onSwitchRole('ADMIN')}
            style={{
              marginTop: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#ef4444',
              border: '1px dashed rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
            }}
            title="Switch directly to Municipal Administrator Command Center"
          >
            <Shield size={18} color="#ef4444" />
            <span style={{ fontWeight: 700 }}>Admin Portal</span>
          </button>
        )}
      </nav>

      {/* Clean Sidebar Footer matching Reference Image 2 */}
      <div className="sidebar-footer">
        <button
          className="nav-item"
          style={{ padding: '10px 14px', width: '100%', justifyContent: 'flex-start' }}
          onClick={onLogout || onOpenAuthModal}
          title="Sign out to Dedicated Login Portal"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
