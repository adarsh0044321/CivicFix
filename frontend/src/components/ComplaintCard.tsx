import React from 'react';
import { MapPin, Clock, ArrowRight, ThumbsUp, Check } from 'lucide-react';
import type { Complaint } from '../types';

interface ComplaintCardProps {
  complaint: Complaint;
  onViewDetails: (complaint: Complaint) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
  isUpvoted?: boolean;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({
  complaint,
  onViewDetails,
  onUpvote,
  isUpvoted = false,
}) => {
  // Compute progress percentage based on lifecycle state
  let progressPercent = 0;
  let statusClass = 'pending';
  let statusLabel = 'Pending';

  switch (complaint.status) {
    case 'SUBMITTED':
      progressPercent = 0;
      statusClass = 'pending';
      statusLabel = 'Pending';
      break;
    case 'ASSIGNED':
      progressPercent = 35;
      statusClass = 'progress';
      statusLabel = 'Assigned';
      break;
    case 'IN_PROGRESS':
      progressPercent = 65;
      statusClass = 'progress';
      statusLabel = 'In Progress';
      break;
    case 'WORK_COMPLETED':
    case 'AWAITING_VERIFICATION':
      progressPercent = 85;
      statusClass = 'verification';
      statusLabel = 'Verification';
      break;
    case 'VERIFIED_RESOLVED':
      progressPercent = 100;
      statusClass = 'resolved';
      statusLabel = 'Resolved';
      break;
    case 'REOPENED_DISPUTED':
      progressPercent = 30;
      statusClass = 'overdue';
      statusLabel = 'Reopened';
      break;
  }

  // Format time ago
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days ago`;
    } catch {
      return 'Recently';
    }
  };

  const isOverdueItem = Boolean(complaint.overdue || complaint.isOverdue);
  const isDuplicateItem = Boolean(complaint.duplicate || complaint.isDuplicate);

  return (
    <div className="complaint-card" onClick={() => onViewDetails(complaint)}>
      {/* Category & Status Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '2px' }}>
        <span className="category-tag">{complaint.category.replace('_', ' ')}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isOverdueItem && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#ef4444',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '2px 6px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              ⚠️ Overdue
            </span>
          )}
          {isDuplicateItem && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#8b5cf6',
                background: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '2px 6px',
                borderRadius: '9999px',
              }}
            >
              🔗 Duplicate
            </span>
          )}
          <span className={`status-pill ${statusClass}`}>
            <Clock size={12} />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="card-top">
        <h3 className="card-title">{complaint.title}</h3>
      </div>

      {/* Description Snippet */}
      <p className="card-desc">{complaint.description}</p>

      {/* Location Pin */}
      <div className="card-location">
        <MapPin size={13} color="var(--text-muted)" />
        <span>{complaint.addressText || complaint.city || 'Location mapped'}</span>
      </div>

      {/* Progress Bar matching Reference Image 2 */}
      <div className="card-progress-wrapper">
        <div className="progress-header">
          <span>Progress</span>
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{progressPercent}%</span>
        </div>
        <div className="progress-bar-bg">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              backgroundColor:
                progressPercent === 100
                  ? '#16a34a'
                  : progressPercent >= 65
                  ? '#0d9488'
                  : '#0284c7',
            }}
          />
        </div>
      </div>

      {/* Card Footer matching Reference Image 2 */}
      <div className="card-footer" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{formatTimeAgo(complaint.createdAt)}</span>
          {/* Strictly 1-vote toggle */}
          <button
            onClick={(e) => onUpvote(complaint.id, e)}
            className={`card-upvote-btn ${isUpvoted ? 'active' : ''}`}
            title={isUpvoted ? 'Confirmed by you (Click to remove)' : 'Confirm / Upvote (1 vote per user)'}
          >
            {isUpvoted ? <Check size={12} /> : <ThumbsUp size={12} />}
            <span>{complaint.upvoteCount}</span>
          </button>
        </div>

        <button
          className="view-details-btn"
          onClick={() => onViewDetails(complaint)}
        >
          <span>View Details</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
