import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AlertTriangle, MapPin } from 'lucide-react';

/**
 * Leaflet Map for Disaster Scenario Impact Zone Visualization
 * STRICTLY ISOLATED: Used for hypothetical simulation geometry only.
 * Does NOT invoke real volunteer matching or real emergency operations.
 */
export const SimulationMap = ({
  coordinates = [34.0582, -118.2483],
  radiusKm = 15,
  scenarioName = 'Simulated Scenario',
  affectedArea = 'Municipal Sector',
  disasterType = 'Flood',
  height = '380px'
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('[SimulationMap] Error removing prior map instance:', err);
      }
      mapInstanceRef.current = null;
    }

    if (container._leaflet_id) {
      delete container._leaflet_id;
      container.innerHTML = '';
    }

    const lat = coordinates[0] || 34.055;
    const lng = coordinates[1] || -118.25;

    let map;
    try {
      map = L.map(container, {
        center: [lat, lng],
        zoom: 11,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      // Simulation Impact Zone Circle
      const radiusMeters = Math.max(1, radiusKm) * 1000;
      const impactCircle = L.circle([lat, lng], {
        color: '#F97316',
        weight: 2,
        fillColor: '#EA580C',
        fillOpacity: 0.2,
        dashArray: '6, 6',
        radius: radiusMeters
      }).addTo(map);

      // Epicenter Marker
      const centerMarker = L.circleMarker([lat, lng], {
        radius: 8,
        color: '#EF4444',
        fillColor: '#EF4444',
        fillOpacity: 0.9,
        weight: 2
      }).addTo(map);

      impactCircle.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px;">
          <div style="font-weight: 800; color: #dc2626; font-size: 11px; text-transform: uppercase; margin-bottom: 2px;">
            ⚠️ SIMULATED IMPACT ZONE
          </div>
          <strong style="display:block; font-size: 13px; margin-bottom: 4px;">${scenarioName}</strong>
          <div><strong>Disaster:</strong> ${disasterType}</div>
          <div><strong>Area:</strong> ${affectedArea}</div>
          <div><strong>Radius:</strong> ${radiusKm} km</div>
        </div>
      `);

      centerMarker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; color: #1e293b; padding: 4px;">
          <strong>Simulated Epicenter</strong><br/>
          ${affectedArea}
        </div>
      `);

      map.fitBounds(impactCircle.getBounds(), { padding: [20, 20] });
    } catch (err) {
      console.error('[SimulationMap] Leaflet initialization error:', err);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (_) {}
        mapInstanceRef.current = null;
      }
    };
  }, [coordinates, radiusKm, scenarioName, affectedArea, disasterType]);

  return (
    <div className="sim-map-wrapper" style={{ height }}>
      {/* Floating Simulation Watermark */}
      <div className="sim-map-badge">
        <AlertTriangle size={14} />
        <span>SIMULATED IMPACT ZONE — NOT A LIVE EMERGENCY</span>
      </div>

      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default SimulationMap;
