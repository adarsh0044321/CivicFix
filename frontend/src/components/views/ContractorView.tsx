import React, { useState, useEffect, useRef } from 'react';
import { Hammer, CheckCircle2, Star, MapPin, Clock, ArrowRight, ShieldAlert, Upload, Play, X, Loader2, Camera } from 'lucide-react';
import type { Complaint, ComplaintStatus } from '../../types';
import { uploadComplaintImage } from '../../services/api';

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
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
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
          { label: 'Fresh Bitumen Pavement', url: '/dummyimages/road_repair_completed.svg' },
          { label: 'Compacted Asphalt Patch', url: '/dummyimages/pothole_road_damage.jpg' },
        ];
      case 'WATER_SUPPLY':
        return [
          { label: 'Ductile Iron Pipe Segment', url: '/dummyimages/water_pipe_repair_completed.svg' },
          { label: 'Sealed High-Pressure Valve', url: '/dummyimages/burst_water_pipe.jpg' },
        ];
      case 'STREETLIGHT':
        return [
          { label: 'Restored 120W LED Luminaire', url: '/dummyimages/streetlight_repair_completed.svg' },
          { label: 'Phase Conductor Replaced', url: '/dummyimages/streetlight_luminaire.jpg' },
        ];
      case 'DRAINAGE':
        return [
          { label: 'De-silted Concrete Culvert', url: '/dummyimages/drain_repair_completed.svg' },
          { label: 'Unclogged Storm Drain', url: '/dummyimages/drainage_waterlogging.jpg' },
        ];
      default:
        return [
          { label: 'Sanitized Municipal Bin', url: '/dummyimages/waste_cleanup_completed.svg' },
          { label: 'Waste Cleared Container', url: '/dummyimages/garbage_overflow.jpg' },
        ];
    }
  };

  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedProofFile(file);
      setSelectedFileName(file.name);
      setProofUrl(URL.createObjectURL(file));
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
    setSelectedProofFile(null);
    setSelectedFileName('');
    const presets = getPresetProofPhotos(item.category);
    setProofUrl(presets[0]?.url || '/dummyimages/road_repair_completed.svg');
    setWorkNotes(`Field repair executed for ${item.category.replace('_', ' ')}. Replaced components and verified stability.`);
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalItem || !onTransitionStatus) return;
    setIsSubmitting(true);
    try {
      let finalUrl = proofUrl;
      if (selectedProofFile) {
        try {
          finalUrl = await uploadComplaintImage(selectedProofFile);
        } catch (uploadErr) {
          console.warn('Media upload fallback to data/blob URL:', uploadErr);
        }
      }
      await onTransitionStatus(
        modalItem.id,
        'AWAITING_VERIFICATION',
        workNotes,
        finalUrl
      );
      setModalItem(null);
      setSelectedProofFile(null);
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
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Upload Field Repair Completion Photo (Proof of Quality) *
                </label>

                {/* Real Native File Upload Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed #0d9488',
                    borderRadius: '10px',
                    padding: '20px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(13, 148, 136, 0.05)',
                    marginBottom: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Camera size={32} color="#0d9488" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {selectedFileName ? `Selected: ${selectedFileName}` : 'Click to Upload Repair Proof Photo'}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                    Browse files from your computer or capture directly from camera
                  </p>
                </div>

                {/* Live Photo Preview */}
                {proofUrl && (
                  <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #0d9488', marginBottom: '12px', maxHeight: '180px' }}>
                    <img src={proofUrl} alt="Repair Evidence" style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '6px 12px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>✓ Proof photo attached</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        style={{ background: '#0d9488', border: 'none', color: '#fff', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Testing Scenario Options */}
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                  Or select a quick test repair scenario:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  {getPresetProofPhotos(modalItem.category).map((preset) => (
                    <div
                      key={preset.url}
                      onClick={() => {
                        setProofUrl(preset.url);
                        setSelectedFileName(preset.label);
                      }}
                      style={{
                        border: proofUrl === preset.url ? '2px solid #0d9488' : '1px solid var(--border-color)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        background: 'var(--bg-subtle)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ height: '70px', overflow: 'hidden' }}>
                        <img src={preset.url} alt={preset.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '4px 6px', fontSize: '11px', fontWeight: 600, color: proofUrl === preset.url ? '#0d9488' : 'var(--text-primary)', textAlign: 'center' }}>
                        {preset.label}
                      </div>
                    </div>
                  ))}
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
