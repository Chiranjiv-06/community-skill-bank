import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Card from '../../components/common/Card';
import EmptyState from '../../components/states/EmptyState';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import TrainingCourseCard from '../../components/trust/TrainingCourseCard';
import TrainingDetailModal from '../../components/trust/TrainingDetailModal';
import { trainingService } from '../../services/trainingService';
import { useAuth } from '../../context/AuthContext';
import {
  EXTERNAL_RESOURCES,
  WORKSHOPS_AND_WEBINARS,
  OFFICIAL_NEWS_UPDATES,
  QUICK_HELP_RESOURCES
} from '../../data/learningPreparednessData';
import {
  GraduationCap,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  ExternalLink,
  Radio,
  Flame,
  Waves,
  ShieldAlert,
  HeartPulse,
  Globe,
  ArrowRight,
  Info,
  LifeBuoy
} from 'lucide-react';

/**
 * Community Learning & Preparedness Hub
 * 
 * Structured into 6 clean, non-mixed logical sections:
 * 1. MY TRAINING (Real backend records from GET /api/trainings/mine)
 * 2. COMMUNITY SKILL BANK TRAINING (Internal CSB Courses, Workshops & Drills)
 * 3. EXTERNAL LEARNING RESOURCES (Open Courses, Guides, Reference Material)
 * 4. WORKSHOPS & WEBINARS (Upcoming Sessions, Previous / Recorded Archives)
 * 5. DISASTER NEWS & UPDATES (Official Updates & Situational Bulletins)
 * 6. QUICK HELP (Immediate emergency reference guides: First Aid, Flood, Fire, Earthquake, Telecom)
 */
export const TrainingPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Global Section Filter: 'ALL' | 'MY_TRAINING' | 'CSB_TRAINING' | 'EXTERNAL_RESOURCES' | 'WORKSHOPS' | 'NEWS' | 'QUICK_HELP'
  const [activeSection, setActiveSection] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sub-section filters
  const [myTrainingFilter, setMyTrainingFilter] = useState('ALL'); // 'ALL' | 'in_progress' | 'completed' | 'enrolled'
  const [csbFilter, setCsbFilter] = useState('ALL'); // 'ALL' | 'courses' | 'workshops' | 'drills'
  const [extFilter, setExtFilter] = useState('ALL'); // 'ALL' | 'courses' | 'guides' | 'reference'
  const [workshopFilter, setWorkshopFilter] = useState('ALL'); // 'ALL' | 'upcoming' | 'recorded'

  // Selected course for detail modal
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const volunteerId = user?.id || 'dev-skl-002';
      const data = await trainingService.getVolunteerTraining(volunteerId);
      setCourses(data);
    } catch (err) {
      console.error('[TrainingPage] Error loading training courses:', err);
      setError('Failed to load training curriculum.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleEnroll = async (course) => {
    const volunteerId = user?.id || 'dev-skl-002';
    await trainingService.enrollInTraining(volunteerId, course.id);
    await loadCourses();
    const updated = await trainingService.getVolunteerTraining(volunteerId);
    const found = updated.find((c) => c.id === course.id);
    if (found) setSelectedCourse(found);
  };

  const handleProgressUpdate = async (courseId, nextPercentage) => {
    const volunteerId = user?.id || 'dev-skl-002';
    await trainingService.updateTrainingProgress(volunteerId, courseId, nextPercentage);
    await loadCourses();
    const updated = await trainingService.getVolunteerTraining(volunteerId);
    const found = updated.find((c) => c.id === courseId);
    if (found) setSelectedCourse(found);
  };

  const handleOpenDetails = (course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // SECTION 1: MY TRAINING DATA (Live Backend Records)
  // ---------------------------------------------------------------------------
  const myEnrolledCourses = useMemo(() => {
    return courses.filter((c) => c.status === 'in_progress' || c.status === 'completed' || c.status === 'verified');
  }, [courses]);

  const myFilteredCourses = useMemo(() => {
    let list = myEnrolledCourses;
    if (myTrainingFilter === 'in_progress') {
      list = list.filter((c) => c.status === 'in_progress');
    } else if (myTrainingFilter === 'completed') {
      list = list.filter((c) => c.status === 'completed' || c.status === 'verified');
    } else if (myTrainingFilter === 'enrolled') {
      list = list.filter((c) => c.status === 'in_progress' && (c.progressPercentage || 0) <= 25);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q) ||
          c.provider?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [myEnrolledCourses, myTrainingFilter, searchQuery]);

  const inProgressCount = useMemo(() => {
    return courses.filter((c) => c.status === 'in_progress').length;
  }, [courses]);

  const completedCount = useMemo(() => {
    return courses.filter((c) => c.status === 'completed' || c.status === 'verified').length;
  }, [courses]);

  // ---------------------------------------------------------------------------
  // SECTION 2: COMMUNITY SKILL BANK TRAINING (Internal CSB Curriculum)
  // ---------------------------------------------------------------------------
  const getCsbItemType = (course) => {
    if (course.id === 'trn-102') return 'WORKSHOP';
    if (course.id === 'trn-101' || course.id === 'trn-103') return 'DRILL';
    return 'COURSE';
  };

  const csbFilteredCourses = useMemo(() => {
    let list = courses;
    if (csbFilter === 'courses') {
      list = list.filter((c) => getCsbItemType(c) === 'COURSE');
    } else if (csbFilter === 'workshops') {
      list = list.filter((c) => getCsbItemType(c) === 'WORKSHOP');
    } else if (csbFilter === 'drills') {
      list = list.filter((c) => getCsbItemType(c) === 'DRILL');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [courses, csbFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // SECTION 3: EXTERNAL LEARNING RESOURCES
  // ---------------------------------------------------------------------------
  const extFilteredResources = useMemo(() => {
    let all = [];
    if (extFilter === 'ALL' || extFilter === 'courses') {
      all = all.concat(EXTERNAL_RESOURCES.courses);
    }
    if (extFilter === 'ALL' || extFilter === 'guides') {
      all = all.concat(EXTERNAL_RESOURCES.guides);
    }
    if (extFilter === 'ALL' || extFilter === 'reference') {
      all = all.concat(EXTERNAL_RESOURCES.reference);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      all = all.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.organization.toLowerCase().includes(q) ||
          r.topic.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return all;
  }, [extFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // SECTION 4: WORKSHOPS & WEBINARS
  // ---------------------------------------------------------------------------
  const workshopFilteredItems = useMemo(() => {
    let all = [];
    if (workshopFilter === 'ALL' || workshopFilter === 'upcoming') {
      all = all.concat(WORKSHOPS_AND_WEBINARS.upcoming);
    }
    if (workshopFilter === 'ALL' || workshopFilter === 'recorded') {
      all = all.concat(WORKSHOPS_AND_WEBINARS.recorded);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      all = all.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.organizer.toLowerCase().includes(q) ||
          w.topic.toLowerCase().includes(q) ||
          w.description.toLowerCase().includes(q)
      );
    }
    return all;
  }, [workshopFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // SECTION 5: DISASTER NEWS & UPDATES (Official Updates)
  // ---------------------------------------------------------------------------
  const newsFilteredItems = useMemo(() => {
    let list = OFFICIAL_NEWS_UPDATES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.source.toLowerCase().includes(q) ||
          n.summary.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // SECTION 6: QUICK HELP (5 Emergency Reference Categories)
  // ---------------------------------------------------------------------------
  const quickHelpFilteredItems = useMemo(() => {
    let list = QUICK_HELP_RESOURCES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (h) =>
          h.title.toLowerCase().includes(q) ||
          h.category.toLowerCase().includes(q) ||
          h.summary.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery]);

  const renderQuickHelpIcon = (iconName) => {
    const props = { size: 20, color: 'var(--color-primary)' };
    switch (iconName) {
      case 'HeartPulse':
        return <HeartPulse {...props} />;
      case 'Waves':
        return <Waves {...props} />;
      case 'Flame':
        return <Flame {...props} />;
      case 'ShieldAlert':
        return <ShieldAlert {...props} />;
      case 'Radio':
        return <Radio {...props} />;
      default:
        return <LifeBuoy {...props} />;
    }
  };

  // Section visibility flags
  const showSection1 = activeSection === 'ALL' || activeSection === 'MY_TRAINING';
  const showSection2 = activeSection === 'ALL' || activeSection === 'CSB_TRAINING';
  const showSection3 = activeSection === 'ALL' || activeSection === 'EXTERNAL_RESOURCES';
  const showSection4 = activeSection === 'ALL' || activeSection === 'WORKSHOPS';
  const showSection5 = activeSection === 'ALL' || activeSection === 'NEWS';
  const showSection6 = activeSection === 'ALL' || activeSection === 'QUICK_HELP';

  const hasAnyMatches =
    (showSection1 && myFilteredCourses.length > 0) ||
    (showSection2 && csbFilteredCourses.length > 0) ||
    (showSection3 && extFilteredResources.length > 0) ||
    (showSection4 && workshopFilteredItems.length > 0) ||
    (showSection5 && newsFilteredItems.length > 0) ||
    (showSection6 && quickHelpFilteredItems.length > 0);

  return (
    <div className="community-learning-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {/* Top Header */}
      <div>
        <PageHeader
          title="COMMUNITY LEARNING & PREPAREDNESS"
          description="Build practical emergency-response skills, discover trusted learning resources, and stay informed about disaster preparedness."
        />
      </div>

      {/* Summary KPI Overview Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--spacing-md)'
        }}
      >
        <div
          onClick={() => { setActiveSection('MY_TRAINING'); setMyTrainingFilter('ALL'); }}
          style={{
            background: 'var(--color-surface)',
            border: activeSection === 'MY_TRAINING' ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              My Training
            </span>
            <GraduationCap size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '8px' }}>
            {myEnrolledCourses.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Tracked in backend database
          </div>
        </div>

        <div
          onClick={() => { setActiveSection('MY_TRAINING'); setMyTrainingFilter('in_progress'); }}
          style={{
            background: 'var(--color-surface)',
            border: (activeSection === 'MY_TRAINING' && myTrainingFilter === 'in_progress') ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              In Progress
            </span>
            <PlayCircle size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '8px' }}>
            {inProgressCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Active scenario drills
          </div>
        </div>

        <div
          onClick={() => { setActiveSection('MY_TRAINING'); setMyTrainingFilter('completed'); }}
          style={{
            background: 'var(--color-surface)',
            border: (activeSection === 'MY_TRAINING' && myTrainingFilter === 'completed') ? '1px solid var(--color-success)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Completed
            </span>
            <CheckCircle2 size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '8px' }}>
            {completedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Documented completions
          </div>
        </div>

        <div
          onClick={() => { setActiveSection('EXTERNAL_RESOURCES'); setExtFilter('ALL'); }}
          style={{
            background: 'var(--color-surface)',
            border: activeSection === 'EXTERNAL_RESOURCES' ? '1px solid var(--color-info)' : '1px solid var(--color-border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
              Learning Resources
            </span>
            <Globe size={18} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '8px' }}>
            20+
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Open courses, portals & guides
          </div>
        </div>
      </div>

      {/* Global Filter & Search Control Bar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
          background: 'var(--color-surface)',
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder="Search all training, curriculum, external courses, workshops, news, and quick guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <Button size="sm" variant="ghost" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          )}
        </div>

        {/* Primary Section Jump Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingTop: '6px',
            borderTop: '1px solid var(--color-border-subtle)'
          }}
        >
          {[
            { id: 'ALL', label: 'All Sections' },
            { id: 'MY_TRAINING', label: '1. My Training' },
            { id: 'CSB_TRAINING', label: '2. CSB Curriculum' },
            { id: 'EXTERNAL_RESOURCES', label: '3. External Resources' },
            { id: 'WORKSHOPS', label: '4. Workshops & Webinars' },
            { id: 'NEWS', label: '5. Official Updates' },
            { id: 'QUICK_HELP', label: '6. Quick Help' }
          ].map((tab) => {
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  background: isActive ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                  border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Global State Displays */}
      {loading && <LoadingState message="Loading Community Learning & Preparedness Hub..." />}

      {error && (
        <ErrorState
          title="Could Not Load Hub Telemetry"
          message={error}
          onRetry={loadCourses}
        />
      )}

      {!loading && !error && !hasAnyMatches && (
        <EmptyState
          title="No Matching Resources Found"
          message="No records, curriculum drills, workshops, or guides matched your search criteria."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setActiveSection('ALL');
                setSearchQuery('');
                setMyTrainingFilter('ALL');
                setCsbFilter('ALL');
                setExtFilter('ALL');
                setWorkshopFilter('ALL');
              }}
            >
              Reset All Filters
            </Button>
          }
        />
      )}

      {/* ========================================================================= */}
      {/* 1. MY TRAINING (Most prominent, first section, real backend records)       */}
      {/* ========================================================================= */}
      {!loading && !error && showSection1 && (
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md)',
            background: 'rgba(255, 107, 0, 0.03)',
            padding: '20px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 107, 0, 0.2)'
          }}
        >
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  1. My Training
                </h2>
                <Badge variant="primary" style={{ fontSize: '11px', fontWeight: 700 }}>
                  MY TRAINING
                </Badge>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Your personal training progress, live backend enrollments, and accredited completion records.
              </p>
            </div>

            {/* Sub-Filters: In Progress | Completed | Enrolled */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All (${myEnrolledCourses.length})` },
                { id: 'in_progress', label: `In Progress (${inProgressCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
                { id: 'enrolled', label: 'Enrolled' }
              ].map((sub) => {
                const isSelected = myTrainingFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setMyTrainingFilter(sub.id)}
                    style={{
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          {myFilteredCourses.length === 0 ? (
            <Card
              style={{
                padding: '24px',
                background: 'var(--color-surface)',
                border: '1px dashed var(--color-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <Info size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                  No Training Records in this View
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {myEnrolledCourses.length === 0
                    ? 'You have not enrolled in any training drills yet. Browse the Community Skill Bank Training below to begin building your operational response skills.'
                    : 'No training records matched the selected sub-filter.'}
                </div>
              </div>
            </Card>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
                gap: 'var(--spacing-md)'
              }}
            >
              {myFilteredCourses.map((course) => {
                const isDone = course.status === 'completed' || course.status === 'verified';
                const isVerified = course.status === 'verified';
                const progressPct = course.progressPercentage || (isDone ? 100 : 50);

                return (
                  <Card
                    key={course.id || course.enrollmentId}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderLeft: isDone ? '4px solid var(--color-success)' : '4px solid var(--color-primary)',
                      background: 'var(--color-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Badge variant="primary" style={{ fontSize: '10px', fontWeight: 700 }}>
                          MY TRAINING
                        </Badge>
                        <Badge variant="neutral" style={{ fontSize: '10px' }}>
                          {course.category || 'Disaster Response'}
                        </Badge>
                      </div>

                      {isVerified ? (
                        <Badge variant="success" style={{ fontSize: '11px' }}>
                          <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                          VERIFIED
                        </Badge>
                      ) : isDone ? (
                        <Badge variant="success" style={{ fontSize: '11px' }}>
                          <CheckCircle2 size={12} style={{ marginRight: '4px' }} />
                          COMPLETED
                        </Badge>
                      ) : (
                        <Badge variant="primary" style={{ fontSize: '11px' }}>
                          <PlayCircle size={12} style={{ marginRight: '4px' }} />
                          IN PROGRESS
                        </Badge>
                      )}
                    </div>

                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                        {course.title}
                      </h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Provider: {course.provider || 'Community Skill Bank Academy'}
                      </div>
                    </div>

                    {/* Progress Bar & Telemetry */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <span>Progress</span>
                        <span style={{ fontWeight: 600, color: isDone ? 'var(--color-success)' : 'var(--color-primary)' }}>
                          {progressPct}% {course.score ? `(Score: ${course.score})` : ''}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: '6px',
                          background: 'var(--color-surface-hover)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            width: `${progressPct}%`,
                            height: '100%',
                            background: isDone ? 'var(--color-success)' : 'var(--color-primary)',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        paddingTop: '6px',
                        borderTop: '1px solid var(--color-border-subtle)'
                      }}
                    >
                      {course.completedAt ? (
                        <span>Completed: {course.completedAt.split('T')[0]}</span>
                      ) : (
                        <span>Modules: {course.lastModuleCompleted || 2} of {course.modulesCount || 4} done</span>
                      )}
                      <span>{course.durationHours || 8} Hours</span>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                      <Button
                        size="sm"
                        variant={isDone ? 'outline' : 'primary'}
                        style={{ width: '100%' }}
                        onClick={() => handleOpenDetails(course)}
                      >
                        {isDone ? (
                          <>
                            <BookOpen size={14} style={{ marginRight: '6px' }} />
                            Review Syllabus & Notes
                          </>
                        ) : (
                          <>
                            <ArrowRight size={14} style={{ marginRight: '6px' }} />
                            Continue Training
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. COMMUNITY SKILL BANK TRAINING (Internal CSB Courses, Workshops, Drills) */}
      {/* ========================================================================= */}
      {!loading && !error && showSection2 && csbFilteredCourses.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  2. Community Skill Bank Training
                </h2>
                <Badge variant="primary" style={{ fontSize: '11px', fontWeight: 700 }}>
                  INTERNAL CURRICULUM
                </Badge>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Field-tested disaster response curriculum structured into formal Courses, interactive Workshops, and tactical Drills.
              </p>
            </div>

            {/* Sub-Filters: All | Courses | Workshops | Drills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Curriculum' },
                { id: 'courses', label: 'Courses' },
                { id: 'workshops', label: 'Workshops' },
                { id: 'drills', label: 'Drills' }
              ].map((sub) => {
                const isSelected = csbFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCsbFilter(sub.id)}
                    style={{
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {csbFilteredCourses.map((course) => (
              <TrainingCourseCard
                key={course.id}
                course={course}
                typeBadge={getCsbItemType(course)}
                onStartCourse={(c) => {
                  handleEnroll(c);
                  handleOpenDetails(c);
                }}
                onContinueCourse={(c) => handleOpenDetails(c)}
                onViewDetails={(c) => handleOpenDetails(c)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. EXTERNAL LEARNING RESOURCES (Open Courses, Guides, Reference Material)  */}
      {/* ========================================================================= */}
      {!loading && !error && showSection3 && extFilteredResources.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  3. External Learning Resources
                </h2>
                <Badge variant="neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                  EXTERNAL RESOURCE
                </Badge>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Free, reputable public education platforms and manuals provided by official humanitarian and emergency agencies.
              </p>
            </div>

            {/* Sub-Filters: All | Open / Free Courses | Guides | Reference Material */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Resources' },
                { id: 'courses', label: 'Open / Free Courses' },
                { id: 'guides', label: 'Guides' },
                { id: 'reference', label: 'Reference Material' }
              ].map((sub) => {
                const isSelected = extFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setExtFilter(sub.id)}
                    style={{
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {extFilteredResources.map((res) => (
              <Card
                key={res.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {res.badges.map((badgeText, idx) => (
                    <Badge
                      key={idx}
                      variant={idx === 0 ? 'neutral' : 'outline'}
                      style={{ fontSize: '10px', fontWeight: 700 }}
                    >
                      {badgeText}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.08rem', color: 'var(--color-text-primary)' }}>
                    {res.title}
                  </h3>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    {res.organization}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Focus: {res.topic}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {res.description}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {res.subType}
                  </span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button size="sm" variant="outline">
                      <span>{res.actionLabel}</span>
                      <ExternalLink size={13} style={{ marginLeft: '6px' }} />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>

          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Info size={14} color="var(--color-primary)" />
            <span>
              External Resource Notice: Materials linked here are provided directly by external organizations. Community Skill Bank does not grant certification, accreditation, or credential verification for third-party programs.
            </span>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. WORKSHOPS & WEBINARS (Upcoming vs. Previous / Recorded)                 */}
      {/* ========================================================================= */}
      {!loading && !error && showSection4 && workshopFilteredItems.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                  4. Workshops & Webinars
                </h2>
                <Badge variant="neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                  WORKSHOP & WEBINAR
                </Badge>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Official portals for upcoming simulation exercises, live technical briefings, and on-demand recorded archives.
              </p>
            </div>

            {/* Sub-Filters: All | Upcoming | Previous / Recorded */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'All Sessions' },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'recorded', label: 'Previous / Recorded' }
              ].map((sub) => {
                const isSelected = workshopFilter === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setWorkshopFilter(sub.id)}
                    style={{
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {workshopFilteredItems.map((ws) => (
              <Card
                key={ws.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant="outline" style={{ fontSize: '10px', fontWeight: 700 }}>
                      {ws.badges ? ws.badges[0] : ws.type}
                    </Badge>
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                      {ws.delivery}
                    </span>
                  </div>
                  <Badge variant="neutral" style={{ fontSize: '10px' }}>
                    {ws.timing}
                  </Badge>
                </div>

                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                    {ws.title}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Organizer: {ws.organizer}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                    Topic: {ws.topic}
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {ws.description}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end'
                  }}
                >
                  <a
                    href={ws.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button size="sm" variant="primary">
                      <span>{ws.actionLabel}</span>
                      <ExternalLink size={13} style={{ marginLeft: '6px' }} />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. DISASTER NEWS & UPDATES (Official Updates)                             */}
      {/* ========================================================================= */}
      {!loading && !error && showSection5 && newsFilteredItems.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                5. Disaster News & Official Updates
              </h2>
              <Badge variant="neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                OFFICIAL UPDATES
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Verified situational alerts, humanitarian operations logs, and frontline responder advisories from official agency feeds.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {newsFilteredItems.map((news) => (
              <Card
                key={news.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant="primary" style={{ fontSize: '10px', fontWeight: 700 }}>
                      {news.badges ? news.badges[0] : 'OFFICIAL UPDATE'}
                    </Badge>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      {news.source}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    {news.date}
                  </span>
                </div>

                <h3 style={{ margin: '0', fontSize: '0.98rem', color: 'var(--color-text-primary)', lineHeight: 1.4 }}>
                  {news.title}
                </h3>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {news.summary}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
                >
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button size="sm" variant="ghost" style={{ fontSize: '0.8rem' }}>
                      <span>{news.actionLabel}</span>
                      <ExternalLink size={12} style={{ marginLeft: '5px' }} />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. QUICK HELP (Immediate Emergency Reference, not courses)                */}
      {/* ========================================================================= */}
      {!loading && !error && showSection6 && quickHelpFilteredItems.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                6. Quick Help & Emergency Reference
              </h2>
              <Badge variant="neutral" style={{ fontSize: '11px', fontWeight: 700 }}>
                QUICK HELP
              </Badge>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Rapid operational reference checklists and verified public safety guidelines. These are quick references, not courses.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {quickHelpFilteredItems.map((help) => (
              <Card
                key={help.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border-subtle)',
                  padding: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 107, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    {renderQuickHelpIcon(help.iconName)}
                  </div>
                  <div>
                    <Badge variant="outline" style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px' }}>
                      {help.category}
                    </Badge>
                    <h3 style={{ margin: '3px 0 0 0', fontSize: '0.96rem', color: 'var(--color-text-primary)' }}>
                      {help.title}
                    </h3>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {help.summary}
                </p>

                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--color-border-subtle)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                  }}
                >
                  <a
                    href={help.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button size="sm" variant="outline" style={{ fontSize: '0.78rem' }}>
                      <span>{help.actionLabel}</span>
                      <ExternalLink size={12} style={{ marginLeft: '5px' }} />
                    </Button>
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Drill Detail Modal (Preserved for in-app curriculum) */}
      <TrainingDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        course={selectedCourse}
        onProgressUpdate={handleProgressUpdate}
        onEnroll={handleEnroll}
      />
    </div>
  );
};

export default TrainingPage;
