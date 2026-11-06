import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  Building2,
  Check,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  CornerUpLeft,
  Loader2,
  Lock,
  Star,
  Play,
  Hammer,
  Upload,
  Camera,
  ShieldAlert,
} from 'lucide-react';
import type { Complaint, UserRole, PriorityBreakdown, ComplaintStatus } from '../types';

interface ComplaintDetailModalProps {
  complaint: Complaint | null;
  onClose: () => void;
  onUpvote: (id: string) => void;
  currentRole: UserRole;
  isUpvoted?: boolean;
  onTransitionStatus?: (
    id: string,
    targetStatus: ComplaintStatus,
    notes?: string,
    resolutionPhotoUrl?: string,
    disputeReason?: string
  ) => Promise<any>;
}

const getCategoryRepairSvg = (cat: string) => {
  switch (cat) {
    case 'ROAD_DAMAGE': return '/dummyimages/road_repair_completed.svg';
    case 'WATER_SUPPLY': return '/dummyimages/water_pipe_repair_completed.svg';
    case 'STREETLIGHT': return '/dummyimages/streetlight_repair_completed.svg';
    case 'DRAINAGE': return '/dummyimages/drain_repair_completed.svg';
    default: return '/dummyimages/waste_cleanup_completed.svg';
  }
};

const getCategoryBeforeFallback = (cat: string) => {
  switch (cat) {
    case 'ROAD_DAMAGE': return '/dummyimages/pothole_road_damage.jpg';
    case 'WATER_SUPPLY': return '/dummyimages/burst_water_pipe.jpg';
    case 'STREETLIGHT': return '/dummyimages/streetlight_luminaire.jpg';
    case 'DRAINAGE': return '/dummyimages/drainage_waterlogging.jpg';
    default: return '/dummyimages/garbage_overflow.jpg';
  }
};

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  onClose,
  onUpvote,
  currentRole,
  isUpvoted = false,
  onTransitionStatus,
}) => {
  const [currentComplaint, setCurrentComplaint] = useState<Complaint | null>(complaint);
  const [isDisputing, setIsDisputing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [disputeInput, setDisputeInput] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Phase 12 & 13 State for Admin Assignment & Contractor Workflow
  const [selectedContractor, setSelectedContractor] = useState('ABC Construction Ltd (Road Maintenance)');
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Contractor Field Resolution Proof Upload States (Phase 11 & 13)
  const detailFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [contractorProofUrl, setContractorProofUrl] = useState<string>('');
  const [contractorProofName, setContractorProofName] = useState<string>('');
  const [contractorNotes, setContractorNotes] = useState<string>('');

  // Rating State
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<string>('⚡ Prompt 24h SLA');
  const [savedRating, setSavedRating] = useState<number>(0);

  // Synchronize internal state whenever incoming complaint prop changes
  useEffect(() => {
    setCurrentComplaint(complaint);
    setIsDisputing(false);
    setIsReopening(false);
    setDisputeInput('');
    if (complaint) {
      setContractorProofUrl(complaint.resolutionImageUrl || getCategoryRepairSvg(complaint.category));
      setContractorProofName('');
      setContractorNotes(
        complaint.resolutionNotes ||
        `Field repair completed by ABC Construction Ltd for ${complaint.category.replace('_', ' ')}. Replaced components and verified stability.`
      );
      try {
        const stored = localStorage.getItem(`civicfix_rating_${complaint.id}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setUserRating(parsed.rating || 0);
          setSavedRating(parsed.rating || 0);
          if (parsed.tag) setSelectedTag(parsed.tag);
        } else {
          setUserRating(0);
          setSavedRating(0);
        }
      } catch (e) {}
    }
  }, [complaint]);

  const activeComplaint = currentComplaint || complaint;

  const handleDetailFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setContractorProofName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setContractorProofUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdminAssign = async () => {
    if (!activeComplaint || !onTransitionStatus) return;
    setActionLoading(true);
    try {
      const notes = dispatchNotes.trim() || `Dispatched to ${selectedContractor} for high-priority municipal execution.`;
      const updated = await onTransitionStatus(activeComplaint.id, 'ASSIGNED', notes);
      if (updated) setCurrentComplaint(updated);
    } catch (e) {
      console.warn('Dispatch transition error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContractorAccept = async () => {
    if (!activeComplaint || !onTransitionStatus) return;
    setActionLoading(true);
    try {
      const notes = `Contractor ABC Construction Ltd accepted work order. Field mobilization initiated.`;
      const updated = await onTransitionStatus(activeComplaint.id, 'IN_PROGRESS', notes);
      if (updated) setCurrentComplaint(updated);
    } catch (e) {
      console.warn('Contractor accept error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContractorSubmitResolution = async () => {
    if (!activeComplaint || !onTransitionStatus) return;
    setActionLoading(true);
    try {
      const finalNotes = contractorNotes.trim() || `Field repair completed by ABC Construction Ltd according to municipal specifications.`;
      const finalProofUrl = contractorProofUrl || getCategoryRepairSvg(activeComplaint.category);
      const updated = await onTransitionStatus(activeComplaint.id, 'AWAITING_VERIFICATION', finalNotes, finalProofUrl);
      if (updated) setCurrentComplaint(updated);
    } catch (e) {
      console.warn('Resolution submission error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveRating = (star: number) => {
    if (!activeComplaint) return;
    try {
      const ratingObj = {
        rating: star,
        tag: selectedTag,
        date: new Date().toLocaleDateString(),
      };
      localStorage.setItem(`civicfix_rating_${activeComplaint.id}`, JSON.stringify(ratingObj));
      const existing = JSON.parse(localStorage.getItem('civicfix_all_ratings') || '[]');
      existing.push({
        rating: star,
        tag: selectedTag,
        comment: `Rated ${star} stars for "${activeComplaint.title}"`,
        date: 'Just now',
      });
      localStorage.setItem('civicfix_all_ratings', JSON.stringify(existing));
      setSavedRating(star);
      window.dispatchEvent(new Event('civicfix_rating_updated'));
    } catch (e) {
      console.warn('Could not save rating:', e);
    }
  };

  // Phase 10: Deterministic 15-point priority breakdown calculation & parsing
  // Note: All hooks must be called before any early returns to satisfy React Rules of Hooks
  const breakdown: PriorityBreakdown = useMemo(() => {
    if (!activeComplaint) {
      return {
        severity: 3,
        publicSafety: 2,
        peopleAffected: 2,
        duration: 0,
        confirmations: 0,
        totalScore: 5,
        urgency: 'MODERATE',
        targetSlaHours: 120,
        rationale: 'Mandated 15-point scoring formula',
      };
    }

    if (activeComplaint.priorityBreakdownJson) {
      try {
        const parsed = JSON.parse(activeComplaint.priorityBreakdownJson);
        return {
          severity: parsed.severity ?? 3,
          publicSafety: parsed.publicSafety ?? 2,
          peopleAffected: parsed.peopleAffected ?? 2,
          duration: parsed.duration ?? 0,
          confirmations: parsed.confirmations ?? 0,
          totalScore: parsed.totalScore ?? activeComplaint.priorityScore,
          urgency: parsed.urgency ?? activeComplaint.urgency,
          targetSlaHours: parsed.targetSlaHours ?? activeComplaint.slaHours ?? 120,
          rationale: parsed.rationale ?? 'Mandated 15-point scoring formula',
        };
      } catch {
        // fallback
      }
    }
    const score = activeComplaint.priorityScore || 5;
    const sev = Math.min(5, Math.max(1, Math.round(score * 0.35)));
    const pub = Math.min(4, Math.max(0, Math.round(score * 0.25)));
    const peo = Math.min(3, Math.max(0, Math.round(score * 0.2)));
    const dur = Math.min(2, Math.max(0, Math.round(score * 0.1)));
    const con = activeComplaint.upvoteCount >= 3 ? 1 : 0;
    return {
      severity: sev,
      publicSafety: pub,
      peopleAffected: peo,
      duration: dur,
      confirmations: con,
      totalScore: score,
      urgency: activeComplaint.urgency,
      targetSlaHours: activeComplaint.slaHours || 120,
      rationale: 'Mandated 15-point scoring formula',
    };
  }, [activeComplaint]);

  if (!activeComplaint) return null;

  const handleApprove = async () => {
    if (!onTransitionStatus || !activeComplaint) return;
    setActionLoading(true);
    try {
      const updated = await onTransitionStatus(
        activeComplaint.id,
        'VERIFIED_RESOLVED',
        'Citizen/Admin verified repair quality and confirmed problem is resolved on site.'
      );
      if (updated) {
        setCurrentComplaint(updated);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTransitionStatus || !activeComplaint) return;
    if (!disputeInput.trim()) {
      alert('Please specify why this repair is disputed (e.g. pothole not leveled, water still leaking).');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await onTransitionStatus(
        activeComplaint.id,
        'REOPENED_DISPUTED',
        'Citizen rejected resolution proof',
        undefined,
        disputeInput.trim()
      );
      if (updated) {
        setCurrentComplaint(updated);
      }
      setIsDisputing(false);
      setDisputeInput('');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenResolved = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onTransitionStatus || !activeComplaint) return;
    if (!disputeInput.trim()) {
      alert('Please state why you are reopening this issue (e.g. repair failed, damage recurred).');
      return;
    }
    setActionLoading(true);
    try {
      const updated = await onTransitionStatus(
        activeComplaint.id,
        'REOPENED_DISPUTED',
        'Citizen/Admin reopened resolved ticket due to recurring damage',
        undefined,
        disputeInput.trim()
      );
      if (updated) {
        setCurrentComplaint(updated);
      }
      setIsReopening(false);
      setDisputeInput('');
    } finally {
      setActionLoading(false);
    }
  };

  const calculateHoursRemaining = (deadlineStr: string) => {
    try {
      const diffMs = new Date(deadlineStr).getTime() - Date.now();
      const hours = Math.round(diffMs / (1000 * 60 * 60));
      return hours > 0 ? `${hours} hours remaining` : 'SLA Target Breached';
    } catch {
      return 'Within Target';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d9488', letterSpacing: '0.05em' }}>
                {activeComplaint.complaintId}
              </span>
              <span className="category-tag">{activeComplaint.category.replace('_', ' ')}</span>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textAlign: 'left' }}>
              {activeComplaint.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Overdue Breach Alert (Scenario B) */}
        {(activeComplaint.overdue || activeComplaint.isOverdue) && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#ef4444',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            ⚠️ SLA Target Breached — Escalated to Municipal Zonal Commissioner
          </div>
        )}

        {/* Duplicate Cluster Alert (Scenario A) */}
        {(activeComplaint.duplicate || activeComplaint.isDuplicate) && (
          <div
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid #8b5cf6',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#7c3aed',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            🔗 Linked to Duplicate Cluster {activeComplaint.duplicateGroupId || 'DUP-ROAD-001'} (Merged with master ticket)
          </div>
        )}

        {/* Vague Landmark Triage Alert (Scenario C) */}
        {activeComplaint.locationConfidence === 'LOW_VAGUE_TRIAGE' && (
          <div
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#d97706',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            📍 Anti-Silent Rejection: Vague text landmark detected. Accepted & routed for manual field triage.
          </div>
        )}

        {/* Phase 10: Transparent 15-Point Priority Breakdown & SLA Tracking */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                Transparent 15-Point Priority Score
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{activeComplaint.priorityScore} / 15 points</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: activeComplaint.priorityScore >= 11 ? 'rgba(239, 68, 68, 0.15)' : activeComplaint.priorityScore >= 6 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(13, 148, 136, 0.15)',
                    color: activeComplaint.priorityScore >= 11 ? '#ef4444' : activeComplaint.priorityScore >= 6 ? '#d97706' : '#0d9488',
                  }}
                >
                  {activeComplaint.urgency} URGENCY
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                SLA Resolution Target
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: (activeComplaint.isOverdue || activeComplaint.overdue) ? '#ef4444' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginTop: '2px' }}>
                <Clock size={14} color={(activeComplaint.isOverdue || activeComplaint.overdue) ? '#ef4444' : '#0d9488'} />
                <span>{(activeComplaint.isOverdue || activeComplaint.overdue) ? '⚠️ SLA BREACHED' : calculateHoursRemaining(activeComplaint.slaDeadline)}</span>
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                Target: {breakdown.targetSlaHours} hours SLA
              </div>
            </div>
          </div>

          {/* 5-Factor Score Meters (Mandated PS-09) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '12px' }}>
            {/* 1. Severity (0-5) */}
            <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>⚡ Severity</span>
                <strong style={{ color: 'var(--text-primary)' }}>{breakdown.severity}/5</strong>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(breakdown.severity / 5) * 100}%`, height: '100%', background: '#ef4444', borderRadius: '3px' }}></div>
              </div>
            </div>

            {/* 2. Public Safety (0-4) */}
            <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>🛡️ Safety Hazard</span>
                <strong style={{ color: 'var(--text-primary)' }}>{breakdown.publicSafety}/4</strong>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(breakdown.publicSafety / 4) * 100}%`, height: '100%', background: '#f59e0b', borderRadius: '3px' }}></div>
              </div>
            </div>

            {/* 3. People Affected (0-3) */}
            <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>👥 Commuters</span>
                <strong style={{ color: 'var(--text-primary)' }}>{breakdown.peopleAffected}/3</strong>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(breakdown.peopleAffected / 3) * 100}%`, height: '100%', background: '#3b82f6', borderRadius: '3px' }}></div>
              </div>
            </div>

            {/* 4. Duration (0-2) */}
            <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>⏳ Duration Open</span>
                <strong style={{ color: 'var(--text-primary)' }}>{breakdown.duration}/2</strong>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(breakdown.duration / 2) * 100}%`, height: '100%', background: '#8b5cf6', borderRadius: '3px' }}></div>
              </div>
            </div>

            {/* 5. Community Confirmations (0-1) */}
            <div style={{ background: 'var(--bg-card)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                <span>👍 Community</span>
                <strong style={{ color: 'var(--text-primary)' }}>{breakdown.confirmations}/1</strong>
              </div>
              <div style={{ height: '5px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(breakdown.confirmations / 1) * 100}%`, height: '100%', background: '#10b981', borderRadius: '3px' }}></div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>📐 <em>Formula: Severity (0-5) + Safety (0-4) + Commuters (0-3) + Age (0-2) + Upvotes (0-1)</em></span>
            <span style={{ fontWeight: 600, color: '#0d9488' }}>Deterministic Math</span>
          </div>
        </div>

        {/* Gemini AI Multimodal Triage Intelligence (Phase 8) */}
        <div
          style={{
            background: 'rgba(13, 148, 136, 0.05)',
            border: '1px solid rgba(13, 148, 136, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="#0d9488" />
              Gemini AI Multimodal Triage Intelligence
            </span>
            <span style={{ fontSize: '10px', background: 'rgba(13, 148, 136, 0.15)', color: '#0d9488', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              AI Confidence 92%
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Visual and textual attributes categorized as <strong>{activeComplaint.category.replace('_', ' ')}</strong> with estimated severity {activeComplaint.priorityScore >= 11 ? '5/5 (Critical)' : activeComplaint.priorityScore >= 7 ? '3/5 (Moderate)' : '2/5 (Routine)'}.
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
            Description
          </h4>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              background: 'var(--bg-subtle)',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
            }}
          >
            {activeComplaint.description}
          </p>
        </div>

        {/* Phase 11: Side-by-Side Before vs After Photographic Resolution Proof */}
        {(activeComplaint.imageUrl || activeComplaint.resolutionImageUrl || activeComplaint.status === 'AWAITING_VERIFICATION' || activeComplaint.status === 'VERIFIED_RESOLVED' || activeComplaint.status === 'REOPENED_DISPUTED') && (
          <div style={{ marginBottom: '20px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: 0, letterSpacing: '0.05em' }}>
                Photographic Evidence (Before vs After)
              </h4>
              <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 600 }}>
                Phase 11 Verification System
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: activeComplaint.status === 'SUBMITTED' || activeComplaint.status === 'ASSIGNED' ? '1fr' : '1fr 1fr', gap: '12px' }}>
              {/* 1. Before Photo */}
              <div style={{ background: 'var(--bg-subtle)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ padding: '6px 10px', background: 'rgba(0, 0, 0, 0.05)', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>📸 BEFORE (Reported)</span>
                  <span style={{ color: '#ef4444' }}>Initial Damage</span>
                </div>
                <div style={{ height: '170px', overflow: 'hidden' }}>
                  <img
                    src={activeComplaint.imageUrl || getCategoryBeforeFallback(activeComplaint.category)}
                    alt="Before Repair"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getCategoryBeforeFallback(activeComplaint.category);
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>

              {/* 2. After Photo (When in Verification, Resolved, or Disputed) */}
              {(activeComplaint.resolutionImageUrl || activeComplaint.status === 'AWAITING_VERIFICATION' || activeComplaint.status === 'VERIFIED_RESOLVED' || activeComplaint.status === 'REOPENED_DISPUTED') && (
                <div style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  border: activeComplaint.status === 'VERIFIED_RESOLVED'
                    ? '1.5px solid #10b981'
                    : activeComplaint.status === 'REOPENED_DISPUTED'
                    ? '1.5px solid #ef4444'
                    : '1.5px solid #0d9488'
                }}>
                  <div style={{
                    padding: '6px 10px',
                    background: activeComplaint.status === 'VERIFIED_RESOLVED'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : activeComplaint.status === 'REOPENED_DISPUTED'
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(13, 148, 136, 0.15)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: activeComplaint.status === 'VERIFIED_RESOLVED'
                      ? '#10b981'
                      : activeComplaint.status === 'REOPENED_DISPUTED'
                      ? '#ef4444'
                      : '#0d9488',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>🛠️ AFTER ({activeComplaint.status === 'REOPENED_DISPUTED' ? 'Disputed Proof' : 'Field Repair Proof'})</span>
                    <span>
                      {activeComplaint.status === 'VERIFIED_RESOLVED'
                        ? '✓ Verified'
                        : activeComplaint.status === 'REOPENED_DISPUTED'
                        ? '⚠️ Rejected / Reopened'
                        : 'Awaiting Review'}
                    </span>
                  </div>
                  <div style={{ height: '170px', overflow: 'hidden', position: 'relative' }}>
                    <img
                      src={activeComplaint.resolutionImageUrl || getCategoryRepairSvg(activeComplaint.category)}
                      alt="After Repair Proof"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getCategoryRepairSvg(activeComplaint.category);
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {activeComplaint.status === 'VERIFIED_RESOLVED' && (
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#10b981', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={12} />
                        <span>OFFICIALLY VERIFIED</span>
                      </div>
                    )}
                    {activeComplaint.status === 'REOPENED_DISPUTED' && (
                      <div style={{ position: 'absolute', bottom: '8px', right: '8px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AlertTriangle size={12} />
                        <span>PROOF REJECTED</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution Notes & Worker Sign-off */}
            {(activeComplaint.resolutionNotes || activeComplaint.status === 'AWAITING_VERIFICATION' || activeComplaint.status === 'VERIFIED_RESOLVED' || activeComplaint.status === 'REOPENED_DISPUTED') && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong>Contractor Work Summary:</strong> {activeComplaint.resolutionNotes || 'Field team excavated loose aggregate, laid hot-mix bituminous layer, and compacted with 8-ton vibratory roller according to municipal specifications.'}
              </div>
            )}
          </div>
        )}

        {/* Admin Command: Dispatch & Contractor Assignment Panel */}
        {currentRole === 'ADMIN' && (activeComplaint.status === 'SUBMITTED' || activeComplaint.status === 'ASSIGNED' || activeComplaint.status === 'REOPENED_DISPUTED') && (
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1.5px solid #0284c7',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldAlert size={18} color="#0284c7" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7', margin: 0 }}>
                Municipal Dispatch: Contractor Assignment & Triage
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Assign or dispatch this grievance to an authorized municipal contractor fleet with an enforced SLA work order.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
              <select
                value={selectedContractor}
                onChange={(e) => setSelectedContractor(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                <option value="ABC Construction Ltd (Road Maintenance)">ABC Construction Ltd (Road Maintenance)</option>
                <option value="Kalinga Drainage & Flood Control">Kalinga Drainage & Flood Control</option>
                <option value="Swachh Bhubaneswar Sanitation Fleet">Swachh Bhubaneswar Sanitation Fleet</option>
                <option value="SmartCity Power & Streetlight Grid">SmartCity Power & Streetlight Grid</option>
                <option value="Utkal Potable Water Works">Utkal Potable Water Works</option>
              </select>
              <input
                type="text"
                placeholder="Dispatch notes (e.g. 24h SLA Priority Dispatch)"
                value={dispatchNotes}
                onChange={(e) => setDispatchNotes(e.target.value)}
                style={{
                  flex: 1.2,
                  minWidth: '220px',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleAdminAssign}
                style={{
                  background: '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 18px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {actionLoading ? <Loader2 size={13} className="spin" /> : <Play size={13} />}
                <span>{activeComplaint.status === 'ASSIGNED' ? 'Re-assign Work Order' : 'Dispatch Work Order'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Contractor Workflow Panel: Accept Tender */}
        {currentRole === 'WORKER' && (activeComplaint.status === 'SUBMITTED' || activeComplaint.status === 'ASSIGNED' || activeComplaint.status === 'REOPENED_DISPUTED') && (
          <div
            style={{
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1.5px solid #ca8a04',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Hammer size={18} color="#ca8a04" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ca8a04', margin: 0 }}>
                Field Contractor Tender: Accept Work Order
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Assigned to ABC Construction Ltd. Accept this work order tender to transition ticket to <strong>IN_PROGRESS</strong> and commence on-site physical repair.
            </p>
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleContractorAccept}
              style={{
                background: '#ca8a04',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {actionLoading ? <Loader2 size={14} className="spin" /> : <Play size={14} />}
              <span>Accept Tender & Start Field Repairs</span>
            </button>
          </div>
        )}

        {/* Contractor Workflow Panel: In-Progress Resolution Submission */}
        {currentRole === 'WORKER' && activeComplaint.status === 'IN_PROGRESS' && (
          <div
            style={{
              background: 'rgba(13, 148, 136, 0.08)',
              border: '1.5px solid #0d9488',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Upload size={18} color="#0d9488" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0d9488', margin: 0 }}>
                Field Repair In Progress: Upload Completion Proof Photo
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Repair underway by ABC Construction Ltd. Select or capture your field resolution proof photo and provide work summary notes before requesting citizen verification.
            </p>

            {/* Native File Upload Input */}
            <input
              ref={detailFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleDetailFileSelect}
              style={{ display: 'none' }}
            />

            <div
              onClick={() => detailFileInputRef.current?.click()}
              style={{
                border: '2px dashed #0d9488',
                borderRadius: '10px',
                padding: '18px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(13, 148, 136, 0.04)',
                marginBottom: '12px',
                transition: 'all 0.15s ease',
              }}
            >
              <Camera size={30} color="#0d9488" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {contractorProofName ? `Selected: ${contractorProofName}` : 'Click to Upload Repair Proof Photo'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                Browse photos from device or take photo with camera
              </p>
            </div>

            {/* Live Photo Preview */}
            {contractorProofUrl && (
              <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid #0d9488', marginBottom: '12px', maxHeight: '160px' }}>
                <img
                  src={contractorProofUrl}
                  alt="Resolution Evidence Preview"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getCategoryRepairSvg(activeComplaint.category);
                  }}
                  style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.75)', color: '#fff', padding: '6px 12px', fontSize: '11px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>✓ Attached Field Proof Photo</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); detailFileInputRef.current?.click(); }}
                    style={{ background: '#0d9488', border: 'none', color: '#fff', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Change Photo
                  </button>
                </div>
              </div>
            )}

            {/* Quick Test Scenarios */}
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              Or choose verified test resolution scenario:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div
                onClick={() => setContractorProofUrl(getCategoryRepairSvg(activeComplaint.category))}
                style={{
                  border: contractorProofUrl === getCategoryRepairSvg(activeComplaint.category) ? '2px solid #0d9488' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: contractorProofUrl === getCategoryRepairSvg(activeComplaint.category) ? '#0d9488' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>🛠️ Fresh Completed Fix (SVG Proof)</span>
              </div>
              <div
                onClick={() => setContractorProofUrl(getCategoryBeforeFallback(activeComplaint.category))}
                style={{
                  border: contractorProofUrl === getCategoryBeforeFallback(activeComplaint.category) ? '2px solid #0d9488' : '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  background: 'var(--bg-card)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: contractorProofUrl === getCategoryBeforeFallback(activeComplaint.category) ? '#0d9488' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📸 Repaired Site Photo</span>
              </div>
            </div>

            {/* Work Notes */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Contractor Field Work Summary Notes
              </label>
              <textarea
                value={contractorNotes}
                onChange={(e) => setContractorNotes(e.target.value)}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>

            <button
              type="button"
              disabled={actionLoading}
              onClick={handleContractorSubmitResolution}
              style={{
                background: '#0d9488',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {actionLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
              <span>Submit Repair Proof &amp; Request Verification</span>
            </button>
          </div>
        )}

        {/* Phase 11 Resolution Verification Gate Card */}
        {activeComplaint.status === 'AWAITING_VERIFICATION' && (
          <div
            style={{
              background: 'rgba(13, 148, 136, 0.08)',
              border: '1.5px solid #0d9488',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldCheck size={18} color="#0d9488" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0d9488', margin: 0 }}>
                Phase 11: Resolution Verification Gate
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Field contractor uploaded proof of repair. Under CivicFix anti-fraud rules, <strong>contractors cannot close their own tickets</strong>. Citizen or Municipal Triage must confirm that the issue is satisfactorily fixed.
            </p>

            {/* Contractor Role Restriction: Strict Read-Only */}
            {currentRole === 'WORKER' ? (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  color: '#b45309',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Lock size={16} color="#d97706" />
                <span>
                  🔒 Contractor Read-Only: This ticket is awaiting citizen / municipal verification. Contractors are strictly prohibited from self-verifying or closing work orders.
                </span>
              </div>
            ) : (
              /* Citizen & Municipal Admin Verification Actions */
              <>
                {!isDisputing ? (
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={handleApprove}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {actionLoading ? <Loader2 size={14} className="spin" /> : <CheckCircle2 size={14} />}
                      <span>Approve & Mark Resolved</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setIsDisputing(true)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid #ef4444',
                        background: 'rgba(239, 68, 68, 0.08)',
                        color: '#ef4444',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={14} />
                      <span>Dispute Repair (+2 Escalation Penalty)</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleDispute} style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                      State Dispute Reason (Escalates Priority by +2 points):
                    </div>
                    <textarea
                      value={disputeInput}
                      onChange={(e) => setDisputeInput(e.target.value)}
                      placeholder="e.g. Loose gravel still spilling onto road, pothole edges not properly sealed, or water still pooling."
                      rows={2}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ef4444',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        marginBottom: '8px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {actionLoading ? <Loader2 size={14} className="spin" /> : <CornerUpLeft size={14} />}
                        <span>Confirm Dispute & Escalate (+2)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsDisputing(false);
                          setDisputeInput('');
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Interactive Citizen Rating & Contractor Performance Feedback */}
            <div style={{
              marginTop: '14px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <span>Rate Contractor Performance: ABC Construction Ltd</span>
                </div>
                {savedRating > 0 && (
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                    ✓ Rating Recorded ({savedRating}/5 Stars)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setUserRating(star);
                      handleSaveRating(star);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '22px',
                      lineHeight: 1,
                      color: (hoverRating || userRating) >= star ? '#f59e0b' : '#cbd5e1',
                      transition: 'transform 0.1s ease',
                    }}
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  {userRating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5/5)' : userRating === 4 ? '⭐⭐⭐⭐ High Quality (4/5)' : userRating === 3 ? '⭐⭐⭐ Satisfactory (3/5)' : userRating > 0 ? `${userRating}/5 Stars` : 'Click a star to submit live rating'}
                </span>
              </div>

              {/* Citizen Feedback Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['⚡ Prompt 24h SLA', '🛠️ High Quality Fix', '🧹 Clean Site Cleanup', '🤝 Courteous Field Crew'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: selectedTag === tag ? 'rgba(13, 148, 136, 0.15)' : 'var(--bg-subtle)',
                      border: '1px solid',
                      borderColor: selectedTag === tag ? '#0d9488' : 'var(--border-color)',
                      color: selectedTag === tag ? '#0d9488' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Reopened Disputed Alert Banner */}
        {activeComplaint.status === 'REOPENED_DISPUTED' && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1.5px solid #ef4444',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
              <AlertTriangle size={16} />
              <span>⚠️ TICKET REOPENED & ESCALATED (+2 PRIORITY PENALTY)</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>
              <strong>Citizen Dispute Reason:</strong> "{activeComplaint.disputeReason || 'Unsatisfactory field execution / issue recurred'}"
            </div>
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
              Automatic Escalation: Priority boosted by +2 points to {activeComplaint.priorityScore}/15 points. Reassigned to emergency dispatch.
            </div>
          </div>
        )}

        {/* Verified Resolved Seal Banner */}
        {activeComplaint.status === 'VERIFIED_RESOLVED' && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1.5px solid #10b981',
              borderRadius: '10px',
              padding: '14px 16px',
              marginBottom: '20px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: (currentRole === 'CITIZEN' || currentRole === 'ADMIN') ? '10px' : 0 }}>
              <CheckCircle2 size={24} color="#10b981" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#10b981' }}>
                  OFFICIALLY VERIFIED & CLOSED
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Resolution inspected and confirmed by community residents and municipal administration.
                </div>
              </div>
            </div>

            {/* Citizen / Admin Reopen / Dispute Option for Resolved Tickets */}
            {(currentRole === 'CITIZEN' || currentRole === 'ADMIN') && (
              <>
                {!isReopening ? (
                  <button
                    type="button"
                    onClick={() => setIsReopening(true)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '6px',
                      border: '1px solid #ef4444',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#ef4444',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '4px',
                    }}
                    title="If issue recurred or fix failed, reopen ticket to trigger emergency escalation."
                  >
                    <CornerUpLeft size={13} />
                    <span>⚠️ Reopen Issue / Dispute Fix (+2 Penalty Points)</span>
                  </button>
                ) : (
                  <form onSubmit={handleReopenResolved} style={{ marginTop: '10px', background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                      Reason for Reopening (Triggers +2 Priority Escalation):
                    </div>
                    <textarea
                      value={disputeInput}
                      onChange={(e) => setDisputeInput(e.target.value)}
                      placeholder="e.g. Road crater opened up again after monsoon rain, or new leak discovered."
                      rows={2}
                      required
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #ef4444',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                        marginBottom: '8px',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        style={{
                          padding: '7px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {actionLoading ? <Loader2 size={13} className="spin" /> : <AlertTriangle size={13} />}
                        <span>Confirm Reopen & Escalate (+2)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsReopening(false);
                          setDisputeInput('');
                        }}
                        style={{
                          padding: '7px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'transparent',
                          color: 'var(--text-muted)',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* Interactive Citizen Rating & Contractor Performance Feedback */}
            <div style={{
              marginTop: '14px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={14} color="#f59e0b" fill="#f59e0b" />
                  <span>Rate Contractor Performance: ABC Construction Ltd</span>
                </div>
                {savedRating > 0 && (
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                    ✓ Rating Recorded ({savedRating}/5 Stars)
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setUserRating(star);
                      handleSaveRating(star);
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontSize: '22px',
                      lineHeight: 1,
                      color: (hoverRating || userRating) >= star ? '#f59e0b' : '#cbd5e1',
                      transition: 'transform 0.1s ease',
                    }}
                    title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    ★
                  </button>
                ))}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  {userRating === 5 ? '⭐⭐⭐⭐⭐ Exceptional (5/5)' : userRating === 4 ? '⭐⭐⭐⭐ High Quality (4/5)' : userRating === 3 ? '⭐⭐⭐ Satisfactory (3/5)' : userRating > 0 ? `${userRating}/5 Stars` : 'Click a star to submit live rating'}
                </span>
              </div>

              {/* Citizen Feedback Tags */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['⚡ Prompt 24h SLA', '🛠️ High Quality Fix', '🧹 Clean Site Cleanup', '🤝 Courteous Field Crew'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag === selectedTag ? '' : tag)}
                    style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      background: selectedTag === tag ? 'rgba(13, 148, 136, 0.15)' : 'var(--bg-subtle)',
                      border: '1px solid',
                      borderColor: selectedTag === tag ? '#0d9488' : 'var(--border-color)',
                      color: selectedTag === tag ? '#0d9488' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location & Department Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <MapPin size={14} color="#0d9488" />
              <span>Location</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeComplaint.addressText}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {activeComplaint.city} • {activeComplaint.ward || 'General Ward'}
            </div>
          </div>

          <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <Building2 size={14} color="#0d9488" />
              <span>Department Routing</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {activeComplaint.departmentName || 'Auto-Routing...'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Worker: {activeComplaint.assignedWorkerName || 'Pending Dispatch'}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          {/* Strictly 1-Vote Confirmation Button */}
          <button
            onClick={() => onUpvote(activeComplaint.id)}
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              background: isUpvoted ? 'rgba(13, 148, 136, 0.15)' : 'var(--bg-subtle)',
              border: isUpvoted ? '1px solid #0d9488' : '1px solid var(--border-color)',
              color: isUpvoted ? '#0d9488' : 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
            }}
            title={isUpvoted ? 'You have confirmed this issue. Click to remove confirmation.' : 'Confirm you also observed this issue (1 vote per citizen).'}
          >
            {isUpvoted ? <Check size={16} color="#0d9488" /> : <ThumbsUp size={16} />}
            <span>
              {isUpvoted ? `Confirmed (${activeComplaint.upvoteCount})` : `Confirm / Upvote Issue (${activeComplaint.upvoteCount})`}
            </span>
          </button>

          {currentRole === 'ADMIN' && (
            <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
              🛡️ Admin Triage Active
            </span>
          )}

          <button
            onClick={onClose}
            className="secondary-outline-btn"
            style={{ padding: '8px 20px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
