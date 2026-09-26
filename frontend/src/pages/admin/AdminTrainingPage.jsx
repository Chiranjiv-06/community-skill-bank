import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import { trainingService } from '../../services/trainingService';
import { GraduationCap, Users, CheckCircle2, Clock, Layers, Award, RefreshCw } from 'lucide-react';

export const AdminTrainingPage = () => {
  const [modules, setModules] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [mods, st] = await Promise.all([
        trainingService.getTrainingModules(),
        trainingService.getTrainingStats()
      ]);
      setModules(mods);
      setStats(st);
    } catch (err) {
      console.error('[AdminTrainingPage] Error loading training data:', err);
      setError('Failed to load training programs database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="admin-training-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Header */}
      <PageHeader
        title="Training Programs Management"
        description="Monitor disaster preparedness curriculums, mass casualty triage drills, tactical radio exercises, and volunteer readiness rates."
        actions={
          <Button variant="outline" onClick={loadData}>
            <RefreshCw size={15} style={{ marginRight: '6px' }} />
            Refresh Training Data
          </Button>
        }
      />

      {/* KPI Stats */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--spacing-md)'
          }}
        >
          <div style={{ background: 'var(--color-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Curriculum Tracks</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
              {stats.totalCourses} Programs
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Active Volunteer Trainees</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
              {stats.activeEnrolled} Enrolled
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Completed Accreditations</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
              {stats.completedCertifications} Mastered
            </div>
          </div>

          <div style={{ background: 'var(--color-surface)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Curriculum Pass Rate</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
              {stats.completionRate}
            </div>
          </div>
        </div>
      )}

      {loading && <LoadingState message="Loading training curriculum data..." />}

      {error && (
        <ErrorState
          title="Could Not Load Training Programs"
          message={error}
          onRetry={loadData}
        />
      )}

      {/* Curriculum Tracks Table/Cards */}
      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
            Accredited Preparedness Curriculum
          </h3>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: 'var(--spacing-md)'
            }}
          >
            {modules.map((mod) => (
              <Card
                key={mod.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--spacing-md)',
                  borderLeft: '4px solid var(--color-primary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                      <Badge variant="primary" style={{ fontSize: '11px' }}>
                        {mod.category}
                      </Badge>
                      <Badge variant="neutral" style={{ fontSize: '11px' }}>
                        {mod.level}
                      </Badge>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                      {mod.title}
                    </h3>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {mod.description}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-hover)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div>
                    <span>Hours:</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mod.durationHours} hrs</div>
                  </div>
                  <div>
                    <span>Modules:</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mod.modulesCount} Drills</div>
                  </div>
                  <div>
                    <span>Prerequisite:</span>
                    <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{mod.prerequisite || 'None'}</div>
                  </div>
                </div>

                {mod.certificationRelationship && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={14} />
                    <span>{mod.certificationRelationship}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTrainingPage;
