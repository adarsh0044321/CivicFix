import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Layers,
  Flame,
  AlertTriangle,
  Clock,
  Navigation,
} from 'lucide-react';
import type { Complaint, ComplaintCategory } from '../../types';

interface CivicHeatmapViewProps {
  complaints: Complaint[];
  onViewDetails: (complaint: Complaint) => void;
  onRefresh?: () => void;
}

const CATEGORY_ICONS: Record<ComplaintCategory, string> = {
  ROAD_DAMAGE: '🛣️',
  GARBAGE_WASTE: '🗑️',
  STREETLIGHT: '💡',
  DRAINAGE: '🌊',
  WATER_SUPPLY: '🚰',
};

const CATEGORY_NAMES: Record<ComplaintCategory, string> = {
  ROAD_DAMAGE: 'Road Damage',
  GARBAGE_WASTE: 'Garbage & Waste',
  STREETLIGHT: 'Streetlights',
  DRAINAGE: 'Drainage & Sewage',
  WATER_SUPPLY: 'Water Supply',
};

const HOTSPOTS = [
  { name: 'OUTR Ghatikia (Cluster)', lat: 20.27572, lng: 85.77663, zoom: 16 },
  { name: 'Master Canteen', lat: 20.2648, lng: 85.8398, zoom: 15 },
  { name: 'Acharya Vihar', lat: 20.2974, lng: 85.8285, zoom: 15 },
  { name: 'Khandagiri', lat: 20.2587, lng: 85.7874, zoom: 15 },
  { name: 'Patia / KIIT', lat: 20.3533, lng: 85.8197, zoom: 15 },
];

export const CivicHeatmapView: React.FC<CivicHeatmapViewProps> = ({
  complaints,
  onViewDetails,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<'pins' | 'heatmap'>('pins');
  const [selectedCategory, setSelectedCategory] = useState<ComplaintCategory | 'ALL'>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<'ALL' | 'HIGH' | 'MODERATE' | 'LOW'>('ALL');

  // Filter complaints having valid coordinates
  const mappedComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (c.latitude == null || c.longitude == null) return false;
      if (selectedCategory !== 'ALL' && c.category !== selectedCategory) return false;
      if (urgencyFilter !== 'ALL' && c.urgency !== urgencyFilter) return false;
      return true;
    });
  }, [complaints, selectedCategory, urgencyFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = mappedComplaints.length;
    const high = mappedComplaints.filter((c) => c.priorityScore >= 11).length;
    const overdue = mappedComplaints.filter((c) => c.isOverdue || c.overdue).length;
    const duplicates = mappedComplaints.filter((c) => c.isDuplicate || c.duplicate || c.duplicateGroupId).length;
    return { total, high, overdue, duplicates };
  }, [mappedComplaints]);

  // 1. Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Bhubaneswar
    const map = L.map(mapContainerRef.current, {
      center: [20.2961, 85.8245],
      zoom: 12,
      zoomControl: true,
    });

    // Add clean OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | CivicFix PS-09',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render Markers or Heatmap Circles whenever filters, viewMode, or complaints change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markersLayerRef.current) markersLayerRef.current.clearLayers();
    if (heatmapLayerRef.current) heatmapLayerRef.current.clearLayers();

    if (viewMode === 'pins') {
      // Pin Marker Mode
      mappedComplaints.forEach((c) => {
        const lat = c.latitude!;
        const lng = c.longitude!;
        const iconEmoji = CATEGORY_ICONS[c.category] || '📍';

        // Color code based on priority & urgency
        let borderColor = '#0d9488'; // Teal for low
        let bgColor = 'rgba(13, 148, 136, 0.15)';
        if (c.status === 'VERIFIED_RESOLVED') {
          borderColor = '#10b981';
          bgColor = 'rgba(16, 185, 129, 0.2)';
        } else if (c.priorityScore >= 11 || c.urgency === 'HIGH') {
          borderColor = '#ef4444';
          bgColor = 'rgba(239, 68, 68, 0.25)';
        } else if (c.priorityScore >= 6 || c.urgency === 'MODERATE') {
          borderColor = '#f59e0b';
          bgColor = 'rgba(245, 158, 11, 0.2)';
        }

        const isOverdue = c.isOverdue || c.overdue;
        const isDup = c.isDuplicate || c.duplicate || Boolean(c.duplicateGroupId);

        const customHtml = `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 38px;
            height: 38px;
            background: #ffffff;
            border: 2.5px solid ${borderColor};
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
            cursor: pointer;
            font-size: 16px;
            transform: translate(-50%, -50%);
          ">
            <span>${iconEmoji}</span>
            ${
              c.priorityScore >= 11
                ? `<span style="position: absolute; top: -3px; right: -3px; width: 10px; height: 10px; background: #ef4444; border: 2px solid #fff; border-radius: 50%; animation: pulse 2s infinite;"></span>`
                : ''
            }
            ${
              isOverdue
                ? `<span style="position: absolute; bottom: -3px; right: -3px; background: #b91c1c; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 3px; border-radius: 4px; border: 1px solid #fff;">SLA</span>`
                : ''
            }
            ${
              isDup
                ? `<span style="position: absolute; top: -3px; left: -3px; background: #8b5cf6; color: #fff; font-size: 8px; font-weight: 800; padding: 1px 3px; border-radius: 4px; border: 1px solid #fff;">DUP</span>`
                : ''
            }
          </div>
        `;

        const divIcon = L.divIcon({
          html: customHtml,
          className: 'civicfix-custom-pin',
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -20],
        });

        const marker = L.marker([lat, lng], { icon: divIcon });

        // Popup HTML with click handler bridge
        const popupContent = `
          <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 230px; padding: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-weight: 700; color: #0d9488; font-size: 11px;">${c.complaintId}</span>
              <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${bgColor}; color: ${borderColor};">
                ${c.status}
              </span>
            </div>
            <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 4px;">
              ${escapeHtml(c.title)}
            </div>
            <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">
              📍 ${escapeHtml(c.addressText || 'Bhubaneswar')}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; font-size: 11px;">
              <div><strong>Priority:</strong> <span style="color: ${borderColor}; font-weight: 700;">${c.priorityScore}/15</span></div>
              <div><strong>Upvotes:</strong> 👍 ${c.upvoteCount}</div>
            </div>
            ${
              isOverdue
                ? `<div style="color: #ef4444; font-size: 11px; font-weight: 700; margin-bottom: 6px;">⚠️ SLA Target Breached (Overdue)</div>`
                : ''
            }
            <button
              id="btn-inspect-${c.id}"
              style="
                width: 100%;
                background: #0d9488;
                color: #ffffff;
                border: none;
                padding: 6px 10px;
                border-radius: 6px;
                font-weight: 600;
                font-size: 12px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
              "
            >
              Inspect Details & Actions →
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);

        // Attach DOM listener when popup opens
        marker.on('popupopen', () => {
          const btn = document.getElementById(`btn-inspect-${c.id}`);
          if (btn) {
            btn.onclick = () => {
              onViewDetails(c);
            };
          }
        });

        markersLayerRef.current?.addLayer(marker);
      });
    } else {
      // Density Heatmap Overlay Mode:
      // Renders graduated radial circles based on priorityScore and density
      mappedComplaints.forEach((c) => {
        const lat = c.latitude!;
        const lng = c.longitude!;

        // Higher priority generates larger and warmer circles
        const score = c.priorityScore || 5;
        let radius = 250 + score * 40; // 250m to 850m
        let color = '#3b82f6';
        let fillColor = '#60a5fa';
        let fillOpacity = 0.25;

        if (score >= 12) {
          color = '#dc2626';
          fillColor = '#ef4444';
          fillOpacity = 0.45;
          radius = 350 + score * 50;
        } else if (score >= 8) {
          color = '#ea580c';
          fillColor = '#f97316';
          fillOpacity = 0.35;
        } else if (score >= 5) {
          color = '#d97706';
          fillColor = '#fbbf24';
          fillOpacity = 0.3;
        }

        const circle = L.circle([lat, lng], {
          radius: radius,
          color: color,
          weight: 1.5,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
        });

        circle.bindTooltip(
          `<strong>${c.complaintId}:</strong> ${escapeHtml(c.title)}<br/>Priority: ${c.priorityScore}/15 (${c.urgency})`,
          { sticky: true }
        );

        heatmapLayerRef.current?.addLayer(circle);

        // Also add small center hotspot dot
        const centerDot = L.circleMarker([lat, lng], {
          radius: 4,
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 1,
        });
        heatmapLayerRef.current?.addLayer(centerDot);
      });
    }
  }, [mappedComplaints, viewMode, onViewDetails]);

  // Jump to known civic hotspots
  const handleFlyTo = (lat: number, lng: number, zoom: number) => {
    mapInstanceRef.current?.flyTo([lat, lng], zoom, { duration: 1.2 });
  };

  return (
    <div className="view-container" style={{ padding: '0 0 24px 0' }}>
      {/* 1. Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px',
          padding: '0 4px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span>City Grievance GIS Map & Heatmap</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: 'rgba(13, 148, 136, 0.1)',
                color: '#0d9488',
                border: '1px solid rgba(13, 148, 136, 0.25)',
                padding: '2px 8px',
                borderRadius: '9999px',
              }}
            >
              PostGIS + Leaflet 150m Radar
            </span>
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Real-time geospatial distribution of municipal grievances across Bhubaneswar wards.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '3px',
          }}
        >
          <button
            onClick={() => setViewMode('pins')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: viewMode === 'pins' ? '#0d9488' : 'transparent',
              color: viewMode === 'pins' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <MapPin size={15} />
            <span>Pin Markers ({mappedComplaints.length})</span>
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              background: viewMode === 'heatmap' ? '#ea580c' : 'transparent',
              color: viewMode === 'heatmap' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
          >
            <Flame size={15} />
            <span>Density Heatmap</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Stat Metric Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              MAPPED ISSUES
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {stats.total}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(13, 148, 136, 0.1)',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={18} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              CRITICAL / HIGH (11-15)
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#ef4444' }}>
              {stats.high}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={18} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              OVERDUE SLA BREACHES
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>
              {stats.overdue}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Clock size={18} />
          </div>
        </div>

        <div
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              POSTGIS DUPLICATES
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>
              {stats.duplicates}
            </div>
          </div>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'rgba(139, 92, 246, 0.1)',
              color: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Navigation size={18} />
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Hotspot Quick Jump */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginBottom: '12px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '12px 16px',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`filter-pill ${selectedCategory === 'ALL' ? 'active' : ''}`}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              background: selectedCategory === 'ALL' ? '#0d9488' : 'var(--bg-secondary)',
              color: selectedCategory === 'ALL' ? '#fff' : 'var(--text-primary)',
            }}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORY_NAMES) as ComplaintCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: selectedCategory === cat ? '#0d9488' : 'var(--bg-secondary)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>{CATEGORY_ICONS[cat]}</span>
              <span>{CATEGORY_NAMES[cat]}</span>
            </button>
          ))}
        </div>

        {/* Urgency Level Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
            Urgency:
          </span>
          {(['ALL', 'HIGH', 'MODERATE', 'LOW'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setUrgencyFilter(lvl)}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '16px',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                background: urgencyFilter === lvl ? (lvl === 'HIGH' ? '#ef4444' : lvl === 'MODERATE' ? '#f59e0b' : '#0d9488') : 'var(--bg-secondary)',
                color: urgencyFilter === lvl ? '#fff' : 'var(--text-primary)',
              }}
            >
              {lvl === 'ALL' ? 'All Urgencies' : `${lvl} Urgency`}
            </button>
          ))}
        </div>

        {/* Hotspot Quick Jumps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
            Hotspots:
          </span>
          {HOTSPOTS.map((h) => (
            <button
              key={h.name}
              onClick={() => handleFlyTo(h.lat, h.lng, h.zoom)}
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Navigation size={11} color="#0d9488" />
              <span>{h.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Interactive Leaflet Map Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '560px',
          borderRadius: '14px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Heatmap Legend Box (Overlay at bottom-right) */}
        {viewMode === 'heatmap' && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '11px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              color: '#1e293b',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: '6px' }}>Density Heatmap Intensity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444' }}></span>
              <span>High Critical (Score 12-15)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f97316' }}></span>
              <span>Moderate (Score 8-11)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#60a5fa' }}></span>
              <span>Low Urgency (Score 1-7)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
