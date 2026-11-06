import React from 'react';
import { CheckCircle2, Wrench, ShieldCheck, Clock, AlertTriangle } from 'lucide-react';
import type { NotificationItem } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead?: () => void;
  onSelectNotification?: (item: NotificationItem) => void;
  onViewAll?: () => void;
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onSelectNotification,
  onViewAll,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'approval':
        return <ShieldCheck size={18} color="#0d9488" />;
      case 'assignment':
        return <Wrench size={18} color="#0284c7" />;
      case 'completion':
        return <CheckCircle2 size={18} color="#16a34a" />;
      case 'urgent':
        return <AlertTriangle size={18} color="#ef4444" />;
      default:
        return <Clock size={18} color="#eab308" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notifications-popover">
        <div className="notifications-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ fontSize: '11px', background: '#0d9488', color: '#fff', padding: '1px 7px', borderRadius: '9999px', fontWeight: 700 }}>
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              style={{
                fontSize: '12px',
                color: '#0d9488',
                cursor: 'pointer',
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                padding: '2px 4px',
              }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No notifications yet. You're completely up to date!
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className="notification-item"
                onClick={() => {
                  if (onSelectNotification) onSelectNotification(item);
                  onClose();
                }}
                style={{
                  cursor: 'pointer',
                  background: item.read ? 'transparent' : 'rgba(13, 148, 136, 0.04)',
                }}
              >
                <div className="notification-icon-wrapper">
                  {getIcon(item.type)}
                </div>
                <div className="notification-body" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="notification-title" style={{ fontWeight: item.read ? 600 : 700 }}>
                      {item.title}
                    </div>
                    {!item.read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d9488', display: 'inline-block', marginTop: '4px' }} />
                    )}
                  </div>
                  <div className="notification-subtitle">{item.subtitle}</div>
                  <div className="notification-time">{item.timestamp}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="notifications-footer">
          <button
            className="view-all-notifs-btn"
            onClick={() => {
              if (onViewAll) onViewAll();
              onClose();
            }}
          >
            View all grievances
          </button>
        </div>
      </div>
  );
};
