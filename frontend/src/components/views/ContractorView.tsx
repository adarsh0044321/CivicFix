import React, { useState, useEffect } from 'react';
import { Hammer, CheckCircle2, Star, MapPin, Clock, ArrowRight, ShieldAlert, Upload, Play, X, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Complaint, ComplaintStatus } from '../../types';

interface ContractorViewProps {
  complaints: Complaint[];
  userName: string;
  onViewDetails: (complaint: Complaint) => void;
  onTransitionStatus?: (
    id: string,
    targetStatus: ComplaintStatus,
    notes?: string,
    resolutionPhotoUrl?: string,
    disputeReason?: string
  ) => Promise<Complaint | void>;
}

export const ContractorView: React.FC<ContractorViewProps> = ({
  complaints,
  userName,
  onViewDetails,
  onTransitionStatus,
}) => {
  const [activeTab, setActiveTab] = useState('All Tenders');
  const [modalItem, setModalItem] = useState<Complaint | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [workNotes, setWorkNotes] = useState('Excavated damaged area, applied hot-mix asphalt base and compacted to municipal grade.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Rating State from Live Citizen Submissions
  const [ratingsList, setRatingsList] = useState<Array<{ rating: number; tag: string; comment: string; date: string }>>(() => {
    try {
      const stored = localStorage.getItem('civicfix_all_ratings');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    const handleRatingUpdate = () => {
      try {
        const stored = localStorage.getItem('civicfix_all_ratings');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setRatingsList(parsed);
        }
      } catch (e) {}
    };

    window.addEventListener('civicfix_rating_updated', handleRatingUpdate);
    return () => window.removeEventListener('civicfix_rating_updated', handleRatingUpdate);
  }, []);

  // Compute live weighted average contractor score
  const baseCount = 142;
  const baseSum = 142 * 4.8; // 681.6
  const extraSum = ratingsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
  const totalCount = baseCount + ratingsList.length;
  const liveAverageScore = ((baseSum + extraSum) / totalCount).toFixed(1);

  // Filter tasks based on status
  const activeProjects = complaints.filter(
    (c) => c.status === 'IN_PROGRESS' || c.status === 'ASSIGNED' || c.status === 'REOPENED_DISPUTED'
  );
  const awaitingVerification = complaints.filter(
    (c) => c.status === 'AWAITING_VERIFICATION'
  );
  const completedProjects = complaints.filter(
    (c) => c.status === 'VERIFIED_RESOLVED' || c.status === 'WORK_COMPLETED'
  );

  const getPresetProofPhotos = (category: string) => {
    switch (category) {
      case 'ROAD_DAMAGE':
        return [
          { label: 'Fresh Bitumen Pavement', url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80' },
          { label: 'Compacted Asphalt Patch', url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=600&auto=format&fit=crop&q=80' },
        ];
      case 'WATER_SUPPLY':
        return [
          { label: 'Sealed High-Pressure Valve', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80' },
          { label: 'New Municipal Pipe Segment', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80' },
        ];
      case 'STREETLIGHT':
        return [
          { label: 'Restored LED Luminaire', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80' },
          { label: 'Illuminated Junction', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80' },
        ];
      case 'DRAINAGE':
        return [
          { label: 'De-silted Concrete Culvert', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80' },
          { label: 'Unclogged Storm Drain', url: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80' },
        ];
      default:
        return [
          { label: 'Cleaned & Sanitized Site', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=80' },
        ];
    }
  };

  const handleStartWork = async (item: Complaint) => {
    if (!onTransitionStatus) return;
    try {
      await onTransitionStatus(item.id, 'IN_PROGRESS', 'Contractor field crew dispatched and commenced site repair.');
    } catch (e: any) {
      alert(e.message || 'Failed to update status');
    }
  };

  const handleOpenUploadModal = (item: Complaint) => {
    setModalItem(item);
    const presets = getPresetProofPhotos(item.category);
    setProofUrl(presets[0]?.url || 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=600&auto=format&fit=crop&q=80');
    setWorkNotes(`Field repair executed for ${item.category.replace('_', ' ')}. Replaced components and verified stability.`);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem || !onTransitionStatus) return;
    setIsSubmitting(true);
    try {
      await onTransitionStatus(
        modalItem.id,
        'AWAITING_VERIFICATION',
        workNotes,
        proofUrl
      );
      setModalItem(null);
    } catch (e: any) {
      alert(e.message || 'Failed to submit proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view-container">
      {/* Header matching Screenshot 3 */}
      <div className="page-header">
        <h1 className="page-title">Contractor Dashboard</h1>
        <p className="page-subtitle">Welcome back, {userName || 'ABC Construction'}</p>
      </div>

      {/* 4 Stat Cards matching Screenshot 3 */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' }}>
              <Hammer size={20} />
            </div>
            <span className="trend-badge positive">↑ +4</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Active Projects</span>
            <span className="stat-number">{activeProjects.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#ca8a04' }}>
              <Hammer size={20} />
            </div>
            <span className="trend-badge positive">Field Active</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">In-Progress Repairs</span>
            <span className="stat-number">{activeProjects.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488' }}>
              <Upload size={20} />
            </div>
            <span className="trend-badge" style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488' }}>Phase 11</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Awaiting Verification</span>
            <span className="stat-number">{awaitingVerification.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="trend-badge positive">Verified</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Completed & Closed</span>
            <span className="stat-number">{completedProjects.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
              <Star size={20} />
            </div>
            <span className="trend-badge positive">↑ ({totalCount} ratings)</span>
          </div>
          <div className="stat-card-bottom">
            <span className="stat-label">Contractor Score</span>
            <span className="stat-number">{liveAverageScore}/5</span>
          </div>
        </div>
      </section>

      {/* Two Column Layout matching Screenshot 3 */}
      <div className="two-col-layout">
        {/* Left Column (65%): Available Tenders */}
        <div className="dashboard-card" style={{ flex: '1.8' }}>
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Available Tenders & Work Orders</h3>
            <p className="dashboard-card-subtitle">Execute municipal repairs and submit completion proof for citizen verification</p>
          </div>

          {/* Sub-tabs */}
          <div className="pill-tabs-bar" style={{ marginBottom: '18px' }}>
            {['All Tenders', 'Active Repairs', 'Awaiting Verification', 'Closed'].map((tab) => (
              <button
                key={tab}
                className={`pill-tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* List of Tenders */}
          <div className="contractor-tenders-list">
            {complaints
              .filter((item) => {
                if (activeTab === 'Active Repairs') return item.status === 'IN_PROGRESS' || item.status === 'ASSIGNED' || item.status === 'REOPENED_DISPUTED';
                if (activeTab === 'Awaiting Verification') return item.status === 'AWAITING_VERIFICATION';
                if (activeTab === 'Closed') return item.status === 'VERIFIED_RESOLVED' || item.status === 'WORK_COMPLETED';
                return true;
              })
              .slice(0, 6)
              .map((item) => (
              <div key={item.id} className="tender-item-card">
                <div className="tender-top">
                  <div>
                    <span className="category-pill-sm">{item.category.replace('_', ' ')}</span>
                    <h4 className="tender-title">{item.title}</h4>
                  </div>
                  <span className={`status-pill ${item.status.toLowerCase()}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="tender-meta-row">
                  <div className="tender-meta-item">
                    <MapPin size={13} color="var(--accent-teal-light)" />
                    <span>{item.addressText || 'Mapped Zone'}</span>
                  </div>
                  <div className="tender-meta-item">
                    <Clock size={13} color="#f59e0b" />
                    <span>Deadline: {new Date(item.slaDeadline).toLocaleDateString()}</span>
                  </div>
                  {item.priorityScore >= 11 && (
                    <div className="tender-meta-item" style={{ color: '#ef4444', fontWeight: 600 }}>
                      <ShieldAlert size={13} />
                      <span>Priority: {item.priorityScore}/15</span>
                    </div>
                  )}
                </div>

                <div className="tender-actions-row">
                  <button className="secondary-outline-btn" onClick={() => onViewDetails(item)}>
                    <span>View Specifications</span>
                    <ArrowRight size={13} />
                  </button>

                  {/* Dynamic Action based on Phase 11 Workflow */}
                  {(item.status === 'ASSIGNED' || item.status === 'SUBMITTED' || item.status === 'REOPENED_DISPUTED') && (
                    <button
                      className="primary-teal-btn"
                      style={{ padding: '6px 14px', fontSize: '12px', background: '#0284c7' }}
                      onClick={() => handleStartWork(item)}
                    >
                      <Play size={13} />
                      <span>Start Repair Work</span>
                    </button>
                  )}

                  {item.status === 'IN_PROGRESS' && (
                    <button
                      className="primary-teal-btn"
                      style={{ padding: '6px 14px', fontSize: '12px', background: '#0d9488' }}
                      onClick={() => handleOpenUploadModal(item)}
                    >
                      <Upload size={13} />
                      <span>Upload Proof & Submit</span>
                    </button>
                  )}

                  {item.status === 'AWAITING_VERIFICATION' && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0d9488',
                        background: 'rgba(13, 148, 136, 0.12)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ⏳ Awaiting Citizen Verification
                    </span>
                  )}

                  {item.status === 'VERIFIED_RESOLVED' && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#10b981',
                        background: 'rgba(16, 185, 129, 0.12)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Verified & Closed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              className="view-all-link-btn"
              onClick={() => setActiveTab('All Tenders')}
            >
              <span>View All Tenders</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column (35%): Your Performance matching Screenshot 3 */}
        <div className="dashboard-card" style={{ flex: '1' }}>
          <div className="dashboard-card-header">
            <h3 className="dashboard-card-title">Your Performance</h3>
            <p className="dashboard-card-subtitle">Metrics and ratings</p>
          </div>

          <div className="performance-summary-box">
            {/* Big Live Rating Circle */}
            <div className="rating-badge-circular">
              <Star size={24} color="#0d9488" fill="#0d9488" />
            </div>
            <div className="rating-score-large">{liveAverageScore}</div>
            <div className="rating-count-label">Average Rating ({totalCount} verified repairs)</div>

            {/* 4 Performance Progress Bars */}
            <div className="performance-bars-list">
              <div className="perf-bar-item">
                <div className="perf-bar-header">
                  <span>On-time Completion</span>
                  <span className="perf-percent">94%</span>
                </div>
                <div className="perf-track">
                  <div className="perf-fill" style={{ width: '94%' }} />
                </div>
              </div>

              <div className="perf-bar-item">
                <div className="perf-bar-header">
                  <span>Quality Score</span>
                  <span className="perf-percent">92%</span>
                </div>
                <div className="perf-track">
                  <div className="perf-fill" style={{ width: '92%' }} />
                </div>
              </div>

              <div className="perf-bar-item">
                <div className="perf-bar-header">
                  <span>Budget Adherence</span>
                  <span className="perf-percent">98%</span>
                </div>
                <div className="perf-track">
                  <div className="perf-fill" style={{ width: '98%' }} />
                </div>
              </div>

              <div className="perf-bar-item">
                <div className="perf-bar-header">
                  <span>Communication</span>
                  <span className="perf-percent">90%</span>
                </div>
                <div className="perf-track">
                  <div className="perf-fill" style={{ width: '90%' }} />
                </div>
              </div>
            </div>

            {/* Dynamic Citizen Reviews */}
            {ratingsList.length > 0 && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px', textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  <span>Recent Citizen Feedback ({ratingsList.length})</span>
                </div>
                {ratingsList.slice(-2).reverse().map((r, i) => (
                  <div key={i} style={{ background: 'var(--bg-subtle)', borderRadius: '6px', padding: '8px 10px', marginBottom: '6px', fontSize: '11px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', fontWeight: 700, marginBottom: '2px' }}>
                      <span>{'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{r.date}</span>
                    </div>
                    {r.tag && (
                      <span style={{ fontSize: '10px', background: 'rgba(13, 148, 136, 0.12)', color: '#0d9488', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, display: 'inline-block', marginBottom: '3px' }}>
                        {r.tag}
                      </span>
                    )}
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>"{r.comment}"</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Phase 11: Work Completion Proof Upload Modal */}
      {modalItem && (
        <div className="modal-overlay" onClick={() => setModalItem(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '540px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="category-pill-sm">{modalItem.category.replace('_', ' ')}</span>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                  Submit Field Resolution Proof
                </h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => setModalItem(null)}
                style={{ width: '32px', height: '32px' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: 'rgba(13, 148, 136, 0.08)', border: '1px solid #0d9488', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#0d9488', marginBottom: '16px', fontWeight: 600 }}>
              🛡️ Anti-Fraud Check: In CivicFix, your submission transitions ticket #{modalItem.complaintId} to <strong>AWAITING_VERIFICATION</strong>. Only citizens or municipal admin can confirm resolution and close this ticket.
            </div>

            <form onSubmit={handleSubmitProof} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Select Field Completion Photo (Proof of Quality)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {getPresetProofPhotos(modalItem.category).map((preset) => (
                    <div
                      key={preset.url}
                      onClick={() => setProofUrl(preset.url)}
                      style={{
                        border: proofUrl === preset.url ? '2px solid #0d9488' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'var(--bg-subtle)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ height: '90px', overflow: 'hidden' }}>
                        <img src={preset.url} alt={preset.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '6px', fontSize: '11px', fontWeight: 600, color: proofUrl === preset.url ? '#0d9488' : 'var(--text-primary)', textAlign: 'center' }}>
                        {preset.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} color="var(--text-muted)" />
                  <input
                    type="url"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Or paste resolution photo URL..."
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Contractor Field Work Summary Notes
                </label>
                <textarea
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  rows={3}
                  required
                  placeholder="Detail repair procedure, materials used, compaction/pressure tests..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="secondary-outline-btn"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="primary-teal-btn"
                  style={{ padding: '8px 18px' }}
                >
                  {isSubmitting ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
                  <span>Submit for Citizen Verification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
