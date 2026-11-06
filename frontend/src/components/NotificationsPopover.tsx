import React from 'react';
import { CheckCircle2, Wrench, ShieldCheck, Clock } from 'lucide-react';
import type { NotificationItem } from '../types';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
}

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({
  isOpen,
  onClose,
  notifications,
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
      default:
        return <Clock size={18} color="#eab308" />;
    }
  };

  return (
    <>
      {/* Invisible backdrop to dismiss on click outside */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
        }}
        onClick={onClose}
      />

      {/* Notifications Popover Dropdown matching Screenshot 5 */}
      <div className="notifications-popover">
        <div className="notifications-header">
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
            Notifications
          </span>
          <span style={{ fontSize: '12px', color: 'var(--accent-teal-light)', cursor: 'pointer', fontWeight: 600 }}>
            Mark all read
          </span>
        </div>

        <div className="notifications-list">
          {notifications.map((item) => (
            <div key={item.id} className="notification-item">
              <div className="notification-icon-wrapper">
                {getIcon(item.type)}
              </div>
              <div className="notification-body">
                <div className="notification-title">{item.title}</div>
                <div className="notification-subtitle">{item.subtitle}</div>
                <div className="notification-time">{item.timestamp}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="notifications-footer">
          <button className="view-all-notifs-btn" onClick={onClose}>
            View all notifications
          </button>
        </div>
      </div>
    </>
  );
};
