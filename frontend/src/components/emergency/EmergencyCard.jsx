import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  Map,
  Users,
  Clock,
  ChevronRight,
  Layers,
  Edit3,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import EmergencyStatusBadge from './EmergencyStatusBadge';
import EmergencySeverityBadge from './EmergencySeverityBadge';

/**
 * Reusable Emergency Card Component
 * Formats emergency information with status, severity, requirements summary, and metadata.
 */
export const EmergencyCard = ({
  emergency,
  isAdmin = false,
  onEdit = null,
  onDelete = null,
  onStatusChange = null
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    const detailUrl = isAdmin
      ? `/admin/emergencies/${emergency.id}`
      : `/volunteer/emergencies/${emergency.id}`;
    navigate(detailUrl);
  };

  const handleViewMap = () => {
    const mapUrl = isAdmin
      ? `/admin/emergencies/${emergency.id}?tab=map`
      : `/volunteer/emergencies/${emergency.id}?tab=map`;
    navigate(mapUrl);
  };

  const formattedCreated = emergency.createdTime
    ? new Date(emergency.createdTime).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recently';

  const formattedUpdated = emergency.updatedTime
    ? new Date(emergency.updatedTime).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : formattedCreated;

  const reqCount = emergency.requirements?.length || 0;

  return (
    <Card
      hoverable
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'var(--space-5)',
        borderLeft: `4px solid ${
          emergency.severity === 'critical'
            ? 'var(--color-critical)'
            : emergency.severity === 'high'
            ? 'var(--color-primary)'
            : emergency.severity === 'medium'
            ? 'var(--color-info)'
            : 'var(--border-default)'
        }`
      }}
    >
      <div>
        {/* Top Badges & Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-3)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <EmergencySeverityBadge severity={emergency.severity} />
            <EmergencyStatusBadge status={emergency.status} />
          </div>

          <div
            style={{
              fontSize: 'var(--font-xs)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Clock size={12} />
            <span>Updated: {formattedUpdated}</span>
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-2)',
            lineHeight: 1.35,
            cursor: 'pointer'
          }}
          onClick={handleViewDetails}
        >
          {emergency.title}
        </h3>

        {/* Location & Sector */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: 'var(--font-sm)',
            color: 'var(--color-primary)',
            marginBottom: 'var(--space-3)',
            cursor: 'pointer'
          }}
          onClick={handleViewMap}
          title="Click to view tactical proximity map"
        >
          <MapPin size={15} style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 600 }}>{emergency.location}</span>
          {(emergency.latitude !== null && emergency.latitude !== undefined && emergency.longitude !== null && emergency.longitude !== undefined) && (
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-xs)', marginLeft: '4px' }}>
              ({Number(emergency.latitude).toFixed(3)}, {Number(emergency.longitude).toFixed(3)})
            </span>
          )}
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 'var(--font-sm)',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 'var(--space-4)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {emergency.description}
        </p>

        {/* Key Metrics / Quota */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-3)',
            padding: 'var(--space-3)',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: 'var(--space-4)',
            fontSize: 'var(--font-xs)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} color="var(--color-primary)" />
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Required Volunteers</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                {emergency.requiredVolunteers}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} color="var(--color-info)" />
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Skill Quotas</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                {reqCount} {reqCount === 1 ? 'Requirement' : 'Requirements'}
              </strong>
            </div>
          </div>
        </div>

        {/* Requirements Summary Preview */}
        {reqCount > 0 && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span
              style={{
                display: 'block',
                fontSize: 'var(--font-xs)',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: 'var(--space-2)'
              }}
            >
              Required Capabilities
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {emergency.requirements.slice(0, 3).map((req) => (
                <span
                  key={req.id}
                  style={{
                    fontSize: 'var(--font-xs)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {req.skill} ({req.minProficiency})
                </span>
              ))}
              {reqCount > 3 && (
                <span
                  style={{
                    fontSize: 'var(--font-xs)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(249, 115, 22, 0.1)',
                    color: 'var(--color-primary)',
                    fontWeight: 600
                  }}
                >
                  +{reqCount - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          gap: 'var(--space-2)',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          Created: {formattedCreated}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {isAdmin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(emergency)}
              icon={<Edit3 size={14} />}
            >
              Edit
            </Button>
          )}

          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(emergency)}
              icon={<Trash2 size={14} color="var(--color-critical)" />}
              style={{ color: 'var(--color-critical)' }}
            >
              Delete
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewMap}
            icon={<Map size={14} />}
          >
            Tactical Map
          </Button>

          <Button
            variant={isAdmin ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleViewDetails}
            icon={<ChevronRight size={14} />}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default EmergencyCard;
