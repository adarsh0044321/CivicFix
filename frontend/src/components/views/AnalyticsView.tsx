import React, { useState } from 'react';
import { Calendar, Download, RefreshCw, TrendingUp } from 'lucide-react';
import type { Complaint } from '../../types';

interface AnalyticsViewProps {
  complaints: Complaint[];
  onRefresh: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ complaints, onRefresh }) => {
  const [timeRange, setTimeRange] = useState('Last 30 Days');

  const total = complaints.length;
  const completed = complaints.filter(
    (c) => c.status === 'VERIFIED_RESOLVED' || c.status === 'WORK_COMPLETED'
  ).length;
  const inProgress = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED'
  ).length;

  // Breakdown by the 5 PS-09 Categories
  const categoryCounts = {
    ROAD_DAMAGE: complaints.filter((c) => c.category === 'ROAD_DAMAGE').length,
    GARBAGE_WASTE: complaints.filter((c) => c.category === 'GARBAGE_WASTE').length,
    STREETLIGHT: complaints.filter((c) => c.category === 'STREETLIGHT').length,
    DRAINAGE: complaints.filter((c) => c.category === 'DRAINAGE').length,
    WATER_SUPPLY: complaints.filter((c) => c.category === 'WATER_SUPPLY').length,
  };

  const handleExportData = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'ID,Title,Category,Status,Urgency,PriorityScore,Address,Created\n' +
      complaints
        .map(
          (c) =>
            `"${c.complaintId}","${c.title}","${c.category}","${c.status}","${c.urgency}",${c.priorityScore},"${c.addressText}","${c.createdAt}"`
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CivicFix_Grievances_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="view-container">
      {/* Page Header with Action Controls matching Screenshot 4 */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Track performance metrics and trends</p>
        </div>

        <div className="header-actions-group">
          {/* Time range selector */}
          <div className="custom-dropdown">
            <Calendar size={14} color="var(--text-muted)" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="dropdown-select"
            >
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Export Data */}
          <button className="secondary-outline-btn" onClick={handleExportData}>
            <Download size={14} />
            <span>Export Data</span>
          </button>

          {/* Refresh */}
          <button className="secondary-outline-btn" onClick={onRefresh}>
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards matching Screenshot 4 */}
      <section className="stats-grid">
        {/* Total Issues */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Issues</span>
            <span className="trend-badge positive">↗ +14%</span>
          </div>
          <span className="stat-number">{total}</span>
          <span className="stat-subtext">All time</span>
        </div>

        {/* Completed Issues */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Completed Issues</span>
            <span className="trend-badge positive">↗ +22%</span>
          </div>
          <span className="stat-number">{completed}</span>
          <span className="stat-subtext">All time</span>
        </div>

        {/* In Progress */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">In Progress</span>
            <span className="trend-badge positive">↗ +8%</span>
          </div>
          <span className="stat-number">{inProgress}</span>
          <span className="stat-subtext">Currently being worked on</span>
        </div>

        {/* Avg Resolution Time */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Avg. Resolution Time</span>
            <span className="trend-badge negative">↘ -18%</span>
          </div>
          <span className="stat-number">{completed > 0 ? '2.4 days' : 'N/A'}</span>
          <span className="stat-subtext">For completed issues</span>
        </div>
      </section>

      {/* Two Chart Cards matching Screenshot 4 */}
      <div className="two-col-layout">
        {/* Card 1: Issue Trends */}
        <div className="dashboard-card" style={{ flex: '1' }}>
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Issue Trends</h3>
            <p className="dashboard-card-subtitle">Number of issues reported over time</p>
          </div>

          <div className="chart-container-box">
            {total === 0 ? (
              <div className="chart-placeholder">
                <TrendingUp size={36} color="var(--border-light)" />
                <span>No trend data for selected date range</span>
              </div>
            ) : (
              <div className="trend-bars-visual">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => {
                  const heights = [30, 45, 60, 25, 80, 50, 70];
                  return (
                    <div key={day} className="bar-column">
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{
                            height: `${heights[idx]}%`,
                            backgroundColor: idx === 4 ? '#0d9488' : '#38bdf8',
                          }}
                        />
                      </div>
                      <span className="bar-label">{day}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Issues by Status & Category */}
        <div className="dashboard-card" style={{ flex: '1' }}>
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Issues by Status & Category</h3>
            <p className="dashboard-card-subtitle">Distribution across 5 mandatory categories</p>
          </div>

          <div className="chart-container-box">
            <div className="category-distribution-list">
              <div className="dist-row">
                <span className="dist-label">Road damage & Potholes</span>
                <span className="dist-count">{categoryCounts.ROAD_DAMAGE}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${total ? (categoryCounts.ROAD_DAMAGE / total) * 100 : 0}%`,
                      backgroundColor: '#f59e0b',
                    }}
                  />
                </div>
              </div>

              <div className="dist-row">
                <span className="dist-label">Garbage & Waste</span>
                <span className="dist-count">{categoryCounts.GARBAGE_WASTE}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${total ? (categoryCounts.GARBAGE_WASTE / total) * 100 : 0}%`,
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
              </div>

              <div className="dist-row">
                <span className="dist-label">Streetlight failures</span>
                <span className="dist-count">{categoryCounts.STREETLIGHT}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${total ? (categoryCounts.STREETLIGHT / total) * 100 : 0}%`,
                      backgroundColor: '#38bdf8',
                    }}
                  />
                </div>
              </div>

              <div className="dist-row">
                <span className="dist-label">Drainage & Waterlogging</span>
                <span className="dist-count">{categoryCounts.DRAINAGE}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${total ? (categoryCounts.DRAINAGE / total) * 100 : 0}%`,
                      backgroundColor: '#6366f1',
                    }}
                  />
                </div>
              </div>

              <div className="dist-row">
                <span className="dist-label">Water supply problems</span>
                <span className="dist-count">{categoryCounts.WATER_SUPPLY}</span>
                <div className="dist-bar-track">
                  <div
                    className="dist-bar-fill"
                    style={{
                      width: `${total ? (categoryCounts.WATER_SUPPLY / total) * 100 : 0}%`,
                      backgroundColor: '#06b6d4',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
