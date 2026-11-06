import React, { useState } from 'react';
import type { Complaint } from '../../types';
import {
  Star,
  Clock,
  ArrowRight,
  Building2,
  Wrench,
} from 'lucide-react';

interface AdminContractorsViewProps {
  complaints: Complaint[];
  onViewDetails: (complaint: Complaint) => void;
}

interface ContractorEntity {
  id: string;
  name: string;
  category: 'ROAD_DAMAGE' | 'GARBAGE_WASTE' | 'STREETLIGHT' | 'DRAINAGE' | 'WATER_SUPPLY';
  contractNumber: string;
  contactPerson: string;
  phone: string;
  email: string;
  baseRating: number;
  slaCompliance: number;
  activeFleetSize: number;
  coverageZone: string;
}

const AUTHORIZED_CONTRACTORS: ContractorEntity[] = [
  {
    id: 'cont-01',
    name: 'ABC Infrastructure & Road Works Ltd',
    category: 'ROAD_DAMAGE',
    contractNumber: 'BMC-RD-2026-09',
    contactPerson: 'Er. Rajesh Tripathy',
    phone: '+91 94370 12890',
    email: 'operations@abcroadworks.odisha.in',
    baseRating: 4.8,
    slaCompliance: 97.4,
    activeFleetSize: 14,
    coverageZone: 'Zone 1 & 2 (Ghatikia, Kalinga Nagar, Khandagiri)',
  },
  {
    id: 'cont-02',
    name: 'Utkal Clean City & Sanitation Solutions',
    category: 'GARBAGE_WASTE',
    contractNumber: 'BMC-SAN-2026-03',
    contactPerson: 'Subham Mahapatra',
    phone: '+91 98610 44521',
    email: 'dispatch@utkalcleancity.com',
    baseRating: 4.7,
    slaCompliance: 95.8,
    activeFleetSize: 22,
    coverageZone: 'Zone 3 & 4 (Master Canteen, Saheed Nagar, Unit 4)',
  },
  {
    id: 'cont-03',
    name: 'Odisha Power & Luminaire Grid Ltd',
    category: 'STREETLIGHT',
    contractNumber: 'BMC-ELE-2026-11',
    contactPerson: 'Aniruddha Jena',
    phone: '+91 94371 88204',
    email: 'smartgrid@odishapower.org',
    baseRating: 4.9,
    slaCompliance: 98.2,
    activeFleetSize: 9,
    coverageZone: 'All Wards (High-Mast & Smart LED Corridors)',
  },
  {
    id: 'cont-04',
    name: 'Coastal Drainage & Flood Control Utilities',
    category: 'DRAINAGE',
    contractNumber: 'BMC-DRN-2026-07',
    contactPerson: 'Prabhat Mohanty',
    phone: '+91 99370 65123',
    email: 'floodresponse@coastaldrainage.in',
    baseRating: 4.6,
    slaCompliance: 94.1,
    activeFleetSize: 12,
    coverageZone: 'Storm Canal Basins 1 to 5 (Ghatikia & Outer BMC)',
  },
  {
    id: 'cont-05',
    name: 'Kalinga Potable Water Authority',
    category: 'WATER_SUPPLY',
    contractNumber: 'BMC-WTR-2026-04',
    contactPerson: 'P. K. Patnaik',
    phone: '+91 94373 77192',
    email: 'pipeline.ops@kalingawater.gov.in',
    baseRating: 4.8,
    slaCompliance: 96.5,
    activeFleetSize: 8,
    coverageZone: 'Bhubaneswar Central & Western Supply Grids',
  },
];

export const AdminContractorsView: React.FC<AdminContractorsViewProps> = ({
  complaints,
  onViewDetails,
}) => {
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);

  const selectedContractor = AUTHORIZED_CONTRACTORS.find((c) => c.id === selectedContractorId);

  // Filter complaints based on the selected contractor's category
  const activeWorkOrders = complaints.filter((c) => {
    if (!selectedContractor) return true;
    return c.category === selectedContractor.category;
  });

  const totalAssignedOrInProgress = complaints.filter(
    (c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'AWAITING_VERIFICATION'
  ).length;

  return (
    <div className="view-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Municipal Contractor &amp; Vendor Management</h1>
          <p className="page-subtitle">
            PS-09 Municipal Oversight • Authorized Vendor Performance Matrix • SLA Enforcement • Verification Audits
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {selectedContractorId && (
            <button
              className="secondary-outline-btn"
              onClick={() => setSelectedContractorId(null)}
              style={{ color: '#0d9488', borderColor: '#0d9488' }}
            >
              Clear Contractor Filter (Show All)
            </button>
          )}
        </div>
      </div>

      {/* KPI Ribbon */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Authorized Vendors</span>
            <span className="trend-badge positive">5 Empaneled</span>
          </div>
          <span className="stat-number">5</span>
          <span className="stat-subtext">Active municipal repair fleets</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Active Work Orders</span>
            <span className="trend-badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7' }}>
              Dispatched
            </span>
          </div>
          <span className="stat-number" style={{ color: '#0284c7' }}>
            {totalAssignedOrInProgress}
          </span>
          <span className="stat-subtext">In-progress or awaiting verification</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">SLA Compliance Rate</span>
            <span className="trend-badge positive">Target &ge; 95%</span>
          </div>
          <span className="stat-number" style={{ color: '#10b981' }}>
            96.4%
          </span>
          <span className="stat-subtext">Average on-time ticket resolution</span>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Citizen Satisfaction</span>
            <span className="trend-badge positive">Verified</span>
          </div>
          <span className="stat-number" style={{ color: '#ca8a04' }}>
            4.8 / 5
          </span>
          <span className="stat-subtext">Average citizen closure rating</span>
        </div>
      </section>

      {/* Contractor Vendor Matrix Grid */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={18} color="#0d9488" />
          <span>Empaneled Municipal Service Contractors</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {AUTHORIZED_CONTRACTORS.map((c) => {
            const isSelected = selectedContractorId === c.id;
            const contractorComplaints = complaints.filter((cmp) => cmp.category === c.category);
            const inProgCount = contractorComplaints.filter(
              (cmp) => cmp.status === 'IN_PROGRESS' || cmp.status === 'ASSIGNED' || cmp.status === 'AWAITING_VERIFICATION'
            ).length;

            return (
              <div
                key={c.id}
                onClick={() => setSelectedContractorId(isSelected ? null : c.id)}
                className="dashboard-card"
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #0d9488' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(13, 148, 136, 0.05)' : 'var(--bg-card)',
                  transition: 'all 0.18s ease',
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(13, 148, 136, 0.12)',
                        color: '#0d9488',
                      }}
                    >
                      {c.category.replace('_', ' ')}
                    </span>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px', marginBottom: '2px' }}>
                      {c.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Contract ID: {c.contractNumber}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 700 }}>
                    <Star size={13} fill="#b45309" color="#b45309" />
                    <span>{c.baseRating}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '14px 0', padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: '8px', fontSize: '11px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>SLA Adherence</div>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: '13px' }}>{c.slaCompliance}%</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Active Work Orders</div>
                    <div style={{ fontWeight: 700, color: inProgCount > 0 ? '#0284c7' : 'var(--text-secondary)', fontSize: '13px' }}>
                      {inProgCount} Dispatched
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Field Fleet Size</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.activeFleetSize} Field Units</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Contact Supervisor</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.contactPerson}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    📍 {c.coverageZone.split('(')[0]}
                  </span>
                  <button
                    type="button"
                    style={{
                      background: isSelected ? '#0d9488' : 'transparent',
                      color: isSelected ? '#ffffff' : '#0d9488',
                      border: '1px solid #0d9488',
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
                    <span>{isSelected ? '✓ Filter Active' : 'Filter Work Orders'}</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dispatched Work Orders Table */}
      <div className="dashboard-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wrench size={16} color="#0d9488" />
              <span>
                {selectedContractor ? `${selectedContractor.name} — Work Orders` : 'All Municipal Contractor Work Orders'}
              </span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {activeWorkOrders.length} municipal tickets assigned to authorized field repair fleets
            </p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Category</th>
                <th>Issue Title</th>
                <th>Location / Ward</th>
                <th>Priority</th>
                <th>SLA Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeWorkOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    No work orders assigned to this contractor category at this moment.
                  </td>
                </tr>
              ) : (
                activeWorkOrders.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0d9488' }}>
                        #{c.complaintId}
                      </span>
                    </td>
                    <td>
                      <span className="category-pill-sm">{c.category.replace('_', ' ')}</span>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {c.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.description}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {c.addressText || 'Bhubaneswar Smart City'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          color: c.priorityScore >= 11 ? '#ef4444' : c.priorityScore >= 7 ? '#f59e0b' : '#10b981',
                        }}
                      >
                        {c.priorityScore}/15 ({c.urgency})
                      </span>
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
                        <span>Audit / Inspect</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
