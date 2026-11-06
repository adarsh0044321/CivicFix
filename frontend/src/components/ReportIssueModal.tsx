import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  MapPin,
  AlertCircle,
  Loader2,
  Camera,
  Upload,
  CheckCircle2,
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  ShieldAlert,
  ThumbsUp,
  Radio,
} from 'lucide-react';
import type { ComplaintCategory, CreateComplaintInput, LocationConfidence, DuplicateCandidate } from '../types';
import { uploadComplaintImage, analyzeImageWithAi, transcribeVoiceWithAi, checkDuplicateRadar, upvoteComplaint } from '../services/api';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateComplaintInput) => Promise<void>;
}

// Preset scenarios using realistic municipal imagery for PS-09 categories
const PS09_PRESETS = [
  {
    category: 'ROAD_DAMAGE' as ComplaintCategory,
    label: '🕳️ Road Crater',
    title: 'Severe road crater & broken asphalt on Ghatikia Road',
    description: 'Deep road collapse causing immediate skid hazard for two-wheelers and severe commuter traffic delays. Prompt bituminous patching required.',
    imageUrl: '/dummyimages/pothole_road_damage.jpg',
    hazards: ['Two-wheeler skid risk', 'Vehicle suspension damage', 'Commuter obstruction'],
    ward: 'Ward 26',
    address: 'OUTR Campus Main Gate, Kalinga Nagar, Ghatikia, Bhubaneswar',
    lat: 20.27572,
    lng: 85.77663,
  },
  {
    category: 'GARBAGE_WASTE' as ComplaintCategory,
    label: '🗑️ Garbage Dump',
    title: 'Overflowing community waste dumpster spilling onto sidewalk',
    description: 'Solid organic waste container overflowing across pedestrian walkway with severe stench, vector risk, and stray animal hazards.',
    imageUrl: '/dummyimages/garbage_overflow.jpg',
    hazards: ['Vector-borne health risk', 'Footpath obstruction', 'Stray cattle hazard'],
    ward: 'Ward 26',
    address: 'Kalinga Nagar Sector 3 Market Lane, Ghatikia, Ward 26',
    lat: 20.27801,
    lng: 85.77812,
  },
  {
    category: 'STREETLIGHT' as ComplaintCategory,
    label: '💡 Dark Luminaire',
    title: 'Broken streetlight luminaire fixture on main commuter artery',
    description: 'High-mast LED luminaire dead for 48 hours, causing zero night visibility and security vulnerabilities for evening commuters.',
    imageUrl: '/dummyimages/streetlight_luminaire.jpg',
    hazards: ['Zero night visibility', 'Pedestrian security vulnerability', 'Night collision hazard'],
    ward: 'Ward 26',
    address: 'Ghatikia Bypass Junction, Ward 26, Bhubaneswar',
    lat: 20.27512,
    lng: 85.77605,
  },
  {
    category: 'DRAINAGE' as ComplaintCategory,
    label: '🌊 Flooded Drain',
    title: 'Severe road waterlogging & clogged stormwater culvert',
    description: 'Plastic silt and construction debris blocking culvert inlet, causing rainwater backup into commercial storefronts and roads.',
    imageUrl: '/dummyimages/drainage_waterlogging.jpg',
    hazards: ['Flash waterlogging hazard', 'Structural water seepage', 'Submerged pothole hazard'],
    ward: 'Ward 26',
    address: 'OUTR North Boundary Road, Ghatikia, Ward 26',
    lat: 20.27645,
    lng: 85.77720,
  },
  {
    category: 'WATER_SUPPLY' as ComplaintCategory,
    label: '🚰 Water Burst',
    title: 'Municipal potable water distribution pipeline ruptured',
    description: 'Clean drinking water distribution pipeline ruptured under high pressure, washing away road foundation and wasting potable supply.',
    imageUrl: '/dummyimages/burst_water_pipe.jpg',
    hazards: ['Potable water wastage', 'Road foundation erosion', 'Contamination ingress risk'],
    ward: 'Ward 26',
    address: 'Kalinga Nagar High Pressure Distribution Grid, Ghatikia, Ward 26',
    lat: 20.27710,
    lng: 85.77940,
  },
];

// Landmark dictionary for Bhubaneswar area auto-resolution (Phase 7 & OUTR Ghatikia)
const BHUBANESWAR_LANDMARKS = [
  { match: 'outr', name: 'OUTR Campus, Kalinga Nagar, Ghatikia, Bhubaneswar', lat: 20.27572, lng: 85.77663, ward: 'Ward 26' },
  { match: 'cet', name: 'OUTR (Formerly CET), Ghatikia, Bhubaneswar', lat: 20.27572, lng: 85.77663, ward: 'Ward 26' },
  { match: 'ghatikia', name: 'Ghatikia Main Road, Ward 26', lat: 20.2751, lng: 85.7760, ward: 'Ward 26' },
  { match: 'kalinga nagar', name: 'Kalinga Nagar, Ghatikia, Ward 26', lat: 20.2780, lng: 85.7780, ward: 'Ward 26' },
  { match: 'iter', name: 'ITER Main Gate, Jagmohan Nagar, Khandagiri', lat: 20.25052, lng: 85.79581, ward: 'Ward 23' },
  { match: 'master canteen', name: 'Master Canteen Station Plaza, Ward 8', lat: 20.2648, lng: 85.8425, ward: 'Ward 8' },
  { match: 'khandagiri', name: 'Khandagiri Caves Tourist Road, Ward 24', lat: 20.2589, lng: 85.7874, ward: 'Ward 24' },
  { match: 'jaydev vihar', name: 'Jaydev Vihar Intersection Flyover Circle, Ward 16', lat: 20.2981, lng: 85.8192, ward: 'Ward 16' },
  { match: 'patia', name: 'Patia Big Bazaar Square, Ward 3', lat: 20.3533, lng: 85.8189, ward: 'Ward 3' },
  { match: 'kiit', name: 'KIIT Road Campus 6, Ward 3', lat: 20.3535, lng: 85.8195, ward: 'Ward 3' },
  { match: 'acharya vihar', name: 'Acharya Vihar Square Underpass, Ward 19', lat: 20.2982, lng: 85.8285, ward: 'Ward 19' },
  { match: 'baramunda', name: 'Baramunda Bus Terminal Overbridge, Ward 28', lat: 20.2764, lng: 85.7891, ward: 'Ward 28' },
  { match: 'unit 1', name: 'Unit-1 Daily Haat Market, Ward 7', lat: 20.2612, lng: 85.8341, ward: 'Ward 7' },
  { match: 'unit 4', name: 'Community Dispensary, Unit 4, Ward 6', lat: 20.2792, lng: 85.8331, ward: 'Ward 6' },
  { match: 'unit 9', name: 'Unit-9 Government Colony, Ward 29', lat: 20.2741, lng: 85.8398, ward: 'Ward 29' },
  { match: 'saheed nagar', name: 'Saheed Nagar Market / Maharishi College, Ward 31', lat: 20.2874, lng: 85.8458, ward: 'Ward 31' },
  { match: 'bomikhal', name: 'Bomikhal Flyover Service Lane, Ward 33', lat: 20.2829, lng: 85.8552, ward: 'Ward 33' },
  { match: 'sailashree vihar', name: 'Sailashree Vihar Phase 2, Ward 11', lat: 20.3341, lng: 85.8089, ward: 'Ward 11' },
  { match: 'chandrasekharpur', name: 'Chandrasekharpur Petrol Pump, Ward 14', lat: 20.3242, lng: 85.8198, ward: 'Ward 14' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('ROAD_DAMAGE');
  const [addressText, setAddressText] = useState('');
  const [city] = useState('Bhubaneswar');
  const [ward, setWard] = useState('Ward 23');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<LocationConfidence>('LOW_VAGUE_TRIAGE');

  // Photo Attachment
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Gemini AI States (Phase 8)
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiTranscribing, setAiTranscribing] = useState(false);
  const [detectedHazards, setDetectedHazards] = useState<string[]>([]);
  const [transcribedSpeech, setTranscribedSpeech] = useState<{ orig: string; lang: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Phase 9 Proactive Duplicate Radar States
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [radarDismissed, setRadarDismissed] = useState(false);
  const [upvotingCandidateId, setUpvotingCandidateId] = useState<string | null>(null);
  const [radarSuccessMsg, setRadarSuccessMsg] = useState<string | null>(null);

  // Proactive duplicate detection debounced
  useEffect(() => {
    if (!latitude || !longitude || !title.trim() || radarDismissed) {
      setDuplicateCandidates([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingDuplicates(true);
      try {
        const matches = await checkDuplicateRadar({
          category,
          latitude,
          longitude,
          title,
        });
        const near = matches.filter((m) => m.distanceMeters <= 150);
        setDuplicateCandidates(near);
      } catch (err) {
        console.warn('Duplicate radar check failed:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [latitude, longitude, category, title, radarDismissed]);

  // Auto-resolve landmark from input address
  const handleAddressChange = (text: string) => {
    setAddressText(text);
    const lower = text.toLowerCase();
    const match = BHUBANESWAR_LANDMARKS.find((lm) => lower.includes(lm.match));

    if (match) {
      setLatitude(match.lat);
      setLongitude(match.lng);
      setWard(match.ward);
      setConfidence('LANDMARK_RESOLVED');
    } else if (!latitude) {
      setConfidence('LOW_VAGUE_TRIAGE');
    }
  };

  // OUTR Ghatikia Fallback when GPS fails or coarse ISP location is detected
  const applyOutrFallback = (msg?: string) => {
    setLatitude(20.27572);
    setLongitude(85.77663);
    setWard('Ward 26');
    setConfidence('LANDMARK_RESOLVED');
    if (!addressText || addressText.includes('GPS')) {
      setAddressText('OUTR, Kalinga Nagar, Ghatikia, Bhubaneswar');
    }
    if (msg) console.info(msg);
  };

  // Capture GPS coordinates with High Accuracy & Municipal Bounding Box check
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      applyOutrFallback('Geolocation not supported by your browser. Defaulted to OUTR Ghatikia.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const rawLat = pos.coords.latitude;
        const rawLng = pos.coords.longitude;
        // Verify coordinates are within reasonable Bhubaneswar metropolitan box [19.8, 20.6], [85.5, 86.2]
        if (rawLat >= 19.8 && rawLat <= 20.6 && rawLng >= 85.5 && rawLng <= 86.2) {
          const lat = Number(rawLat.toFixed(6));
          const lng = Number(rawLng.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          setConfidence('HIGH_EXACT_GPS');
          setAddressText(`GPS Captured: [${lat}, ${lng}], Bhubaneswar`);
        } else {
          // Coarse ISP location outside Bhubaneswar -> default to OUTR Ghatikia
          applyOutrFallback('Coarse network location detected outside municipal zone. Pinned to OUTR Ghatikia.');
        }
        setLocating(false);
      },
      (err) => {
        console.warn('GPS acquisition error:', err.message);
        applyOutrFallback('Could not acquire GPS: Defaulted to OUTR, Kalinga Nagar, Ghatikia, Bhubaneswar.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Quick Preset Selection (Instantly loads dummy image and triggers real Gemini Vision triage)
  const handleSelectPreset = async (preset: typeof PS09_PRESETS[0]) => {
    setImagePreviewUrl(preset.imageUrl);
    setCategory(preset.category);
    setTitle(preset.title);
    setDescription(preset.description);
    setDetectedHazards(preset.hazards);
    setWard(preset.ward);
    setAddressText(preset.address);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setConfidence('LANDMARK_RESOLVED');

    // Fetch the actual file bytes and invoke live Gemini Vision API
    try {
      setAiAnalyzing(true);
      const res = await fetch(preset.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `${preset.category.toLowerCase()}.jpg`, { type: 'image/jpeg' });
      setSelectedImageFile(file);

      const aiResult = await analyzeImageWithAi(file, preset.title);
      if (aiResult) {
        setCategory(aiResult.category);
        if (aiResult.suggestedTitle) setTitle(aiResult.suggestedTitle);
        if (aiResult.suggestedDescription) setDescription(aiResult.suggestedDescription);
        if (aiResult.safetyHazards && aiResult.safetyHazards.length > 0) {
          setDetectedHazards(aiResult.safetyHazards);
        }
      }
    } catch (err) {
      console.warn('Real AI triage from preset finished with baseline data:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Handle Image File Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5 MB limit. Please select a smaller photo.');
        return;
      }
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      // Auto-trigger AI vision analysis
      triggerAiVisionAnalysis(file);
    }
  };

  // AI Multimodal Vision Analysis (Phase 8)
  const triggerAiVisionAnalysis = async (file?: File) => {
    setAiAnalyzing(true);
    setErrorMessage(null);
    try {
      const result = await analyzeImageWithAi(file || selectedImageFile || undefined, title || addressText);
      setCategory(result.category);
      if (!title || title.trim().length < 5) setTitle(result.suggestedTitle);
      if (!description || description.trim().length < 10) setDescription(result.suggestedDescription);
      setDetectedHazards(result.safetyHazards);
    } catch (err: any) {
      console.warn('AI analysis error:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Voice Note Triage - Native Microphone Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        await handleVoiceTranscribeBlob(audioBlob, 'odia');
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedAudioUrl(null);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      // If mic denied or not available, use sample Odia voice triage
      alert('Microphone not available or permission denied. Loading high-fidelity Odia voice simulation.');
      triggerVoiceSimulation('odia');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleVoiceTranscribeBlob = async (blob: Blob, lang: string) => {
    setAiTranscribing(true);
    try {
      const result = await transcribeVoiceWithAi(blob, lang);
      applyVoiceResult(result);
    } catch (err: any) {
      triggerVoiceSimulation(lang);
    } finally {
      setAiTranscribing(false);
    }
  };

  // Trigger Regional Speech Simulation (Odia, Hindi, English)
  const triggerVoiceSimulation = async (lang: string) => {
    setAiTranscribing(true);
    try {
      const result = await transcribeVoiceWithAi(undefined, lang);
      applyVoiceResult(result);
    } catch (err: any) {
      setErrorMessage('Voice processing failed: ' + err.message);
    } finally {
      setAiTranscribing(false);
    }
  };

  const applyVoiceResult = (result: any) => {
    setTranscribedSpeech({ orig: result.originalText, lang: result.originalLanguage });
    setTitle(result.suggestedTitle);
    setDescription(result.englishTranslation);
    setCategory(result.suggestedCategory);
    if (result.locationClues) handleAddressChange(result.locationClues);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 5) {
      setErrorMessage('Title must be at least 5 characters');
      return;
    }
    if (description.trim().length < 10) {
      setErrorMessage('Description must be at least 10 characters');
      return;
    }
    if (!addressText.trim()) {
      setErrorMessage('Please provide an address or landmark');
      return;
    }

    setSubmitting(true);
    let uploadedUrl: string | undefined = undefined;

    try {
      // 1. Upload photo if selected
      if (selectedImageFile) {
        setUploadingImage(true);
        try {
          uploadedUrl = await uploadComplaintImage(selectedImageFile);
        } catch {
          uploadedUrl = imagePreviewUrl || undefined;
        } finally {
          setUploadingImage(false);
        }
      }

      // 2. Submit complaint
      await onSubmit({
        title,
        description,
        category,
        addressText,
        city,
        ward,
        latitude,
        longitude,
        locationConfidence: confidence,
        imageUrl: uploadedUrl,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Report a Municipal Grievance</span>
              <span style={{ fontSize: '11px', background: 'rgba(13, 148, 136, 0.1)', color: '#0d9488', border: '1px solid rgba(13, 148, 136, 0.3)', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                ✨ Gemini AI Ready
              </span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Report road damage, waste, streetlights, drains, or water supply problems.
            </p>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Multilingual Voice Note Bar (Phase 8 Speech Input) */}
        <div
          style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={15} color="#0d9488" />
              Speak Grievance (Voice-to-Text Triage)
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    animation: 'pulse 1.5s infinite',
                  }}
                >
                  <MicOff size={13} />
                  Stop Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={aiTranscribing}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Mic size={13} />
                  Record Mic
                </button>
              )}

              {/* Instant 1-Click Demo Speech Buttons */}
              <button
                type="button"
                onClick={() => triggerVoiceSimulation('odia')}
                disabled={aiTranscribing}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Simulate speech report in Odia"
              >
                ଓଡ଼ିଆ (Odia)
              </button>

              <button
                type="button"
                onClick={() => triggerVoiceSimulation('hindi')}
                disabled={aiTranscribing}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                title="Simulate speech report in Hindi"
              >
                हिंदी (Hindi)
              </button>
            </div>
          </div>

          {/* Active Live Recording Status with Timer */}
          {isRecording && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: '6px', padding: '8px 12px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444' }}>
                  Recording Live Voice: 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Speak grievance clearly • Tap Stop Recording when done
              </span>
            </div>
          )}

          {/* Captured Audio Playback Player Bar */}
          {recordedAudioUrl && !isRecording && (
            <div style={{ background: 'var(--bg-card)', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #0d9488', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Volume2 size={14} color="#0d9488" />
                  🎧 Your Recorded Grievance Audio (Click Play to Review)
                </span>
                <button
                  type="button"
                  onClick={() => { setRecordedAudioUrl(null); setTranscribedSpeech(null); }}
                  style={{ fontSize: '11px', color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
                >
                  Discard & Re-record
                </button>
              </div>
              <audio controls src={recordedAudioUrl} style={{ width: '100%', height: '32px' }} />
            </div>
          )}

          {aiTranscribing && (
            <div style={{ fontSize: '12px', color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(13, 148, 136, 0.08)', padding: '8px 12px', borderRadius: '6px' }}>
              <Loader2 size={14} className="spin" />
              <span>Transcribing regional voice note and translating to English via Gemini 3.5 Flash...</span>
            </div>
          )}

          {transcribedSpeech && (
            <div style={{ fontSize: '12px', background: 'rgba(13, 148, 136, 0.08)', padding: '10px 12px', borderRadius: '6px', border: '1px solid #0d9488' }}>
              <div style={{ fontWeight: 700, color: '#0d9488', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✅ Voice Triage Extracted ({transcribedSpeech.lang})</span>
              </div>
              <div style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: '4px' }}>
                "{transcribedSpeech.orig}"
              </div>
              <div style={{ fontSize: '11px', color: '#0d9488' }}>
                Auto-populated Title, Category, and Description below.
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>
            <AlertCircle size={18} color="#ef4444" />
            <span>{errorMessage}</span>
          </div>
        )}

        {radarSuccessMsg && (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', marginBottom: '16px', fontSize: '13px' }}>
            <CheckCircle2 size={18} color="#10b981" />
            <span>{radarSuccessMsg}</span>
          </div>
        )}

        {duplicateCandidates.length > 0 && !radarDismissed && !radarSuccessMsg && (
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1.5px solid #f59e0b',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#d97706', fontSize: '13px' }}>
                <Radio size={16} color="#d97706" className={checkingDuplicates ? 'spin' : ''} />
                <span>PostGIS Duplicate Radar: {duplicateCandidates.length} similar issue(s) detected nearby (&le;150m)!</span>
              </div>
              <button
                type="button"
                onClick={() => setRadarDismissed(true)}
                style={{ fontSize: '11px', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Dismiss Radar
              </button>
            </div>

            {duplicateCandidates.slice(0, 2).map((cand) => (
              <div key={cand.id} style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#0d9488' }}>{cand.complaintId}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {Math.round(cand.distanceMeters)}m away
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>• {cand.status}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cand.title}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    📍 {cand.addressText} • 👍 {cand.upvoteCount} citizens confirmed
                  </div>
                </div>

                <button
                  type="button"
                  disabled={upvotingCandidateId === cand.id}
                  onClick={async () => {
                    setUpvotingCandidateId(cand.id);
                    try {
                      await upvoteComplaint(cand.id, true);
                      setRadarSuccessMsg(`Confirmed ${cand.complaintId}! Thanks for boosting this grievance without duplicate spam.`);
                      setTimeout(() => {
                        onClose();
                      }, 1400);
                    } catch (err: any) {
                      alert('Upvote failed: ' + err.message);
                    } finally {
                      setUpvotingCandidateId(null);
                    }
                  }}
                  style={{
                    background: '#0d9488',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {upvotingCandidateId === cand.id ? <Loader2 size={13} className="spin" /> : <ThumbsUp size={13} />}
                  <span>Upvote Instead</span>
                </button>
              </div>
            ))}

            <div style={{ fontSize: '11px', color: '#b45309' }}>
              💡 <em>Upvoting an existing grievance boosts its priority score without cluttering municipal queues.</em>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Quick Scenario Chips for Testing Dummy Images & Live Gemini Vision */}
          <div style={{
            background: 'rgba(13, 148, 136, 0.06)',
            border: '1px solid rgba(13, 148, 136, 0.25)',
            borderRadius: '10px',
            padding: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0d9488', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#0d9488" />
                <span>⚡ Quick Test Presets (PS-09 Scenarios & Dummy Images):</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Click to load image + trigger Gemini Vision
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PS09_PRESETS.map((p) => (
                <button
                  key={p.category}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  disabled={aiAnalyzing}
                  style={{
                    background: category === p.category && imagePreviewUrl === p.imageUrl ? '#0d9488' : 'var(--bg-card)',
                    color: category === p.category && imagePreviewUrl === p.imageUrl ? '#fff' : 'var(--text-primary)',
                    border: '1px solid',
                    borderColor: category === p.category && imagePreviewUrl === p.imageUrl ? '#0d9488' : 'var(--border-color)',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo Attachment (Phase 7 & 8 Multimodal Vision) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Photo Evidence (Optional, max 5 MB)
              </label>

              {/* Gemini Vision Triage Action */}
              <button
                type="button"
                onClick={() => triggerAiVisionAnalysis()}
                disabled={aiAnalyzing}
                style={{
                  background: 'rgba(13, 148, 136, 0.12)',
                  border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal-light)',
                  borderRadius: '6px',
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {aiAnalyzing ? <Loader2 size={12} className="spin" /> : <Sparkles size={12} />}
                {aiAnalyzing ? 'Analyzing Damage...' : '✨ AI Vision Auto-Triage'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'var(--bg-subtle)',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Camera size={16} color="var(--accent-teal)" />
                <span>{selectedImageFile ? 'Change Photo' : 'Attach Photo'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleImageChange}
                />
              </label>

              {imagePreviewUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedImageFile?.name} ({(selectedImageFile ? selectedImageFile.size / 1024 : 0).toFixed(0)} KB)
                  </span>
                </div>
              )}
            </div>

            {/* AI Detected Safety Hazards Badges */}
            {detectedHazards.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <ShieldAlert size={12} />
                  Hazards:
                </span>
                {detectedHazards.map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#ef4444',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Issue Title */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Issue Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Deep road crater near OUTR Ghatikia Main Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="custom-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Mandated 5 Issue Categories */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Issue Category (5 Mandated Categories) *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="ROAD_DAMAGE">Road Damage & Potholes</option>
              <option value="GARBAGE_WASTE">Garbage & Waste Management</option>
              <option value="STREETLIGHT">Streetlight Failures & Dark Roads</option>
              <option value="DRAINAGE">Drainage & Waterlogging</option>
              <option value="WATER_SUPPLY">Water Supply Problems & Pipe Bursts</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>
              Description & Details *
            </label>
            <textarea
              rows={3}
              placeholder="Describe the issue, hazards, or landmarks (e.g. opposite school gate, behind water tank)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Location & GPS Auto-Resolution */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Address / Landmark *
              </label>
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={locating}
                style={{
                  background: 'rgba(13, 148, 136, 0.1)',
                  border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal-light)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {locating ? <Loader2 size={12} className="spin" /> : <MapPin size={12} />}
                {locating ? 'Acquiring GPS...' : '📍 Use GPS Coordinates'}
              </button>
            </div>
            <input
              type="text"
              placeholder="e.g. Near OUTR Kalinga Nagar, Ghatikia, Master Canteen, or Patia Square"
              value={addressText}
              onChange={(e) => handleAddressChange(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
            />

            {/* Location Confidence Indicator */}
            <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {confidence === 'HIGH_EXACT_GPS' && (
                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color="#16a34a" />
                  High Confidence GPS: [{latitude}, {longitude}]
                </span>
              )}
              {confidence === 'LANDMARK_RESOLVED' && (
                <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color="#0d9488" />
                  Landmark Auto-Resolved: [{latitude}, {longitude}] ({ward})
                </span>
              )}
              {confidence === 'LOW_VAGUE_TRIAGE' && (
                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 500 }}>
                  📍 Vague Landmark Mode: Will be routed to field inspection (Anti-Silent Rejection)
                </span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              onClick={onClose}
              className="secondary-outline-btn"
              style={{ padding: '9px 18px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="primary-teal-btn"
              style={{ padding: '9px 24px' }}
            >
              {submitting || uploadingImage ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
              <span>{submitting ? 'Submitting...' : 'Submit Grievance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
