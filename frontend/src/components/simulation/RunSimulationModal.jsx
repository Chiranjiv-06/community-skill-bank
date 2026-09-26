import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { Play, AlertTriangle, Cpu, CheckCircle2 } from 'lucide-react';

/**
 * Confirmation Modal for Running Disaster Simulation
 * Displays operational parameters and clear simulation isolation notice.
 */
export const RunSimulationModal = ({
  isOpen,
  onClose,
  onConfirm,
  scenario,
  isRunning = false
}) => {
  if (!scenario) return null;

  const requirementsCount = Array.isArray(scenario.requirements) ? scenario.requirements.length : 0;
  const baseDemand = (scenario.requirements || []).reduce(
    (acc, curr) => acc + (Number(curr.minVolunteers) || 0),
    0
  );
  const scaledDemand = Math.round(baseDemand * (Number(scenario.demandMultiplier) || 1.0));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Execute Disaster Drill Simulation"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {/* Isolation Warning Banner */}
        <div className="sim-banner warning">
          <div className="sim-banner-content">
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
              <strong>PLANNING & ANALYSIS ONLY:</strong> This execution models hypothetical demand and capacity. It will <strong>NOT</strong> dispatch real volunteers, alert citizens, or modify live emergency records.
            </span>
          </div>
        </div>

        {/* Scenario Configuration Summary */}
        <div className="sim-modal-summary">
          <div className="sim-modal-row">
            <span className="sim-modal-label">Scenario Title:</span>
            <span className="sim-modal-val" style={{ color: 'var(--color-orange-400)' }}>
              {scenario.name}
            </span>
          </div>
          <div className="sim-modal-row">
            <span className="sim-modal-label">Disaster Hazard Type:</span>
            <Badge variant="warning">{scenario.disasterType}</Badge>
          </div>
          <div className="sim-modal-row">
            <span className="sim-modal-label">Simulated Affected Area:</span>
            <span className="sim-modal-val">{scenario.affectedArea}</span>
          </div>
          <div className="sim-modal-row">
            <span className="sim-modal-label">Impact Radius:</span>
            <span className="sim-modal-val">{scenario.radius} km</span>
          </div>
          <div className="sim-modal-row">
            <span className="sim-modal-label">Simulation Duration:</span>
            <span className="sim-modal-val">{scenario.duration} hours</span>
          </div>
          <div className="sim-modal-row">
            <span className="sim-modal-label">Demand Multiplier:</span>
            <span className="sim-modal-val">{scenario.demandMultiplier}x</span>
          </div>
          <div className="sim-modal-row">
            <span className="sim-modal-label">Configured Requirements:</span>
            <span className="sim-modal-val">
              {requirementsCount} skills ({scaledDemand} projected demand)
            </span>
          </div>
        </div>

        {requirementsCount === 0 && (
          <div style={{ color: 'var(--color-critical)', fontSize: 'var(--font-xs)', marginTop: 'var(--space-1)' }}>
            ⚠️ This scenario has no configured requirements. Please configure at least one requirement before running.
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isRunning}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            loading={isRunning}
            disabled={requirementsCount === 0 || isRunning}
            icon={<Play size={16} />}
          >
            {isRunning ? 'Running Simulation...' : 'Confirm & Run Simulation'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RunSimulationModal;
