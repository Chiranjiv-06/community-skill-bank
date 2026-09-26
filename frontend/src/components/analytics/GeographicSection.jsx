import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Shield, Users, AlertTriangle, Layers, Grid } from 'lucide-react';
import Badge from '../common/Badge';

/**
 * Aggregate Geographic Analytics Section (Stage 13)
 * Displays ward-level operational telemetry, responder density, and aggregate spatial mapping.
 * DOES NOT calculate geographic distances or run matching algorithms.
 */
export const GeographicSection = ({
  wards = [],
  title = 'Geographic Operational Coverage',
  subtitle = 'Municipal sector dispatch readiness, incident concentration, and responder presence'
}) => {
  const [activeView, setActiveView] = useState('grid'); // 'grid' | 'map'
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Initialize/update Leaflet map when map tab is visible
  useEffect(() => {
    if (activeView !== 'map') return;

    const container = mapContainerRef.current;
    if (!container) return;

    // Destroy prior instance
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('[GeographicSection] Error removing map:', err);
      }
      mapInstanceRef.current = null;
    }

    // StrictMode defensive cleanup
    if (container._leaflet_id) {
      delete container._leaflet_id;
      container.innerHTML = '';
    }

    try {
      // Center map around city center (LA lowlands center: 34.055, -118.25)
      const map = L.map(container, {
        center: [34.055, -118.25],
        zoom: 12,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      // Add OpenStreetMap dark/standard tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Render aggregate ward circles
      wards.forEach((ward) => {
        if (!ward.coordinates || ward.coordinates.length < 2) return;

        const colorMap = {
          critical: '#EF4444',
          high: '#EA580C',
          warning: '#F59E0B',
          normal: '#10B981'
        };
        const markerColor = colorMap[ward.status] || '#F97316';

        // Add circle marker for ward coverage area
        const circle = L.circle(ward.coordinates, {
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.25,
          radius: 1200 + ward.activeEmergencies * 300
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px;">
            <strong style="display:block; margin-bottom: 4px; font-size: 13px;">${ward.name}</strong>
            <div><strong>Active Incidents:</strong> ${ward.activeEmergencies}</div>
            <div><strong>Assigned Volunteers:</strong> ${ward.assignedVolunteers}</div>
            <div><strong>Coverage Rate:</strong> ${ward.coveragePercent}%</div>
          </div>
        `);
      });
    } catch (err) {
      console.error('[GeographicSection] Leaflet map init error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, [activeView, wards]);

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'warning':
        return 'warning';
      case 'normal':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="chart-card" style={{ minHeight: 'auto' }}>
      <div className="chart-header">
        <div className="chart-title-group">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>

        {/* View Switcher */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`analytics-period-btn ${activeView === 'grid' ? 'active' : ''}`}
            onClick={() => setActiveView('grid')}
            title="Sector Breakdown Grid"
          >
            <Grid size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Sector Cards
          </button>
          <button
            type="button"
            className={`analytics-period-btn ${activeView === 'map' ? 'active' : ''}`}
            onClick={() => setActiveView('map')}
            title="Spatial Tactical Overview"
          >
            <Layers size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Tactical Map
          </button>
        </div>
      </div>

      <div className="chart-content">
        {activeView === 'grid' ? (
          <div className="geo-wards-grid">
            {wards.map((ward) => (
              <div key={ward.id} className="geo-ward-card">
                <div className="geo-ward-header">
                  <h4 className="geo-ward-title">{ward.name}</h4>
                  <Badge variant={getStatusBadgeVariant(ward.status)}>
                    {ward.status.toUpperCase()}
                  </Badge>
                </div>

                <div className="geo-ward-stats">
                  <div className="geo-stat-col">
                    <span className="geo-stat-label">Active Incidents</span>
                    <span className="geo-stat-val" style={{ color: ward.activeEmergencies > 0 ? 'var(--color-critical)' : 'var(--text-muted)' }}>
                      {ward.activeEmergencies}
                    </span>
                  </div>
                  <div className="geo-stat-col">
                    <span className="geo-stat-label">Assigned Responders</span>
                    <span className="geo-stat-val" style={{ color: 'var(--color-orange-500)' }}>
                      {ward.assignedVolunteers}
                    </span>
                  </div>
                </div>

                <div className="geo-coverage-bar">
                  <div className="geo-coverage-label">
                    <span>Operational Coverage</span>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{ward.coveragePercent}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${ward.coveragePercent}%`,
                        backgroundColor: ward.coveragePercent > 90 ? 'var(--color-success)' : ward.coveragePercent > 80 ? 'var(--color-warning)' : 'var(--color-critical)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              height: '380px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-default)'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default GeographicSection;
