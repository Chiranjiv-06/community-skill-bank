import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Clock,
  Award,
  Star,
  CheckCircle,
  Calendar,
  AlertCircle,
  RefreshCw,
  Flame,
  ShieldCheck
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import LoadingState from '../../components/states/LoadingState';
import EmptyState from '../../components/states/EmptyState';
import { trustService } from '../../services/trustService';

export const ContributionsPage = () => {
  const [contributions, setContributions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadContributionsData = async () => {
    try {
      setError(null);
      const [contributionsList, summaryData] = await Promise.all([
        trustService.getMyContributions(),
        trustService.getMyTrustSummary()
      ]);
      setContributions(contributionsList || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('[ContributionsPage] Error loading contributions:', err);
      setError(err.message || 'Failed to load your contribution records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadContributionsData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadContributionsData();
  };

  if (isLoading) {
    return <LoadingState message="Loading your field mission contributions & service hours..." minHeight="360px" />;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: 'var(--space-8)' }}>
      <PageHeader
        title="My Contributions & Service History"
        subtitle="Verifiable record of completed disaster response missions, on-scene service hours, supervisor evaluations, and trust milestones."
        icon={<HeartHandshake size={24} color="var(--color-primary)" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            icon={<RefreshCw size={15} />}
          >
            Refresh Records
          </Button>
        }
      />

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            background: 'var(--color-critical-bg)',
            border: '1px solid var(--color-critical-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-critical)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)'
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Trust & Service Hours Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)'
        }}
      >
        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <Clock size={20} color="var(--color-primary)" />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verified Service Hours
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {summary?.totalVerifiedHours !== undefined ? `${summary.totalVerifiedHours} hrs` : '0 hrs'}
          </div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Recorded from completed missions
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <CheckCircle size={20} color="var(--color-success)" />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Completed Missions
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {summary?.completedMissions || contributions.length || 0}
          </div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Fulfilled emergency deployments
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <Star size={20} color="var(--color-warning)" />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Supervisor Rating
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {summary?.averageRating ? `${summary.averageRating.toFixed(1)} / 5.0` : 'Unrated'}
          </div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            {summary?.ratedMissions ? `From ${summary.ratedMissions} evaluations` : 'Awaiting mission evaluations'}
          </span>
        </Card>

        <Card style={{ padding: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
            <ShieldCheck size={20} color="var(--color-info)" />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Reliability Tier
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--color-info)' }}>
            {summary?.reliabilityTier || 'New Responder'}
          </div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
            Platform operational standing
          </span>
        </Card>
      </div>

      {/* Contributions List */}
      <div>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
          Mission Log & Supervisor Feedback
        </h2>

        {contributions.length === 0 ? (
          <EmptyState
            icon={<Award size={32} color="var(--text-muted)" />}
            title="No Completed Mission Contributions Yet"
            description="When you deploy to emergency incidents and mark your assignments completed, your operational hours and supervisor ratings will be cataloged here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {contributions.map((item) => (
              <Card key={item.assignmentId} style={{ padding: 'var(--space-5)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                      <Flame size={16} color="var(--color-primary)" />
                      <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {item.emergencyTitle}
                      </h3>
                      <Badge variant="success">Completed</Badge>
                    </div>

                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      {item.completedAt && (
                        <span>
                          <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Completed: {new Date(item.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      {item.hoursServed !== null && item.hoursServed !== undefined && (
                        <span>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          Logged Hours: <strong>{item.hoursServed} hrs</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {item.rating && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        background: 'rgba(234, 179, 8, 0.1)',
                        border: '1px solid rgba(234, 179, 8, 0.25)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-warning)',
                        fontWeight: 700,
                        fontSize: 'var(--font-sm)'
                      }}
                    >
                      <Star size={14} fill="currentColor" />
                      <span>{item.rating} / 5</span>
                    </div>
                  )}
                </div>

                {item.feedbackNotes && (
                  <div
                    style={{
                      marginTop: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-xs)',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>Supervisor Feedback:</strong> {item.feedbackNotes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributionsPage;
