import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  AlertTriangle,
  Users,
  CheckCircle2,
  Award,
  Activity,
  Clock,
  ShieldCheck,
  Bell,
  MapPin,
  TrendingUp,
  RefreshCw,
  Flame,
  Radio,
  FileCheck2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import { analyticsService } from '../../services/analyticsService';
import { TIME_PERIODS } from '../../data/devAnalytics';
import KpiCard from '../../components/analytics/KpiCard';
import BarChart from '../../components/analytics/BarChart';
import DonutChart from '../../components/analytics/DonutChart';
import AreaTrendChart from '../../components/analytics/AreaTrendChart';
import GeographicSection from '../../components/analytics/GeographicSection';
import AnalyticsFilterBar from '../../components/analytics/AnalyticsFilterBar';

/**
 * Stage 13 — Admin Analytics Dashboard Page
 * 
 * Provides aggregate disaster incident command telemetry across 8 core operational domains.
 * Completely decoupled from FastAPI and PostgreSQL — uses development analytics adapter.
 */
export const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [filters, setFilters] = useState({
    timePeriod: TIME_PERIODS.DAYS_7,
    severity: 'ALL',
    disasterType: 'ALL'
  });

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await analyticsService.getFullDashboardData(filters);
      setData(response);
    } catch (err) {
      console.error('[AdminAnalyticsPage] Error loading dashboard data:', err);
      setError('Analytics could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleResetFilters = () => {
    setFilters({
      timePeriod: TIME_PERIODS.DAYS_7,
      severity: 'ALL',
      disasterType: 'ALL'
    });
  };

  // Check if current filter yielded zero emergencies
  const hasNoEmergencies = data?.kpis?.totalEmergencies === 0;

  return (
    <div className="analytics-dashboard">
      {/* Page Header */}
      <PageHeader
        title="Disaster Incident Analytics"
        subtitle="Aggregate operational telemetry, emergency severity, volunteer mobilization, and sector readiness."
        icon={<BarChart3 size={24} />}
        badge={
          <Badge variant="warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Incident Command
          </Badge>
        }
      />

      {/* Development Telemetry Banner */}
      <div className="analytics-banner">
        <div className="analytics-banner-content">
          <span className="analytics-banner-badge">Dev Boundary</span>
          <span>
            Development Analytics Telemetry Active — Read-only mock data adapter. Future backend endpoint: <code>GET /api/analytics</code>
          </span>
        </div>
        {data?.lastUpdated && (
          <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
            Telemetry Timestamp: {new Date(data.lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Global Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        onRefresh={() => loadAnalytics(true)}
        isRefreshing={refreshing}
        lastUpdated={data?.lastUpdated}
      />

      {/* Loading State */}
      {loading && (
        <div className="state-container" aria-live="polite">
          <div className="spinner" />
          <h3 className="state-title" style={{ marginTop: 'var(--space-4)' }}>
            Loading analytics...
          </h3>
          <p className="state-description">
            Aggregating incident dispatches, volunteer rosters, and sector readiness metrics.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-container" role="alert">
          <div className="state-icon-wrapper" style={{ color: 'var(--color-critical)' }}>
            <AlertCircle size={32} />
          </div>
          <h3 className="state-title">{error}</h3>
          <p className="state-description">
            Unable to fetch analytics telemetry. Please verify service boundary status.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => loadAnalytics(false)}
          >
            Retry Analytics
          </button>
        </div>
      )}

      {/* Empty Filtered State */}
      {!loading && !error && hasNoEmergencies && (
        <div className="analytics-empty-panel">
          <AlertTriangle size={32} style={{ color: 'var(--color-warning)' }} />
          <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
            No analytics data available for the selected filters.
          </h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
            Try selecting a different severity tier or reset all filters to restore full telemetry.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleResetFilters}
            style={{ marginTop: 'var(--space-2)' }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Loaded Dashboard Content */}
      {!loading && !error && data && (
        <>
          {/* =========================================================
              SECTION 4: EXECUTIVE KPI SUMMARY
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <TrendingUp size={20} style={{ color: 'var(--color-orange-500)' }} />
              <span>Executive Incident KPIs</span>
            </div>
            <div className="analytics-section-subtitle">
              High-level operational metrics across the Community Skill Bank network
            </div>

            <div className="analytics-kpi-grid">
              <KpiCard
                title="Total Emergencies"
                value={data.kpis.totalEmergencies}
                subtext="Recorded incidents"
                icon={<AlertTriangle size={18} />}
                accentColor="var(--color-critical)"
                trendText="Live Incidents"
                trendType={data.kpis.activeEmergencies > 0 ? 'warning' : 'positive'}
              />
              <KpiCard
                title="Active Emergencies"
                value={data.kpis.activeEmergencies}
                subtext="Under active mitigation"
                icon={<Flame size={18} />}
                accentColor="var(--color-orange-500)"
                trendText="Operational"
                trendType="warning"
              />
              <KpiCard
                title="Registered Volunteers"
                value={data.kpis.registeredVolunteers}
                subtext="Total roster strength"
                icon={<Users size={18} />}
                accentColor="var(--color-info)"
                trendText="+8.2% this period"
                trendType="positive"
              />
              <KpiCard
                title="Available for Surge"
                value={data.kpis.availableVolunteers}
                subtext="Immediately deployable"
                icon={<ShieldCheck size={18} />}
                accentColor="var(--color-success)"
                trendText="73% of roster"
                trendType="positive"
              />
              <KpiCard
                title="Completed Assignments"
                value={data.kpis.completedAssignments}
                subtext="Tasks fulfilled on-scene"
                icon={<CheckCircle2 size={18} />}
                accentColor="var(--color-success)"
                trendText="91.3% completion"
                trendType="positive"
              />
              <KpiCard
                title="Response Rate"
                value={data.kpis.responseRate}
                unit="%"
                subtext="Average dispatch pickup"
                icon={<Clock size={18} />}
                accentColor="var(--color-orange-500)"
                trendText="12.4m avg SLA"
                trendType="positive"
              />
              <KpiCard
                title="Community Participation"
                value={data.kpis.communityParticipation}
                unit="%"
                subtext="Workshop & drill attendance"
                icon={<Activity size={18} />}
                accentColor="var(--color-info)"
                trendText="156 total RSVPs"
                trendType="positive"
              />
              <KpiCard
                title="Verified Skills"
                value={data.kpis.verifiedSkills}
                subtext="Certifications cleared"
                icon={<Award size={18} />}
                accentColor="var(--color-warning)"
                trendText="Tier 2 & 3 audited"
                trendType="neutral"
              />
            </div>
          </div>

          {/* =========================================================
              SECTION 5: EMERGENCY ANALYTICS
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <AlertTriangle size={20} style={{ color: 'var(--color-critical)' }} />
              <span>Emergency Incident Statistics</span>
            </div>
            <div className="analytics-section-subtitle">
              Severity distribution, operational status, hazard types, and dispatch trends
            </div>

            <div className="analytics-grid-2">
              <DonutChart
                title="Emergencies by Severity"
                subtitle="Active & closed incidents classified by urgency tier"
                data={data.emergencies.bySeverity}
                centerLabel="EMERGENCIES"
                centerValue={data.kpis.totalEmergencies}
              />
              <DonutChart
                title="Emergencies by Status"
                subtitle="Lifecycle progression from open to resolved"
                data={data.emergencies.byStatus}
                centerLabel="STATUS"
              />
            </div>

            <div className="analytics-grid-2" style={{ marginTop: 'var(--space-5)' }}>
              <BarChart
                title="Incidents by Disaster Hazard Type"
                subtitle="Environmental hazard classification"
                data={data.emergencies.byDisasterType.map((d) => ({
                  label: d.type,
                  count: d.count,
                  percent: d.percent,
                  color: 'var(--color-orange-500)'
                }))}
              />
              <AreaTrendChart
                title={`Emergency Volume Trend (${filters.timePeriod})`}
                subtitle="Incident frequency trajectory across time"
                data={data.emergencies.trend}
                strokeColor="var(--color-critical)"
              />
            </div>
          </div>

          {/* =========================================================
              SECTION 6: VOLUNTEER ANALYTICS
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <Users size={20} style={{ color: 'var(--color-info)' }} />
              <span>Volunteer Force Statistics</span>
            </div>
            <div className="analytics-section-subtitle">
              Demographic distribution, deployment readiness, and recruitment trajectory
            </div>

            <div className="analytics-grid-3">
              <DonutChart
                title="Volunteer Role Distribution"
                subtitle="Specialized responders vs citizen volunteers"
                data={data.volunteers.byRole}
                centerLabel="ROSTER"
                centerValue={data.kpis.registeredVolunteers}
              />
              <DonutChart
                title="Operational Availability"
                subtitle="Surge deployable vs active on assignments"
                data={data.volunteers.byAvailability}
                centerLabel="STATUS"
              />
              <BarChart
                title="Verification & Vetting Status"
                subtitle="Background check & credential audit states"
                data={data.volunteers.verificationStatus.map((v) => ({
                  label: v.status,
                  count: v.count,
                  percent: v.percent,
                  color: 'var(--color-info)'
                }))}
              />
            </div>

            <div style={{ marginTop: 'var(--space-5)' }}>
              <AreaTrendChart
                title={`Active Roster Growth (${filters.timePeriod})`}
                subtitle="Cumulative volunteer onboarding and verification"
                data={data.volunteers.onboardingTrend}
                strokeColor="var(--color-info)"
              />
            </div>
          </div>

          {/* =========================================================
              SECTION 7: SKILL ANALYTICS
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <Award size={20} style={{ color: 'var(--color-warning)' }} />
              <span>Skill & Capability Analytics</span>
            </div>
            <div className="analytics-section-subtitle">
              Disaster skill categories, proficiency tiers, and surge demand fulfillment
            </div>

            <div className="analytics-grid-2">
              <BarChart
                title="Registered Skills by Category"
                subtitle="Primary emergency capability areas"
                data={data.skills.byCategory.map((s) => ({
                  label: s.category,
                  count: s.count,
                  color: s.color
                }))}
              />
              <DonutChart
                title="Proficiency Tier Breakdown"
                subtitle="Self-reported and verified skill competency levels"
                data={data.skills.byProficiency}
                centerLabel="SKILLS"
                centerValue={data.kpis.verifiedSkills}
              />
            </div>

            {/* High Demand Skills Fulfillment Table */}
            <div className="chart-card" style={{ marginTop: 'var(--space-5)', minHeight: 'auto' }}>
              <div className="chart-header">
                <div className="chart-title-group">
                  <h3>High-Demand Surge Capabilities</h3>
                  <p>Critical disaster skills comparing demand index against fulfillment capacity</p>
                </div>
              </div>
              <div className="chart-content">
                <table className="demand-table">
                  <thead>
                    <tr>
                      <th>Skill Capability</th>
                      <th style={{ width: '25%' }}>Demand Index</th>
                      <th style={{ width: '25%' }}>Fulfillment Capacity</th>
                      <th style={{ textAlign: 'right', width: '15%' }}>Readiness</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.skills.highDemandSkills.map((h, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {h.skill}
                        </td>
                        <td>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{ width: `${h.demand}%`, backgroundColor: 'var(--color-critical)' }}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="bar-track">
                            <div
                              className="bar-fill"
                              style={{ width: `${h.fulfillment}%`, backgroundColor: 'var(--color-success)' }}
                            />
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Badge variant={h.fulfillment >= h.demand ? 'success' : 'warning'}>
                            {h.fulfillment}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* =========================================================
              SECTION 8: RESPONSE ANALYTICS
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <Clock size={20} style={{ color: 'var(--color-orange-500)' }} />
              <span>Response Performance Analytics</span>
            </div>
            <div className="analytics-section-subtitle">
              Dispatch turnaround, assignment lifecycle completion, and response speed
            </div>

            <div className="analytics-grid-2">
              <DonutChart
                title="Assignment Lifecycle Distribution"
                subtitle="Operational volunteer dispatch progression"
                data={data.response.assignmentBreakdown}
                centerLabel="TASKS"
              />
              <AreaTrendChart
                title={`Average Response Time (Minutes, ${filters.timePeriod})`}
                subtitle="Dispatch notification to on-scene arrival time"
                data={data.response.trend}
                strokeColor="var(--color-orange-500)"
                valueSuffix=" min"
              />
            </div>
          </div>

          {/* =========================================================
              SECTIONS 9 & 10: COMMUNITY & TRAINING ANALYTICS
              ========================================================= */}
          <div className="analytics-grid-2">
            {/* Community Analytics */}
            <div>
              <div className="analytics-section-title">
                <Activity size={20} style={{ color: 'var(--color-info)' }} />
                <span>Community Activities</span>
              </div>
              <div className="analytics-section-subtitle">
                Community disaster drills, sandbagging events, and resilience workshops
              </div>

              <DonutChart
                title="Community Activity Status"
                subtitle="Scheduled vs completed preparedness events"
                data={data.community.byStatus}
                centerLabel="EVENTS"
              />

              <div style={{ marginTop: 'var(--space-4)' }}>
                <BarChart
                  title="Participation by Event Category"
                  subtitle="Community turnout and preparedness engagement"
                  data={data.community.byCategory.map((c) => ({
                    label: c.category,
                    count: c.count,
                    color: 'var(--color-info)'
                  }))}
                />
              </div>
            </div>

            {/* Training & Trust Analytics */}
            <div>
              <div className="analytics-section-title">
                <FileCheck2 size={20} style={{ color: 'var(--color-success)' }} />
                <span>Training & Credential Trust</span>
              </div>
              <div className="analytics-section-subtitle">
                Certification verification compliance and verified trust levels
              </div>

              <DonutChart
                title="Verification Review Status"
                subtitle="Audited certifications and field clearance"
                data={data.training.verificationStatus}
                centerLabel="AUDITS"
              />

              <div style={{ marginTop: 'var(--space-4)' }}>
                <BarChart
                  title="Trust Tier Distribution"
                  subtitle="Volunteer operational clearances"
                  data={data.training.trustTiers.map((t) => ({
                    label: t.tier,
                    count: t.count,
                    color: t.color
                  }))}
                />
              </div>
            </div>
          </div>

          {/* =========================================================
              SECTION 11: NOTIFICATION OPERATIONS ANALYTICS
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <Bell size={20} style={{ color: 'var(--color-orange-500)' }} />
              <span>Notification Operations</span>
            </div>
            <div className="analytics-section-subtitle">
              Emergency dispatch alerts, broadcast severities, and recipient read ratios
            </div>

            <div className="analytics-grid-3">
              <BarChart
                title="Volume by Alert Category"
                subtitle="Distribution across emergency dispatches & notices"
                data={data.notifications.byCategory.map((n) => ({
                  label: n.category,
                  count: n.count,
                  color: n.color
                }))}
              />
              <DonutChart
                title="Read vs Unread Ratio"
                subtitle="Notification engagement rate"
                data={[
                  { name: 'Read Alerts', count: data.notifications.readRatio.read, color: 'var(--color-success)' },
                  { name: 'Unread Alerts', count: data.notifications.readRatio.unread, color: 'var(--color-critical)' }
                ]}
                centerLabel="RATIO"
              />
              <DonutChart
                title="Alert Priority Breakdown"
                subtitle="Urgency tiers of broadcast notifications"
                data={data.notifications.byPriority}
                centerLabel="ALERTS"
              />
            </div>
          </div>

          {/* =========================================================
              SECTION 12: GEOGRAPHIC OPERATIONAL INFORMATION
              ========================================================= */}
          <div>
            <div className="analytics-section-title">
              <MapPin size={20} style={{ color: 'var(--color-orange-500)' }} />
              <span>Geographic Ward & Sector Telemetry</span>
            </div>
            <div className="analytics-section-subtitle">
              Spatial coverage, active incident epicenters, and responder deployment density
            </div>

            <GeographicSection
              wards={data.geographic.wards}
              title="Municipal Sector Dispatch Readiness"
              subtitle="Operational coverage, active incidents, and assigned volunteers by ward"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
