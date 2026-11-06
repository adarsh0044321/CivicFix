import React, { useState } from 'react';
import type { Complaint } from '../../types';
import {
  Layers,
  Clock,
  ArrowRight,
  MapPin,
  RefreshCw,
} from 'lucide-react';

interface AdminCommandViewProps {
  complaints: Complaint[];
  onViewDetails: (complaint: Complaint) => void;
  onRefresh: () => void;
}

export const AdminCommandView: React.FC<AdminCommandViewProps> = ({
  complaints,
  onViewDetails,
  onRefresh,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState<boolean>(false);
  const [statFilter, setStatFilter] = useState<'ALL' | 'CRITICAL' | 'OVERDUE' | 'DUPLICATES'>('ALL');

  // Group complaints by duplicate cluster ID
  const duplicateClusters = complaints.reduce<Record<string, Complaint[]>>((acc, c) => {
    const groupId = c.duplicateGroupId || (c.isDuplicate || c.duplicate ? 'DUP-ROAD-001' : null);
    if (groupId) {
      if (!acc[groupId]) acc[groupId] = [];
      acc[groupId].push(c);
    }
    return acc;
  }, {});

  const filteredComplaints = complaints.filter((c) => {
    if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
    if (showDuplicatesOnly && !(c.isDuplicate || c.duplicate || c.duplicateGroupId)) return false;

    // Responsive Stat Cards Filter (Request 10)
    if (statFilter === 'CRITICAL' && c.priorityScore < 11 && c.urgency !== 'HIGH') return false;
    if (statFilter === 'OVERDUE' && !(c.isOverdue || c.urgency === 'HIGH')) return false;
    if (statFilter === 'DUPLICATES' && !(c.isDuplicate || c.duplicate || c.duplicateGroupId)) return false;

    return true;
  });

  const handleStatCardClick = (target: 'ALL' | 'CRITICAL' | 'OVERDUE' | 'DUPLICATES') => {
    setStatFilter((prev) => (prev === target ? 'ALL' : target));
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Municipal Command & Triage Center</h1>
          <p className="page-subtitle">
            PS-09 Municipal Oversight • Transparent Priority Scoring • Duplicate Clustering • SLA Escalation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="secondary-outline-btn" onClick={onRefresh}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            className={`secondary-outline-btn ${showDuplicatesOnly ? 'active' : ''}`}
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            style={{
              borderColor: showDuplicatesOnly ? '#0d9488' : 'var(--border-color)',
              color: showDuplicatesOnly ? '#0d9488' : 'var(--text-secondary)',
            }}
          >
            <Layers size={14} />
            <span>Duplicate Clusters ({Object.keys(duplicateClusters).length})</span>
          </button>
        </div>
      </div>

      {/* Admin KPI Ribbon - Interactive & Responsive Stat Filters */}
      <section className="stats-grid">
        <div
          className="stat-card"
          onClick={() => handleStatCardClick('ALL')}
          style={{
            cursor: 'pointer',
            border: statFilter === 'ALL' ? '2px solid #0d9488' : '1px solid var(--border-color)',
            background: statFilter === 'ALL' ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-card)',
            transition: 'all 0.18s ease',
          }}
          title="Click to show all active municipal complaints"
        >
          <div className="stat-card-top">
            <span className="stat-label">Active City Queue</span>
            <span className="trend-badge positive">All 5 Categories</span>
          </div>
          <span className="stat-number">{complaints.length}</span>
          <span className="stat-subtext">Live complaints in Supabase</span>
        </div>

        <div
          className="stat-card"
          onClick={() => handleStatCardClick('CRITICAL')}
          style={{
            cursor: 'pointer',
            border: statFilter === 'CRITICAL' ? '2px solid #ef4444' : '1px solid var(--border-color)',
            background: statFilter === 'CRITICAL' ? 'rgba(239, 68, 68, 0.06)' : 'var(--bg-card)',
            transition: 'all 0.18s ease',
          }}
          title="Click to filter by Critical / High Priority tickets only"
        >
          <div className="stat-card-top">
            <span className="stat-label">Critical / High Priority</span>
            <span className="trend-badge negative">Score &ge; 11/15</span>
          </div>
          <span className="stat-number" style={{ color: '#ef4444' }}>
            {complaints.filter((c) => c.priorityScore >= 11 || c.urgency === 'HIGH').length}
          </span>
          <span className="stat-subtext">
            {statFilter === 'CRITICAL' ? '✓ Filter Applied: Critical Only' : 'Click to filter table'}
          </span>
        </div>

        <div
          className="stat-card"
          onClick={() => handleStatCardClick('OVERDUE')}
          style={{
            cursor: 'pointer',
            border: statFilter === 'OVERDUE' ? '2px solid #f59e0b' : '1px solid var(--border-color)',
            background: statFilter === 'OVERDUE' ? 'rgba(245, 158, 11, 0.06)' : 'var(--bg-card)',
            transition: 'all 0.18s ease',
          }}
          title="Click to filter by SLA Overdue or Approaching tickets"
        >
          <div className="stat-card-top">
            <span className="stat-label">SLA Approaching / Overdue</span>
            <span className="trend-badge" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#ca8a04' }}>
              &lt; 12h remaining
            </span>
          </div>
          <span className="stat-number" style={{ color: '#f59e0b' }}>
            {complaints.filter((c) => c.isOverdue || c.urgency === 'HIGH').length}
          </span>
          <span className="stat-subtext">
            {statFilter === 'OVERDUE' ? '✓ Filter Applied: Overdue Only' : 'Auto-escalation active'}
          </span>
        </div>

        <div
          className="stat-card"
          onClick={() => handleStatCardClick('DUPLICATES')}
          style={{
            cursor: 'pointer',
            border: statFilter === 'DUPLICATES' ? '2px solid #0d9488' : '1px solid var(--border-color)',
            background: statFilter === 'DUPLICATES' ? 'rgba(13, 148, 136, 0.06)' : 'var(--bg-card)',
            transition: 'all 0.18s ease',
          }}
          title="Click to filter duplicate candidate clusters"
        >
          <div className="stat-card-top">
            <span className="stat-label">Duplicate Clusters</span>
            <span className="trend-badge positive">Auto-deduplicated</span>
          </div>
          <span className="stat-number">{Object.keys(duplicateClusters).length}</span>
          <span className="stat-subtext">
            {statFilter === 'DUPLICATES' ? '✓ Filter Applied: Duplicates' : 'Multi-citizen grouped reports'}
          </span>
        </div>
      </section>

      {/* Active Stat Filter Banner */}
      {statFilter !== 'ALL' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13, 148, 136, 0.08)', border: '1px solid #0d9488', borderRadius: '8px', padding: '8px 16px', marginBottom: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            ⚡ Filter Active: Showing <strong>{statFilter === 'CRITICAL' ? 'Critical / High Priority (Score ≥ 11)' : statFilter === 'OVERDUE' ? 'SLA Approaching / Overdue' : 'Duplicate Clusters'}</strong> only ({filteredComplaints.length} records)
          </span>
          <button
            onClick={() => setStatFilter('ALL')}
            style={{ background: 'transparent', border: 'none', color: '#0d9488', fontSize: '12px', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear Filter (Show All)
          </button>
        </div>
      )}

      {/* Controls Bar: Category Filter & Status Filter */}
      <div className="admin-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Category Filter:
          </span>
          {['ALL', 'ROAD_DAMAGE', 'GARBAGE_WASTE', 'STREETLIGHT', 'DRAINAGE', 'WATER_SUPPLY'].map(
            (cat) => (
              <button
                key={cat}
                className={`pill-tab-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'ALL' ? 'All (5 Categories)' : cat.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Admin Queue Table */}
      <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              City-wide Grievance Triage Table
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredComplaints.length} complaint records with transparent priority explanations
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tracking ID</th>
                <th>Category</th>
                <th>Title & Description</th>
                <th>Location / GIS</th>
                <th>Transparent Priority</th>
                <th>SLA Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-teal-light)' }}>
                      #{c.complaintId}
                    </span>
                    {c.isDuplicate && (
                      <span className="dup-badge" title="Grouped into duplicate cluster">
                        Duplicate
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="category-pill-sm">{c.category.replace('_', ' ')}</span>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px', marginBottom: '2px' }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.description}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <MapPin size={13} color="var(--accent-teal-light)" />
                      <span>{c.addressText || 'Geo-mapped zone'}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: c.locationConfidence === 'LOW_VAGUE_TRIAGE' ? '#f59e0b' : '#16a34a', marginTop: '2px', fontWeight: 600 }}>
                      {c.locationConfidence === 'LOW_VAGUE_TRIAGE' ? '⚠️ Vague - Routed to Field Inspection' : '✓ Verified Landmark'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '13px',
                          color: c.priorityScore >= 11 ? '#ef4444' : c.priorityScore >= 7 ? '#f59e0b' : '#10b981',
                        }}
                      >
                        {c.priorityScore}/15
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ({c.urgency})
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Clock size={12} color="#f59e0b" />
                      <span>{new Date(c.slaDeadline).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${c.status.toLowerCase()}`}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <button
                      className="primary-teal-btn"
                      style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                      onClick={() => onViewDetails(c)}
                    >
                      <span>Triage / Dispatch</span>
                      <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
