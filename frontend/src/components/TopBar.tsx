import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Sun, Moon, Bell, User, FileText, LogOut, ArrowRightLeft, Shield, Wrench } from 'lucide-react';
import type { UserRole, NotificationItem, Complaint } from '../types';
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
  complaints?: Complaint[];
  onSelectComplaint?: (complaint: Complaint) => void;
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
  complaints = [],
  onSelectComplaint,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Read status persistence
  const [readNotifIds, setReadNotifIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('civicfix_read_notifs');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate dynamic, real-time notifications from active complaints and role
  const dynamicNotifications: NotificationItem[] = useMemo(() => {
    const items: NotificationItem[] = [];

    complaints.forEach((c) => {
      const isRead = readNotifIds.has(c.id);

      if (currentRole === 'CITIZEN') {
        if (c.status === 'VERIFIED_RESOLVED') {
          items.push({
            id: `notif-res-${c.id}`,
            complaintId: c.id,
            title: 'Resolution Officially Verified & Closed',
            subtitle: `Ticket #${c.complaintId}: ${c.title}`,
            timestamp: 'Action Complete',
            read: isRead,
            type: 'completion',
          });
        } else if (c.status === 'AWAITING_VERIFICATION') {
          items.push({
            id: `notif-ver-${c.id}`,
            complaintId: c.id,
            title: 'Citizen Verification Requested',
            subtitle: `Contractor finished repair on #${c.complaintId}. Confirm fix quality.`,
            timestamp: 'Requires Action',
            read: isRead,
            type: 'approval',
          });
        } else if (c.status === 'IN_PROGRESS') {
          items.push({
            id: `notif-prog-${c.id}`,
            complaintId: c.id,
            title: 'Field Repair Mobilized',
            subtitle: `Assigned contractor is actively repairing #${c.complaintId}.`,
            timestamp: 'In Progress',
            read: isRead,
            type: 'assignment',
          });
        }
      } else if (currentRole === 'ADMIN') {
        if (c.priorityScore >= 11 || c.urgency === 'HIGH') {
          items.push({
            id: `notif-crit-${c.id}`,
            complaintId: c.id,
            title: `Critical Grievance (${c.priorityScore}/15)`,
            subtitle: `Immediate dispatch needed for #${c.complaintId}: ${c.title}`,
            timestamp: 'Urgent Triage',
            read: isRead,
            type: 'urgent',
          });
        }
        if (c.status === 'AWAITING_VERIFICATION') {
          items.push({
            id: `notif-admin-ver-${c.id}`,
            complaintId: c.id,
            title: 'Repair Proof Awaiting Audit',
            subtitle: `Contractor submitted photographic proof for ticket #${c.complaintId}.`,
            timestamp: 'Inspection Ready',
            read: isRead,
            type: 'approval',
          });
        }
      } else if (currentRole === 'WORKER') {
        if (c.status === 'ASSIGNED') {
          items.push({
            id: `notif-work-assign-${c.id}`,
            complaintId: c.id,
            title: 'New Work Order Dispatched',
            subtitle: `Municipal triage dispatched ticket #${c.complaintId} (${c.category}).`,
            timestamp: 'Pending Acceptance',
            read: isRead,
            type: 'assignment',
          });
        } else if (c.status === 'REOPENED_DISPUTED') {
          items.push({
            id: `notif-work-reopen-${c.id}`,
            complaintId: c.id,
            title: 'Work Order Disputed / Reopened',
            subtitle: `Resident rejected resolution for #${c.complaintId}. Re-inspection required.`,
            timestamp: 'Attention Needed',
            read: isRead,
            type: 'urgent',
          });
        }
      }
    });

    // Fallback notification if no complaints match
    if (items.length === 0) {
      items.push({
        id: 'notif-welcome',
        title: 'Municipal System Synchronized',
        subtitle: 'All civic grievances in your ward are monitored under SLA enforcement.',
        timestamp: 'Just now',
        read: readNotifIds.has('notif-welcome'),
        type: 'approval',
      });
    }

    return items.slice(0, 8);
  }, [complaints, currentRole, readNotifIds]);

  const unreadCount = dynamicNotifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    const allIds = new Set(readNotifIds);
    dynamicNotifications.forEach((n) => {
      allIds.add(n.id);
      if (n.complaintId) allIds.add(n.complaintId);
    });
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('civicfix_read_notifs', JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const handleSelectNotification = (item: NotificationItem) => {
    const allIds = new Set(readNotifIds);
    allIds.add(item.id);
    if (item.complaintId) allIds.add(item.complaintId);
    setReadNotifIds(allIds);
    try {
      localStorage.setItem('civicfix_read_notifs', JSON.stringify(Array.from(allIds)));
    } catch {}

    if (item.complaintId && onSelectComplaint) {
      const match = complaints.find((c) => c.id === item.complaintId || c.complaintId === item.complaintId);
      if (match) onSelectComplaint(match);
    }
  };

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

        {/* Notifications Bell with Dynamic Red Dot & Counter */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="icon-btn"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title="View Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notification-dot" />}
          </button>

          <NotificationsPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
            notifications={dynamicNotifications}
            onMarkAllRead={handleMarkAllRead}
            onSelectNotification={handleSelectNotification}
            onViewAll={() => onNavigateTab(currentRole === 'ADMIN' ? 'reports' : 'reports')}
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
