import React from 'react';
import { StatCards } from '../StatCards';
import { ComplaintCard } from '../ComplaintCard';
import type { Complaint } from '../../types';
import { UserCheck, AlertCircle, Clock, Loader2, CheckCircle2, Hammer } from 'lucide-react';

interface CitizenDashboardViewProps {
  userName: string;
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  activeFilterTab: string;
  onFilterTabChange: (tab: string) => void;
  onViewDetails: (complaint: Complaint) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  onOpenReportModal: () => void;
  upvotedIds: Set<string>;
}

export const CitizenDashboardView: React.FC<CitizenDashboardViewProps> = ({
  userName,
  complaints,
  loading,
  error,
  activeFilterTab,
  onFilterTabChange,
  onViewDetails,
  onUpvote,
  onOpenReportModal,
  upvotedIds,
}) => {
  const [selectedStatCard, setSelectedStatCard] = React.useState<string>('ALL');

  // Filter complaints based on the active tab and clicked stat card
  const filteredList = complaints.filter((c) => {
    // Stat card filter
    if (selectedStatCard === 'IN_PROGRESS' && !(c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED')) {
      return false;
    }
    if (selectedStatCard === 'PENDING' && !(c.status === 'SUBMITTED' || c.status === 'AWAITING_VERIFICATION')) {
      return false;
    }
    if (selectedStatCard === 'COMPLETED' && !(c.status === 'VERIFIED_RESOLVED' || c.status === 'WORK_COMPLETED')) {
      return false;
    }

    // Pill tab filter
    if (activeFilterTab === 'Urgent') {
      return c.urgency === 'HIGH' || c.priorityScore >= 11;
    }
    if (activeFilterTab === 'Nearby') {
      return c.locationConfidence === 'HIGH_EXACT_GPS' || c.ward;
    }
    if (activeFilterTab === 'Following') {
      return c.upvoteCount > 0;
    }
    return true; // 'Recent Issues' or 'Messages'
  });

  return (
    <div className="view-container">
      {/* Page Header (Screenshot 1) */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {userName}</p>
      </div>

      {/* 4 Responsive Interactive Stat Cards */}
      <StatCards
        complaints={complaints}
        activeStat={selectedStatCard}
        onSelectStat={setSelectedStatCard}
      />

      {/* Filter Tabs matching Screenshot 1: Recent Issues | Urgent | Nearby | Following | Messages */}
      <div className="pill-tabs-bar">
        {['Recent Issues', 'Urgent', 'Nearby', 'Following', 'Messages'].map((tab) => (
          <button
            key={tab}
            className={`pill-tab-btn ${activeFilterTab === tab ? 'active' : ''}`}
            onClick={() => onFilterTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="loading-state-box">
          <Loader2 size={32} className="spin" style={{ margin: '0 auto 12px auto' }} />
          <div>Loading civic grievances from live database...</div>
        </div>
      ) : error ? (
        <div className="error-alert-box">
          <AlertCircle size={24} color="#ef4444" />
          <div>{error}</div>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="empty-state-box">
          <h3>No reports under this view</h3>
          <p>Be the first citizen to report an issue in your neighborhood.</p>
          <button className="report-action-btn" onClick={onOpenReportModal}>
            + Report an Issue
          </button>
        </div>
      ) : (
        <section className="complaints-grid">
          {filteredList.map((c) => (
            <ComplaintCard
              key={c.id}
              complaint={c}
              onViewDetails={onViewDetails}
              onUpvote={onUpvote}
              isUpvoted={upvotedIds.has(c.id)}
            />
          ))}
        </section>
      )}

      {/* Bottom Section: Real Dynamic Issue Activity & Upcoming Deadlines */}
      <div className="bottom-dashboard-grid">
        {/* Card 1: Issue Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Issue Activity</h3>
            <p className="dashboard-card-subtitle">Real-time status updates on municipal grievances</p>
          </div>
          <div className="activity-list">
            {complaints.slice(0, 3).length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recent activity recorded yet.
              </div>
            ) : (
              complaints.slice(0, 3).map((c) => {
                let icon = <Clock size={16} />;
                let bg = '#e0f2fe';
                let color = '#0284c7';
                let actionText = 'Under Review';

                if (c.status === 'VERIFIED_RESOLVED') {
                  icon = <CheckCircle2 size={16} />;
                  bg = '#dcfce7';
                  color = '#16a34a';
                  actionText = 'Citizen Verified & Resolved';
                } else if (c.status === 'AWAITING_VERIFICATION') {
                  icon = <CheckCircle2 size={16} />;
                  bg = 'rgba(13, 148, 136, 0.15)';
                  color = '#0d9488';
                  actionText = 'Repairs Complete • Verification Ready';
                } else if (c.status === 'IN_PROGRESS') {
                  icon = <Hammer size={16} />;
                  bg = '#fef3c7';
                  color = '#d97706';
                  actionText = 'Contractor In-Progress Field Repair';
                } else if (c.status === 'ASSIGNED') {
                  icon = <UserCheck size={16} />;
                  bg = '#e0f2fe';
                  color = '#0284c7';
                  actionText = `Dispatched to ${c.assignedWorkerName || 'Contractor'}`;
                } else {
                  icon = <AlertCircle size={16} />;
                  bg = 'rgba(239, 68, 68, 0.1)';
                  color = '#ef4444';
                  actionText = 'Lodged & Auto-Triaged';
                }

                return (
                  <div
                    key={c.id}
                    className="activity-item"
                    onClick={() => onViewDetails(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="activity-avatar" style={{ background: bg, color: color }}>
                      {icon}
                    </div>
                    <div className="activity-details">
                      <div className="activity-title">{actionText}</div>
                      <div className="activity-issue">
                        {c.complaintId}: {c.title} • {c.ward || 'Ward 26'}
                      </div>
                    </div>
                    <div className="activity-time">
                      {c.status === 'VERIFIED_RESOLVED' ? 'Resolved' : 'Active'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Card 2: Upcoming Deadlines */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Upcoming Deadlines</h3>
            <p className="dashboard-card-subtitle">Grievance resolutions & verification deadlines</p>
          </div>
          <div className="deadlines-list">
            {complaints.filter(c => c.status !== 'VERIFIED_RESOLVED').slice(0, 2).length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                All civic grievances are on track within their target resolution SLAs.
              </div>
            ) : (
              [...complaints.filter(c => c.status === 'AWAITING_VERIFICATION'), ...complaints.filter(c => c.status !== 'VERIFIED_RESOLVED' && c.status !== 'AWAITING_VERIFICATION')].slice(0, 2).map((c) => {
                const isAwaitingVerification = c.status === 'AWAITING_VERIFICATION';
                const isOverdue = c.overdue || c.isOverdue;

                return (
                  <div
                    key={c.id}
                    className="deadline-item-card"
                    onClick={() => onViewDetails(c)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="deadline-top">
                      <span className="deadline-name">
                        {isAwaitingVerification
                          ? 'Verification & Rating Sign-off'
                          : `Target SLA Redressal (${c.slaHours || 72}h)`}
                      </span>
                      <span
                        className={`deadline-badge ${
                          isAwaitingVerification
                            ? 'urgent'
                            : isOverdue
                            ? 'urgent'
                            : 'normal'
                        }`}
                        style={{
                          background: isAwaitingVerification ? 'rgba(13, 148, 136, 0.15)' : undefined,
                          color: isAwaitingVerification ? '#0d9488' : undefined,
                        }}
                      >
                        {isAwaitingVerification ? 'Action Required' : isOverdue ? 'Overdue' : 'On Track'}
                      </span>
                    </div>
                    <div className="deadline-issue">
                      {c.complaintId}: {c.title} • {c.ward || 'Bhubaneswar'}
                    </div>
                    <div className="deadline-time">
                      <Clock size={14} />
                      <span>
                        {isAwaitingVerification
                          ? 'Repair finished. Please inspect and approve.'
                          : c.slaDeadline
                          ? `Deadline: ${new Date(c.slaDeadline).toLocaleDateString()} ${new Date(c.slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Standard 72h municipal turnaround'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
