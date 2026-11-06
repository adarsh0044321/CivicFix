import React, { useState } from 'react';
import { Search, X, Clock, MapPin, Building2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { getPublicComplaint } from '../../services/api';
import type { Complaint } from '../../types';

interface PublicTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialComplaintId?: string;
}

export const PublicTrackerModal: React.FC<PublicTrackerModalProps> = ({
  isOpen,
  onClose,
  initialComplaintId = '',
}) => {
  const [searchId, setSearchId] = useState(initialComplaintId);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchId.trim().toUpperCase();
    if (!cleanId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await getPublicComplaint(cleanId);
      setComplaint(res);
    } catch (err: any) {
      setComplaint(null);
      setError(
        err.response?.data?.message ||
        `No grievance found with Tracking ID "${cleanId}". Please verify your ticket number.`
      );
    } finally {
      setLoading(false);
    }
  };

  const getTimelineSteps = (status: string) => {
    const steps = [
      { label: 'Grievance Submitted', desc: 'Recorded & Triaged by AI', state: 'done' },
      { label: 'Department Routed', desc: 'Dispatched to Municipal Cell', state: 'done' },
      { label: 'Field Repair in Progress', desc: 'Contractor working on site', state: 'pending' },
      { label: 'Resolution Proof Uploaded', desc: 'Awaiting citizen verification', state: 'pending' },
      { label: 'Verified & Closed', desc: 'Inspected and resolved', state: 'pending' },
    ];

    if (status === 'ASSIGNED') {
      steps[1].state = 'active';
    } else if (status === 'IN_PROGRESS') {
      steps[1].state = 'done';
      steps[2].state = 'active';
    } else if (status === 'AWAITING_VERIFICATION') {
      steps[1].state = 'done';
      steps[2].state = 'done';
      steps[3].state = 'active';
    } else if (status === 'VERIFIED_RESOLVED' || status === 'WORK_COMPLETED') {
      steps[1].state = 'done';
      steps[2].state = 'done';
      steps[3].state = 'done';
      steps[4].state = 'done';
    } else if (status === 'REOPENED_DISPUTED') {
      steps[1].state = 'done';
      steps[2].state = 'active';
      steps[3].state = 'alert';
    }

    return steps;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '100%', padding: '24px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(13, 148, 136, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0d9488',
              }}
            >
              <Search size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Public Grievance Tracker
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Track municipal resolution progress in real time (No sign-in required)
              </p>
            </div>
          </div>

          <button className="icon-btn" onClick={onClose} style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={15}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Complaint ID (e.g. CFX-2026-86435 or CFX-2026-10001)"
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="primary-teal-btn"
            style={{ padding: '0 20px', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <span>Track</span>}
          </button>
        </form>

        {/* Quick Demo ID pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Try Sample Tickets:</span>
          {['CFX-2026-86435', 'CFX-2026-10001', 'CFX-2026-10005'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSearchId(id);
                // Trigger auto-search
                setLoading(true);
                setError(null);
                getPublicComplaint(id)
                  .then((res) => setComplaint(res))
                  .catch(() => setError(`Grievance ${id} not found.`))
                  .finally(() => setLoading(false));
              }}
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              {id}
            </button>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div
            style={{
              padding: '14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#ef4444',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Complaint Details Card */}
        {complaint && (
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            {/* Top row: ID, Category, Status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#0d9488' }}>
                  #{complaint.complaintId}
                </span>
                <span className="category-pill-sm">{complaint.category.replace('_', ' ')}</span>
              </div>
              <span className={`status-pill ${complaint.status.toLowerCase()}`}>
                {complaint.status.replace('_', ' ')}
              </span>
            </div>

            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px 0', textAlign: 'left' }}>
              {complaint.title}
            </h3>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.5, textAlign: 'left' }}>
              {complaint.description}
            </p>

            {/* Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px', textAlign: 'left' }}>
              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <MapPin size={13} color="#0d9488" />
                  <span>Location</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {complaint.addressText}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {complaint.city} • {complaint.ward || 'Bhubaneswar'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  <Building2 size={13} color="#0d9488" />
                  <span>Department & Crew</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {complaint.departmentName || 'Public Works Dept'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Assigned: {complaint.assignedWorkerName || 'Contractor Team'}
                </div>
              </div>
            </div>

            {/* SLA Resolution Target */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-card)',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '18px',
                fontSize: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                <Clock size={14} color="#f59e0b" />
                <span>Target Resolution SLA:</span>
              </div>
              <strong style={{ color: complaint.isOverdue ? '#ef4444' : 'var(--text-primary)' }}>
                {new Date(complaint.slaDeadline).toLocaleDateString()} ({complaint.slaHours}h target)
              </strong>
            </div>

            {/* Visual Resolution Lifecycle Timeline */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Resolution Milestone Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getTimelineSteps(complaint.status).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background:
                          step.state === 'done'
                            ? '#10b981'
                            : step.state === 'active'
                            ? '#0d9488'
                            : step.state === 'alert'
                            ? '#ef4444'
                            : 'var(--border-color)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700,
                        marginTop: '1px',
                        flexShrink: 0,
                      }}
                    >
                      {step.state === 'done' ? '✓' : idx + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: step.state === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy notice */}
            <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>Public Privacy Protected: Citizen phone and personal credentials are masked.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
