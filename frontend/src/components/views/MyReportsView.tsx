import React from 'react';
import type { Complaint } from '../../types';
import { ComplaintCard } from '../ComplaintCard';
import { Plus, FileText, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MyReportsViewProps {
  complaints: Complaint[];
  userName?: string;
  onOpenReportModal: () => void;
  onViewDetails: (complaint: Complaint) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  upvotedIds: Set<string>;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  complaints,
  userName,
  onOpenReportModal,
  onViewDetails,
  onUpvote,
  upvotedIds,
}) => {
  // RLS Ownership Filter: Display only grievances reported by the logged-in citizen
  const myComplaints = complaints.filter(
    (c) =>
      !userName ||
      userName === 'Citizen Resident' ||
      c.reporterName === userName ||
      c.reporterName === 'Anonymous Citizen' ||
      (c.reporterName && c.reporterName.toLowerCase().includes('citizen'))
  );

  const total = myComplaints.length;
  const inProgress = myComplaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
  ).length;
  const pending = myComplaints.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'AWAITING_VERIFICATION'
  ).length;
  const completed = myComplaints.filter(
    (c) => c.status === 'VERIFIED_RESOLVED' || c.status === 'WORK_COMPLETED'
  ).length;

  return (
    <div className="view-container">
      {/* Header with '+ New Report' button matching Screenshot 2 */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">My Reports</h1>
          <p className="page-subtitle">Manage and track your reported issues</p>
        </div>
        <button className="primary-teal-btn" onClick={onOpenReportModal}>
          <Plus size={16} />
          <span>New Report</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488' }}>
              <FileText size={20} />
            </div>
            <span className="trend-badge positive">↑ +12%</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Total Reports</span>
            <span className="stat-number">{total}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#0284c7' }}>
              <Clock size={20} />
            </div>
            <span className="trend-badge positive">↑ +5%</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">In Progress</span>
            <span className="stat-number">{inProgress}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
              <AlertTriangle size={20} />
            </div>
            <span className="trend-badge negative">↓ -2%</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Pending Approval</span>
            <span className="stat-number">{pending}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="trend-badge positive">↑ +8%</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Completed</span>
            <span className="stat-number">{completed}</span>
          </div>
        </div>
      </section>

      {/* Main Reports Section + Monthly Statistics Banner */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Quick Statistics Banner */}
        <div className="dashboard-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This Month:</span>
                <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {total} reports
                </span>
              </div>
              <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Month:</span>
                <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  0 reports
                </span>
              </div>
              <div style={{ width: '1px', height: '18px', background: 'var(--border-color)' }} />
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Resolution Time:</span>
                <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 700, color: '#16a34a' }}>
                  7 days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Your Reports</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>All civic issues you have reported</p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing {myComplaints.length} issues
          </span>
        </div>

        {/* Reports Grid matching Reference UI Image 2 */}
        {myComplaints.length === 0 ? (
          <div className="empty-state-box">
            <FileText size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h3>No reports submitted yet</h3>
            <p>Report road damage, waste, streetlights, drainage or water supply problems in your area.</p>
            <button className="primary-teal-btn" style={{ margin: '16px auto 0' }} onClick={onOpenReportModal}>
              + Submit a Report
            </button>
          </div>
        ) : (
          <section className="complaints-grid">
            {myComplaints.map((c) => (
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
      </div>
    </div>
  );
};
