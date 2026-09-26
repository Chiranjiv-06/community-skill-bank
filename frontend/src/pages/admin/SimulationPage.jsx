import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Plus,
  Play,
  Edit2,
  Trash2,
  AlertTriangle,
  MapPin,
  Clock,
  Layers,
  BarChart3,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Search,
  Filter,
  Flame,
  ShieldAlert,
  Sliders,
  RotateCcw
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { simulationService } from '../../services/simulationService';
import {
  SIMULATION_STATUSES,
  SIMULATION_DISASTER_TYPES
} from '../../data/devSimulations';
import ScenarioFormModal from '../../components/simulation/ScenarioFormModal';
import RequirementModal from '../../components/simulation/RequirementModal';
import RunSimulationModal from '../../components/simulation/RunSimulationModal';
import SimulationMap from '../../components/simulation/SimulationMap';
import SimulationResultsView from '../../components/simulation/SimulationResultsView';

/**
 * Stage 14 — Admin Disaster Simulation Page
 * Provides complete hypothetical scenario authoring, requirements configuration,
 * capacity calculation, skill gap analysis, and mobilization timeline progression.
 */
export const SimulationPage = () => {
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSimId, setSelectedSimId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'requirements' | 'results' | 'timeline'

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [scenarioToRun, setScenarioToRun] = useState(null);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load simulations
  const loadSimulations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await simulationService.getSimulations();
      setSimulations(data);
    } catch (err) {
      console.error('[SimulationPage] Error loading simulations:', err);
      setError('Simulation could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSimulations();
  }, [loadSimulations]);

  // Selected simulation object
  const activeScenario = simulations.find((s) => s.id === selectedSimId) || null;

  // Filtered simulations list
  const filteredSimulations = simulations.filter((s) => {
    const matchesSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.affectedArea.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === 'ALL' || s.disasterType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Scenario CRUD Handlers
  const handleOpenCreateScenario = () => {
    setEditingScenario(null);
    setIsScenarioModalOpen(true);
  };

  const handleOpenEditScenario = (scenario, e) => {
    if (e) e.stopPropagation();
    setEditingScenario(scenario);
    setIsScenarioModalOpen(true);
  };

  const handleSaveScenario = async (data) => {
    setIsSubmitting(true);
    try {
      if (editingScenario) {
        const updated = await simulationService.updateSimulation(editingScenario.id, data);
        setSimulations((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await simulationService.createSimulation(data);
        setSimulations((prev) => [created, ...prev]);
        setSelectedSimId(created.id);
        setActiveTab('requirements');
      }
      setIsScenarioModalOpen(false);
    } catch (err) {
      console.error('[SimulationPage] Save error:', err);
      alert(err.message || 'Failed to save scenario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteScenario = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this simulation scenario?')) return;

    try {
      await simulationService.deleteSimulation(id);
      setSimulations((prev) => prev.filter((s) => s.id !== id));
      if (selectedSimId === id) {
        setSelectedSimId(null);
      }
    } catch (err) {
      console.error('[SimulationPage] Delete error:', err);
      alert('Failed to delete scenario.');
    }
  };

  // Requirements Handlers
  const handleOpenAddRequirement = () => {
    setEditingRequirement(null);
    setIsRequirementModalOpen(true);
  };

  const handleOpenEditRequirement = (req) => {
    setEditingRequirement(req);
    setIsRequirementModalOpen(true);
  };

  const handleSaveRequirement = async (data) => {
    if (!activeScenario) return;
    setIsSubmitting(true);
    try {
      if (editingRequirement) {
        await simulationService.updateRequirement(activeScenario.id, editingRequirement.id, data);
      } else {
        await simulationService.addRequirement(activeScenario.id, data);
      }
      const refreshed = await simulationService.getSimulation(activeScenario.id);
      setSimulations((prev) => prev.map((s) => (s.id === refreshed.id ? refreshed : s)));
      setIsRequirementModalOpen(false);
    } catch (err) {
      console.error('[SimulationPage] Requirement error:', err);
      alert(err.message || 'Failed to save requirement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequirement = async (reqId) => {
    if (!activeScenario) return;
    if (!window.confirm('Remove this requirement from simulation?')) return;

    try {
      await simulationService.deleteRequirement(activeScenario.id, reqId);
      const refreshed = await simulationService.getSimulation(activeScenario.id);
      setSimulations((prev) => prev.map((s) => (s.id === refreshed.id ? refreshed : s)));
    } catch (err) {
      console.error('[SimulationPage] Delete requirement error:', err);
      alert('Failed to delete requirement.');
    }
  };

  // Execution Handlers
  const handlePromptRun = (scenario, e) => {
    if (e) e.stopPropagation();
    setScenarioToRun(scenario);
    setIsRunModalOpen(true);
  };

  const handleExecuteSimulation = async () => {
    if (!scenarioToRun) return;
    setIsRunningSim(true);

    try {
      const completed = await simulationService.runSimulation(scenarioToRun.id);
      setSimulations((prev) => prev.map((s) => (s.id === completed.id ? completed : s)));
      setIsRunModalOpen(false);
      setSelectedSimId(completed.id);
      setActiveTab('results');
    } catch (err) {
      console.error('[SimulationPage] Execution error:', err);
      alert(err.message || 'Simulation could not be completed.');
      await loadSimulations();
    } finally {
      setIsRunningSim(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case SIMULATION_STATUSES.COMPLETED:
        return 'success';
      case SIMULATION_STATUSES.READY:
        return 'warning';
      case SIMULATION_STATUSES.RUNNING:
        return 'warning';
      case SIMULATION_STATUSES.CONFIGURED:
        return 'default';
      case SIMULATION_STATUSES.FAILED:
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className="simulation-page">
      {/* Page Header */}
      <PageHeader
        title="Disaster Drill Simulation"
        subtitle="Model hypothetical mass disaster scenarios, calculate volunteer capacity bottlenecks, and analyze mobilization timelines."
        icon={<Cpu size={24} />}
        badge={
          <Badge variant="warning" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
            Incident Command Stress Test
          </Badge>
        }
        actions={
          selectedSimId ? (
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowLeft size={16} />}
              onClick={() => setSelectedSimId(null)}
            >
              All Scenarios
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={handleOpenCreateScenario}
            >
              Create Scenario
            </Button>
          )
        }
      />

      {/* Critical Isolation Disclaimer Banner */}
      <div className="sim-banner">
        <div className="sim-banner-content">
          <span className="sim-banner-badge">Strict Isolation</span>
          <span>
            <strong>PLANNING & ANALYSIS ENVIRONMENT:</strong> Simulations run strictly against synthetic development models. Running a simulation does not alert volunteers, dispatch real responders, or modify active emergencies.
          </span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="state-container" aria-live="polite">
          <div className="spinner" />
          <h3 className="state-title" style={{ marginTop: 'var(--space-4)' }}>
            Loading simulations...
          </h3>
          <p className="state-description">
            Retrieving hypothetical disaster scenario models and simulated capacity metrics.
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="state-container" role="alert">
          <div className="state-icon-wrapper" style={{ color: 'var(--color-critical)' }}>
            <AlertTriangle size={32} />
          </div>
          <h3 className="state-title">{error}</h3>
          <p className="state-description">
            Unable to connect to simulation development data store.
          </p>
          <Button variant="primary" size="sm" onClick={loadSimulations}>
            Retry Simulation Service
          </Button>
        </div>
      )}

      {/* =========================================================
          VIEW 1: SCENARIOS LIST VIEW
          ========================================================= */}
      {!loading && !error && !selectedSimId && (
        <>
          {/* Toolbar & Filter Bar */}
          <div className="sim-toolbar">
            <div className="sim-toolbar-search">
              <div style={{ position: 'relative', width: '100%' }}>
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search scenarios by title or affected sector..."
                  className="analytics-filter-select"
                  style={{ width: '100%', paddingLeft: '34px', minWidth: '240px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Disaster Type Filter */}
              <select
                className="analytics-filter-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="ALL">All Hazard Types</option>
                {SIMULATION_DISASTER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                className="analytics-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                {Object.values(SIMULATION_STATUSES).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {(searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  title="Reset Filters"
                >
                  <RotateCcw size={14} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={handleOpenCreateScenario}
            >
              New Scenario
            </Button>
          </div>

          {/* Empty State */}
          {filteredSimulations.length === 0 ? (
            <div className="analytics-empty-panel">
              <Cpu size={36} style={{ color: 'var(--text-muted)' }} />
              <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>
                No simulation scenarios available.
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
                {searchQuery || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No scenarios match the selected filters.'
                  : 'Create your first hypothetical disaster scenario to begin stress-testing volunteer capacity.'}
              </p>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={handleOpenCreateScenario}
                style={{ marginTop: 'var(--space-2)' }}
              >
                Create Scenario
              </Button>
            </div>
          ) : (
            <div className="sim-grid">
              {filteredSimulations.map((sim) => {
                const reqCount = Array.isArray(sim.requirements) ? sim.requirements.length : 0;
                const hasResults = Boolean(sim.results);

                return (
                  <div
                    key={sim.id}
                    className="sim-card"
                    onClick={() => {
                      setSelectedSimId(sim.id);
                      setActiveTab(hasResults ? 'results' : 'overview');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div className="sim-card-header">
                        <Badge variant="warning">{sim.disasterType}</Badge>
                        <Badge variant={getStatusBadgeVariant(sim.status)}>
                          {sim.status.toUpperCase()}
                        </Badge>
                      </div>

                      <h3 className="sim-card-title" style={{ marginTop: 'var(--space-3)' }}>
                        {sim.name}
                      </h3>

                      <div className="sim-card-area">
                        <MapPin size={13} style={{ color: 'var(--color-orange-500)', flexShrink: 0 }} />
                        <span>{sim.affectedArea}</span>
                      </div>

                      <div className="sim-param-chips">
                        <span className="sim-chip">
                          Radius: <strong>{sim.radius} km</strong>
                        </span>
                        <span className="sim-chip">
                          Duration: <strong>{sim.duration}h</strong>
                        </span>
                        <span className="sim-chip">
                          Multiplier: <strong>{sim.demandMultiplier}x</strong>
                        </span>
                        <span className="sim-chip">
                          Requirements: <strong>{reqCount}</strong>
                        </span>
                      </div>
                    </div>

                    <div>
                      {hasResults && (
                        <div
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 10px',
                            fontSize: '0.72rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-2)',
                            border: '1px solid var(--border-subtle)'
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Fulfillment Rate:</span>
                          <strong style={{ color: 'var(--color-success)' }}>
                            {sim.results.fulfillmentRate}% ({sim.results.fulfilledDemand}/{sim.results.totalDemand})
                          </strong>
                        </div>
                      )}

                      <div className="sim-card-footer">
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {sim.lastRun
                            ? `Last Run: ${new Date(sim.lastRun).toLocaleDateString()}`
                            : `Created: ${new Date(sim.createdAt).toLocaleDateString()}`}
                        </span>

                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => handlePromptRun(sim, e)}
                            title="Run Drill Simulation"
                          >
                            <Play size={13} />
                            <span>Run</span>
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => handleOpenEditScenario(sim, e)}
                            title="Edit Scenario"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={(e) => handleDeleteScenario(sim.id, e)}
                            title="Delete Scenario"
                          >
                            <Trash2 size={13} style={{ color: 'var(--color-critical)' }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* =========================================================
          VIEW 2: SCENARIO DETAIL & ANALYSIS VIEW
          ========================================================= */}
      {!loading && !error && activeScenario && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Detail Header */}
          <div className="sim-detail-header">
            <div className="sim-detail-top">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setSelectedSimId(null)}
                    style={{ padding: '2px 8px' }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <Badge variant="warning">{activeScenario.disasterType}</Badge>
                  <Badge variant={getStatusBadgeVariant(activeScenario.status)}>
                    {activeScenario.status.toUpperCase()}
                  </Badge>
                </div>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {activeScenario.name}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: '6px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={13} style={{ color: 'var(--color-orange-500)' }} />
                    {activeScenario.affectedArea}
                  </span>
                  <span>•</span>
                  <span>Radius: {activeScenario.radius} km</span>
                  <span>•</span>
                  <span>Duration: {activeScenario.duration}h</span>
                  <span>•</span>
                  <span>Multiplier: {activeScenario.demandMultiplier}x</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Play size={15} />}
                  onClick={() => handlePromptRun(activeScenario)}
                >
                  Run Simulation
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={15} />}
                  onClick={handleOpenAddRequirement}
                >
                  Add Requirement
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2 size={14} />}
                  onClick={() => handleOpenEditScenario(activeScenario)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDeleteScenario(activeScenario.id)}
                  style={{ color: 'var(--color-critical)' }}
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sim-tabs">
              <button
                type="button"
                className={`sim-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <MapPin size={15} /> Overview & Impact Zone
              </button>
              <button
                type="button"
                className={`sim-tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
                onClick={() => setActiveTab('requirements')}
              >
                <Layers size={15} /> Requirements ({activeScenario.requirements?.length || 0})
              </button>
              <button
                type="button"
                className={`sim-tab-btn ${activeTab === 'results' ? 'active' : ''}`}
                onClick={() => setActiveTab('results')}
              >
                <BarChart3 size={15} /> Simulation Results & Gaps
              </button>
              <button
                type="button"
                className={`sim-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                onClick={() => setActiveTab('timeline')}
              >
                <Clock size={15} /> Timeline Progression
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & MAP */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {activeScenario.notes && (
                <div className="chart-card" style={{ minHeight: 'auto' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>
                    Operational Context & Disaster Scenario Parameters
                  </h4>
                  <p style={{ margin: 0, fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {activeScenario.notes}
                  </p>
                </div>
              )}

              {/* Simulation Map */}
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <h3>Simulated Hazard Impact Zone</h3>
                    <p>Geographic footprint displaying {activeScenario.radius}km impact radius in {activeScenario.affectedArea}</p>
                  </div>
                </div>
                <div className="chart-content">
                  <SimulationMap
                    coordinates={activeScenario.coordinates || [34.055, -118.25]}
                    radiusKm={activeScenario.radius}
                    scenarioName={activeScenario.name}
                    affectedArea={activeScenario.affectedArea}
                    disasterType={activeScenario.disasterType}
                    height="420px"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REQUIREMENTS */}
          {activeTab === 'requirements' && (
            <div className="sim-table-card">
              <div className="chart-header" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="chart-title-group">
                  <h3>Configured Simulation Requirements</h3>
                  <p>Required disaster responder competencies subject to the {activeScenario.demandMultiplier}x demand multiplier</p>
                </div>
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={handleOpenAddRequirement}>
                  Add Requirement
                </Button>
              </div>

              {!activeScenario.requirements || activeScenario.requirements.length === 0 ? (
                <div className="analytics-empty-panel">
                  <Layers size={32} style={{ color: 'var(--text-muted)' }} />
                  <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>No Requirements Configured</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
                    Add skills and volunteer headcount quotas to model stress testing.
                  </p>
                  <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={handleOpenAddRequirement}>
                    Add First Requirement
                  </Button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="sim-table">
                    <thead>
                      <tr>
                        <th>Skill Capability</th>
                        <th>Category</th>
                        <th>Min Proficiency</th>
                        <th style={{ textAlign: 'center' }}>Base Quota</th>
                        <th style={{ textAlign: 'center' }}>Scaled Demand ({activeScenario.demandMultiplier}x)</th>
                        <th>Urgency</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeScenario.requirements.map((req) => {
                        const scaled = Math.round(Number(req.minVolunteers) * Number(activeScenario.demandMultiplier));
                        return (
                          <tr key={req.id}>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {req.skill}
                            </td>
                            <td>{req.category}</td>
                            <td>{req.minProficiency}</td>
                            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                              {req.minVolunteers}
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-critical)' }}>
                              {scaled}
                            </td>
                            <td>
                              <Badge variant={req.urgency === 'Critical' ? 'danger' : req.urgency === 'High' ? 'warning' : 'default'}>
                                {req.urgency}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: 'var(--space-1)' }}>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleOpenEditRequirement(req)}
                                  title="Edit Requirement"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => handleDeleteRequirement(req.id)}
                                  title="Remove Requirement"
                                >
                                  <Trash2 size={13} style={{ color: 'var(--color-critical)' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RESULTS & ANALYTICS */}
          {activeTab === 'results' && (
            <SimulationResultsView
              results={activeScenario.results}
              timeline={activeScenario.timeline}
              scenarioName={activeScenario.name}
              demandMultiplier={activeScenario.demandMultiplier}
              executedAt={activeScenario.results?.executedAt || activeScenario.lastRun}
            />
          )}

          {/* TAB 4: TIMELINE PROGRESSION */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {!activeScenario.timeline || activeScenario.timeline.length === 0 ? (
                <div className="analytics-empty-panel">
                  <Clock size={32} style={{ color: 'var(--text-muted)' }} />
                  <h4 style={{ color: 'var(--text-primary)', margin: 0 }}>Timeline Not Generated</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-xs)', margin: 0 }}>
                    Execute the simulation to plot operational surge trajectory across the {activeScenario.duration}h duration.
                  </p>
                  <Button variant="primary" size="sm" icon={<Play size={14} />} onClick={() => handlePromptRun(activeScenario)}>
                    Run Simulation
                  </Button>
                </div>
              ) : (
                <SimulationResultsView
                  results={activeScenario.results}
                  timeline={activeScenario.timeline}
                  scenarioName={activeScenario.name}
                  demandMultiplier={activeScenario.demandMultiplier}
                  executedAt={activeScenario.results?.executedAt || activeScenario.lastRun}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          MODALS
          ========================================================= */}
      {/* Create / Edit Scenario Modal */}
      <ScenarioFormModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onSubmit={handleSaveScenario}
        initialData={editingScenario}
        isSubmitting={isSubmitting}
      />

      {/* Add / Edit Requirement Modal */}
      <RequirementModal
        isOpen={isRequirementModalOpen}
        onClose={() => setIsRequirementModalOpen(false)}
        onSubmit={handleSaveRequirement}
        initialData={editingRequirement}
        isSubmitting={isSubmitting}
      />

      {/* Run Confirmation Modal */}
      <RunSimulationModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
        onConfirm={handleExecuteSimulation}
        scenario={scenarioToRun}
        isRunning={isRunningSim}
      />
    </div>
  );
};

export default SimulationPage;
