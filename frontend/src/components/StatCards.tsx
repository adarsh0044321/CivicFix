import React from 'react';
import { FileText, Clock, CheckCircle2, RotateCw } from 'lucide-react';
import type { Complaint } from '../types';

interface StatCardsProps {
  complaints: Complaint[];
  activeStat?: string;
  onSelectStat?: (stat: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ complaints, activeStat, onSelectStat }) => {
  const total = complaints.length;
  const inProgress = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
  ).length;
  const pendingApproval = complaints.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'AWAITING_VERIFICATION'
  ).length;
  const completed = complaints.filter(
    (c) => c.status === 'VERIFIED_RESOLVED' || c.status === 'WORK_COMPLETED'
  ).length;

  const handleCardClick = (statKey: string) => {
    if (onSelectStat) {
      onSelectStat(activeStat === statKey ? 'ALL' : statKey);
    }
  };

  return (
    <section className="stats-grid">
      {/* 1. Total Reports */}
      <div
        className="stat-card"
        onClick={() => handleCardClick('ALL')}
        style={{
          cursor: onSelectStat ? 'pointer' : 'default',
          border: activeStat === 'ALL' ? '2px solid #0d9488' : '1px solid var(--border-color)',
          background: activeStat === 'ALL' ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.18s ease',
        }}
        title="Click to view all reports"
      >
        <div className="stat-card-top">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488' }}>
            <FileText size={20} />
          </div>
          <span className="trend-badge positive">All Grievances</span>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-label">Total Reports</span>
          <span className="stat-number">{total}</span>
        </div>
      </div>

      {/* 2. In Progress */}
      <div
        className="stat-card"
        onClick={() => handleCardClick('IN_PROGRESS')}
        style={{
          cursor: onSelectStat ? 'pointer' : 'default',
          border: activeStat === 'IN_PROGRESS' ? '2px solid #0284c7' : '1px solid var(--border-color)',
          background: activeStat === 'IN_PROGRESS' ? 'rgba(2, 132, 199, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.18s ease',
        }}
        title="Click to filter by In Progress repairs"
      >
        <div className="stat-card-top">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#0284c7' }}>
            <RotateCw size={20} />
          </div>
          <span className="trend-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7' }}>Field Active</span>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-label">In Progress</span>
          <span className="stat-number">{inProgress}</span>
        </div>
      </div>

      {/* 3. Pending Approval */}
      <div
        className="stat-card"
        onClick={() => handleCardClick('PENDING')}
        style={{
          cursor: onSelectStat ? 'pointer' : 'default',
          border: activeStat === 'PENDING' ? '2px solid #d97706' : '1px solid var(--border-color)',
          background: activeStat === 'PENDING' ? 'rgba(217, 119, 6, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.18s ease',
        }}
        title="Click to filter by Pending Verification or Review"
      >
        <div className="stat-card-top">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <span className="trend-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' }}>Awaiting Review</span>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-label">Pending Approval</span>
          <span className="stat-number">{pendingApproval}</span>
        </div>
      </div>

      {/* 4. Completed */}
      <div
        className="stat-card"
        onClick={() => handleCardClick('COMPLETED')}
        style={{
          cursor: onSelectStat ? 'pointer' : 'default',
          border: activeStat === 'COMPLETED' ? '2px solid #16a34a' : '1px solid var(--border-color)',
          background: activeStat === 'COMPLETED' ? 'rgba(22, 163, 74, 0.05)' : 'var(--bg-card)',
          transition: 'all 0.18s ease',
        }}
        title="Click to filter by Completed & Verified issues"
      >
        <div className="stat-card-top">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
            <CheckCircle2 size={20} />
          </div>
          <span className="trend-badge positive">Verified Closed</span>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-label">Completed</span>
          <span className="stat-number">{completed}</span>
        </div>
      </div>
    </section>
  );
};
