import React from 'react';
import { FileText, Clock, CheckCircle2, RotateCw } from 'lucide-react';
import type { Complaint } from '../types';

interface StatCardsProps {
  complaints: Complaint[];
}

export const StatCards: React.FC<StatCardsProps> = ({ complaints }) => {
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

  return (
    <section className="stats-grid">
      {/* 1. Total Reports */}
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

      {/* 2. In Progress */}
      <div className="stat-card">
        <div className="stat-card-top">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#0284c7' }}>
            <RotateCw size={20} />
          </div>
          <span className="trend-badge positive">↑ +5%</span>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-label">In Progress</span>
          <span className="stat-number">{inProgress}</span>
        </div>
      </div>

      {/* 3. Pending Approval */}
      <div className="stat-card">
        <div className="stat-card-top">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <span className="trend-badge negative">↓ -2%</span>
        </div>
        <div className="stat-card-bottom">
          <span className="stat-label">Pending Approval</span>
          <span className="stat-number">{pendingApproval}</span>
        </div>
      </div>

      {/* 4. Completed */}
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
  );
};
