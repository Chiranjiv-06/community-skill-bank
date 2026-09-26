import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import ErrorState from '../../components/states/ErrorState';
import TrustPassportCard from '../../components/trust/TrustPassportCard';
import { trustService } from '../../services/trustService';
import { assignmentService } from '../../services/assignmentService';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, ShieldCheck, Download, Share2, Activity, Calendar, MapPin } from 'lucide-react';

export const SkillPassportPage = () => {
  const { user } = useAuth();
  const [trustProfile, setTrustProfile] = useState(null);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const volunteerId = user?.id || 'dev-skl-002';

      const [profileData, assignments] = await Promise.all([
        trustService.getTrustProfile(volunteerId),
        assignmentService.getAssignmentsForVolunteer(volunteerId)
      ]);

      setTrustProfile(profileData);
      setCompletedAssignments(assignments.filter((a) => a.status === 'completed'));
    } catch (err) {
      console.error('[SkillPassportPage] Error loading skill passport data:', err);
      setError('Failed to load Digital Skill Passport credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDownloadCredentials = () => {
    alert('Exporting cryptographically signed Digital Skill Passport PDF...');
  };

  return (
    <div className="skill-passport-page" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
      {/* Page Header */}
      <PageHeader
        title="Digital Skill Passport"
        description="Tamper-evident, verifiable digital responder badge displaying your emergency clearances, trust tier, validated skills, and verified incident hours."
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="outline" onClick={handleDownloadCredentials}>
              <Download size={16} style={{ marginRight: '6px' }} />
              Export Passport PDF
            </Button>
          </div>
        }
      />

      {loading && <LoadingState message="Verifying digital credentials & trust passport..." />}

      {error && (
        <ErrorState
          title="Could Not Load Skill Passport"
          message={error}
          onRetry={loadData}
        />
      )}

      {!loading && !error && trustProfile && (
        <>
          {/* Main Trust Passport Card */}
          <TrustPassportCard
            trustProfile={trustProfile}
            volunteer={user}
            completedAssignmentsCount={completedAssignments.length}
          />

          {/* Incident Deployment & Mission History (Stage 7 Integration) */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="var(--color-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                  Verified Incident Deployment Record
                </h3>
              </div>
              <Badge variant="success">
                {completedAssignments.length} Verified Field Missions
              </Badge>
            </div>

            {completedAssignments.length === 0 ? (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', fontStyle: 'italic', padding: '12px 0' }}>
                No completed incident assignments on record. Field deployments will be automatically logged here upon mission completion.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {completedAssignments.map((asg) => (
                  <div
                    key={asg.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--color-surface-hover)',
                      border: '1px solid var(--color-border-subtle)',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                        {asg.emergencyTitle}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="var(--color-primary)" />
                          {asg.emergencyLocation}
                        </span>
                        <span>Role: <strong>{asg.skill}</strong></span>
                        <span>Completed: {asg.completionInfo?.completedAt ? new Date(asg.completionInfo.completedAt).toLocaleDateString() : 'Recorded'}</span>
                      </div>
                      {asg.completionInfo?.completionNotes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Debrief: "{asg.completionInfo.completionNotes}"
                        </div>
                      )}
                    </div>

                    <Badge variant="success" style={{ fontSize: '11px' }}>
                      Command Verified
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default SkillPassportPage;
