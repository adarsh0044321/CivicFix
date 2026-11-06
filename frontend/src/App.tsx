import React, { useEffect, useState, useMemo } from 'react';
import './styles/theme.css';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { CitizenDashboardView } from './components/views/CitizenDashboardView';
import { MyReportsView } from './components/views/MyReportsView';
import { ContractorView } from './components/views/ContractorView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ProfileView } from './components/views/ProfileView';
import { AdminCommandView } from './components/views/AdminCommandView';
import { AdminContractorsView } from './components/views/AdminContractorsView';
import { CivicHeatmapView } from './components/views/CivicHeatmapView';
import { LoginPage } from './components/views/LoginPage';
import { ComplaintDetailModal } from './components/ComplaintDetailModal';
import { ReportIssueModal } from './components/ReportIssueModal';
import { AuthModal } from './components/AuthModal';
import { PublicTrackerModal } from './components/modals/PublicTrackerModal';
import { getComplaints, createComplaint, upvoteComplaint, transitionComplaintStatus, logoutUser } from './services/api';
import type { Complaint, CreateComplaintInput, UserRole, ComplaintStatus } from './types';

export default function App() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication & Portal Session State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('civicfix_session_active') === 'true';
  });

  // Layout & Navigation State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'reports' | 'map' | 'contractors' | 'analytics' | 'profile'>('dashboard');
  const [activeFilterTab, setActiveFilterTab] = useState('Recent Issues');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Theme state: Default Light mode matching reference
  const [isDarkMode, setIsDarkMode] = useState(false);

  // User Session State
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('civicfix_user_role') as UserRole) || 'CITIZEN';
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('civicfix_user_name') || 'Citizen Resident';
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('civicfix_user_email') || 'citizen@civicfix.gov.in';
  });

  // Modals & Security Gates
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPublicTrackerOpen, setIsPublicTrackerOpen] = useState(false);
  const [isAdminAuthBlocked, setIsAdminAuthBlocked] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // URL Route Protection & Admin URL Guard
  useEffect(() => {
    const checkAdminRoute = () => {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();

      if (path.includes('/admin') || hash.includes('#admin')) {
        if (!isAuthenticated || currentRole !== 'ADMIN') {
          // Block unauthorized access to /admin
          setIsAdminAuthBlocked(true);
        } else {
          setIsAdminAuthBlocked(false);
          setCurrentTab('dashboard');
        }
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);
    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, [isAuthenticated, currentRole]);

  // Fetch real complaints from Spring Boot / Supabase API
  const fetchComplaints = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getComplaints();
      setComplaints(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load complaints from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Handle Role Switch with proper persona name and email
  const handleSwitchRole = (role: UserRole, customName?: string, customEmail?: string) => {
    setCurrentRole(role);
    let resolvedName = customName;
    let resolvedEmail = customEmail;

    if (role === 'ADMIN') {
      resolvedName = customName || 'Elena Vance';
      resolvedEmail = customEmail || 'admin@civicfix.gov.in';
      setUserName(resolvedName);
      setUserEmail(resolvedEmail);
      setCurrentTab('dashboard');
    } else if (role === 'WORKER') {
      resolvedName = customName || 'ABC Construction Ltd';
      resolvedEmail = customEmail || 'worker@civicfix.gov.in';
      setUserName(resolvedName);
      setUserEmail(resolvedEmail);
      setCurrentTab('contractors');
    } else {
      resolvedName = customName || 'Citizen Resident';
      resolvedEmail = customEmail || 'citizen@civicfix.gov.in';
      setUserName(resolvedName);
      setUserEmail(resolvedEmail);
      setCurrentTab('dashboard');
    }

    localStorage.setItem('civicfix_session_active', 'true');
    localStorage.setItem('civicfix_user_role', role);
    localStorage.setItem('civicfix_user_name', resolvedName);
    localStorage.setItem('civicfix_user_email', resolvedEmail);
    setIsAuthenticated(true);
  };

  // Full Log Out returning to Dedicated LoginPage
  const handleLogout = () => {
    logoutUser();
    localStorage.removeItem('civicfix_session_active');
    localStorage.removeItem('civicfix_user_role');
    localStorage.removeItem('civicfix_user_name');
    localStorage.removeItem('civicfix_user_email');
    setIsAuthenticated(false);
    setCurrentRole('CITIZEN');
    setUserName('Citizen Resident');
    setUserEmail('citizen@civicfix.gov.in');
    setCurrentTab('dashboard');
  };

  // Phase 11: Resolution Verification Gate status transitions
  const handleTransitionStatus = async (
    id: string,
    targetStatus: ComplaintStatus,
    notes?: string,
    resolutionPhotoUrl?: string,
    disputeReason?: string
  ): Promise<Complaint> => {
    try {
      const updated = await transitionComplaintStatus(
        id,
        targetStatus,
        notes,
        resolutionPhotoUrl,
        disputeReason
      );
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setSelectedComplaint(updated);
      return updated;
    } catch (err: any) {
      alert('Status transition failed: ' + (err.response?.data?.message || err.message));
      throw err;
    }
  };

  // Guard against unauthorized tab access
  useEffect(() => {
    if (currentRole === 'CITIZEN' && (currentTab === 'contractors' || currentTab === 'analytics')) {
      setCurrentTab('dashboard');
    }
    if (currentRole === 'WORKER' && (currentTab === 'analytics' || currentTab === 'contractors')) {
      setCurrentTab('dashboard');
    }
  }, [currentRole, currentTab]);

  // Handle Theme Toggle
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
      return next;
    });
  };

  // Handle New Complaint Submission
  const handleCreateComplaint = async (input: CreateComplaintInput) => {
    const newRecord = await createComplaint(input);
    setComplaints((prev) => [newRecord, ...prev]);
  };

  // Track complaints confirmed by this user (1-vote-per-user constraint)
  const [upvotedIds, setUpvotedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('civicfix_upvoted_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Handle Upvote toggle (strictly prevents duplicate voting)
  const handleUpvote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const alreadyUpvoted = upvotedIds.has(id);
    const isAdd = !alreadyUpvoted;

    try {
      const updated = await upvoteComplaint(id, isAdd);
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(updated);
      }

      setUpvotedIds((prev) => {
        const next = new Set(prev);
        if (isAdd) {
          next.add(id);
        } else {
          next.delete(id);
        }
        localStorage.setItem('civicfix_upvoted_ids', JSON.stringify(Array.from(next)));
        return next;
      });
    } catch (err: any) {
      alert('Upvote failed: ' + (err.message || 'Server error'));
    }
  };

  // Search filter
  const searchFilteredComplaints = useMemo(() => {
    if (!searchQuery.trim()) return complaints;
    const q = searchQuery.toLowerCase().trim();
    return complaints.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.addressText.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [complaints, searchQuery]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onLoginSuccess={(role, fullName, email) => {
            handleSwitchRole(role, fullName, email);
          }}
          onContinueAsGuest={() => {
            handleSwitchRole('CITIZEN', 'Guest Resident', 'guest@civicfix.gov.in');
          }}
          onOpenPublicTracker={() => setIsPublicTrackerOpen(true)}
        />
        <PublicTrackerModal
          isOpen={isPublicTrackerOpen}
          onClose={() => setIsPublicTrackerOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="app-container">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab as any)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        currentRole={currentRole}
        onSwitchRole={(role) => handleSwitchRole(role)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* 2. Main Workspace */}
      <div className="main-wrapper">
        {/* Top Header Bar with Sleek Avatar Dropdown */}
        <TopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isDarkMode={isDarkMode}
          onToggleTheme={handleToggleTheme}
          currentRole={currentRole}
          userName={userName}
          userEmail={userEmail}
          onNavigateTab={(tab) => setCurrentTab(tab as any)}
          onOpenLoginModal={() => setIsAuthModalOpen(true)}
          onLogout={handleLogout}
          onSwitchRole={(role) => handleSwitchRole(role)}
        />

        {/* Dynamic Page Views */}
        <main>
          {currentTab === 'dashboard' && currentRole === 'CITIZEN' && (
            <CitizenDashboardView
              userName={userName}
              complaints={searchFilteredComplaints}
              loading={loading}
              error={error}
              activeFilterTab={activeFilterTab}
              onFilterTabChange={setActiveFilterTab}
              onViewDetails={setSelectedComplaint}
              onUpvote={handleUpvote}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              upvotedIds={upvotedIds}
            />
          )}

          {currentTab === 'dashboard' && currentRole === 'ADMIN' && (
            <AdminCommandView
              complaints={searchFilteredComplaints}
              onViewDetails={setSelectedComplaint}
              onRefresh={fetchComplaints}
            />
          )}

          {currentTab === 'contractors' && currentRole === 'ADMIN' && (
            <AdminContractorsView
              complaints={searchFilteredComplaints}
              onViewDetails={setSelectedComplaint}
            />
          )}

          {currentRole === 'WORKER' && (currentTab === 'dashboard' || currentTab === 'reports' || currentTab === 'contractors') && (
            <ContractorView
              complaints={searchFilteredComplaints}
              userName={userName}
              onViewDetails={setSelectedComplaint}
              onTransitionStatus={handleTransitionStatus}
            />
          )}

          {currentTab === 'reports' && currentRole === 'ADMIN' && (
            <AdminCommandView
              complaints={searchFilteredComplaints}
              onViewDetails={setSelectedComplaint}
              onRefresh={fetchComplaints}
            />
          )}

          {currentTab === 'reports' && currentRole === 'CITIZEN' && (
            <MyReportsView
              complaints={searchFilteredComplaints}
              userName={userName}
              onOpenReportModal={() => setIsReportModalOpen(true)}
              onViewDetails={setSelectedComplaint}
              onUpvote={handleUpvote}
              upvotedIds={upvotedIds}
            />
          )}

          {currentTab === 'map' && (
            <CivicHeatmapView
              complaints={searchFilteredComplaints}
              onViewDetails={setSelectedComplaint}
              onRefresh={fetchComplaints}
            />
          )}

          {currentTab === 'analytics' && currentRole === 'ADMIN' && (
            <AnalyticsView
              complaints={searchFilteredComplaints}
              onRefresh={fetchComplaints}
            />
          )}

          {currentTab === 'profile' && (
            <ProfileView
              userName={userName}
              currentRole={currentRole}
              onUpdateName={setUserName}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmit={handleCreateComplaint}
      />

      <ComplaintDetailModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpvote={(id) => handleUpvote(id)}
        currentRole={currentRole}
        isUpvoted={selectedComplaint ? upvotedIds.has(selectedComplaint.id) : false}
        onTransitionStatus={handleTransitionStatus}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={currentRole}
        onSelectRole={handleSwitchRole}
      />

      <PublicTrackerModal
        isOpen={isPublicTrackerOpen}
        onClose={() => setIsPublicTrackerOpen(false)}
      />

      {/* Admin Route Protection & Authentication Guard */}
      {isAdminAuthBlocked && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'center', padding: '32px 24px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '26px'
            }}>
              🛡️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Admin Privileges Required
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
              The Municipal Operations Command Center (<code style={{ color: '#ef4444' }}>/admin</code>) is strictly restricted to verified Municipal Administrators. Your current session ({currentRole}) does not have administrative clearance.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="primary-teal-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  setIsAdminAuthBlocked(false);
                  setIsAuthModalOpen(true);
                }}
              >
                🔐 Authenticate as Municipal Admin
              </button>
              <button
                className="secondary-outline-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                onClick={() => {
                  setIsAdminAuthBlocked(false);
                  if (window.history.pushState) {
                    window.history.pushState(null, '', '/');
                  }
                  setCurrentTab('dashboard');
                }}
              >
                ← Return to Safe Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
