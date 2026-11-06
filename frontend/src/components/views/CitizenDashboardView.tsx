import React from 'react';
import { StatCards } from '../StatCards';
import { ComplaintCard } from '../ComplaintCard';
import type { Complaint } from '../../types';
import { UserCheck, AlertCircle, Clock, Loader2 } from 'lucide-react';

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
  // Filter complaints based on the active tab
  const filteredList = complaints.filter((c) => {
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

      {/* 4 Stat Cards */}
      <StatCards complaints={complaints} />

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

      {/* Bottom Section matching Screenshot 1: Issue Activity & Upcoming Deadlines */}
      <div className="bottom-dashboard-grid">
        {/* Card 1: Issue Activity */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Issue Activity</h3>
            <p className="dashboard-card-subtitle">Recent updates on issues you're following</p>
          </div>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-avatar" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <UserCheck size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">Contractor assigned</div>
                <div className="activity-issue">Issue: Pothole Damage • Ward 12 Main Road</div>
              </div>
              <div className="activity-time">2 hours ago</div>
            </div>

            <div className="activity-item">
              <div className="activity-avatar" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <Clock size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">Inspection Scheduled</div>
                <div className="activity-issue">Issue: Overflowing Waste Bin • Station Square</div>
              </div>
              <div className="activity-time">5 hours ago</div>
            </div>

            <div className="activity-item">
              <div className="activity-avatar" style={{ background: '#fef3c7', color: '#d97706' }}>
                <AlertCircle size={18} />
              </div>
              <div className="activity-details">
                <div className="activity-title">Priority Escalated</div>
                <div className="activity-issue">Issue: Open Storm Drain Hazard • School Zone</div>
              </div>
              <div className="activity-time">Yesterday</div>
            </div>
          </div>
        </div>

        {/* Card 2: Upcoming Deadlines */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Upcoming Deadlines</h3>
            <p className="dashboard-card-subtitle">Issues requiring your attention</p>
          </div>
          <div className="deadlines-list">
            <div className="deadline-item-card">
              <div className="deadline-top">
                <span className="deadline-name">Bid submission & Dispatch</span>
                <span className="deadline-badge urgent">Urgent</span>
              </div>
              <div className="deadline-issue">Issue: Fallen Tree Blocking Avenue 4</div>
              <div className="deadline-time">
                <Clock size={14} />
                <span>Today, 5:00 PM (SLA Deadline)</span>
              </div>
            </div>

            <div className="deadline-item-card">
              <div className="deadline-top">
                <span className="deadline-name">Verification Sign-off</span>
                <span className="deadline-badge normal">Pending</span>
              </div>
              <div className="deadline-issue">Issue: Streetlight LED Replacement</div>
              <div className="deadline-time">
                <Clock size={14} />
                <span>Tomorrow, 12:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
