import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Info } from 'lucide-react';

/**
 * Reusable Leaflet + OpenStreetMap Emergency Location & Responder Map
 * Displays emergency epicenter, nearby responders, and distance tags.
 * Does NOT calculate geographic distances in React.
 */
export const EmergencyMap = ({
  emergency,
  nearbyVolunteers = [],
  height = '420px',
  zoom = 13
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const rawLat = Number(emergency?.latitude);
  const rawLng = Number(emergency?.longitude);
  const emergencyLat = !isNaN(rawLat) && rawLat !== 0 ? rawLat : 34.0582;
  const emergencyLng = !isNaN(rawLng) && rawLng !== 0 ? rawLng : -118.2483;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Destroy prior map instance if existing
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (err) {
        console.warn('[EmergencyMap] Error removing prior map instance:', err);
      }
      mapInstanceRef.current = null;
    }

    // Defensive cleanup for Leaflet container reuse in React StrictMode
    if (container._leaflet_id) {
      delete container._leaflet_id;
      container.innerHTML = '';
    }

    let map;
    try {
      // Initialize Leaflet Map centered on emergency
      map = L.map(container, {
        center: [emergencyLat, emergencyLng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: false
      });
      mapInstanceRef.current = map;
    } catch (err) {
      console.error('[EmergencyMap] Leaflet initialization error:', err);
      return;
    }

    // Add OpenStreetMap Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Custom Emergency Epicentre Icon
    const emergencyIcon = L.divIcon({
      className: 'emergency-map-pin',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          background: #EF4444;
          border: 3px solid #FFFFFF;
          border-radius: 50%;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.8), 0 4px 8px rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: bold;
          font-size: 16px;
        ">
          ⚡
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -20]
    });

    // Add Epicentre Marker & Popup
    const emergencyMarker = L.marker([emergencyLat, emergencyLng], { icon: emergencyIcon }).addTo(map);
    emergencyMarker.bindPopup(`
      <div style="font-family: sans-serif; color: #111; padding: 4px; min-width: 180px;">
        <strong style="color: #EA580C; font-size: 13px; display: block; margin-bottom: 2px;">
          INCIDENT EPICENTRE
        </strong>
        <strong style="display: block; font-size: 14px; margin-bottom: 4px;">
          ${emergency?.title || 'Emergency Incident'}
        </strong>
        <div style="font-size: 12px; color: #555; margin-bottom: 2px;">
          Sector: ${emergency?.location || 'Staging Area'}
        </div>
        <div style="font-size: 11px; color: #777;">
          Coordinates: ${emergencyLat.toFixed(4)}, ${emergencyLng.toFixed(4)}
        </div>
      </div>
    `);

    // Add Nearby Volunteer Markers
    const volunteerMarkers = [];
    nearbyVolunteers.forEach((vol) => {
      const volLat = vol.latitude || (emergencyLat + (Math.random() - 0.5) * 0.04);
      const volLng = vol.longitude || (emergencyLng + (Math.random() - 0.5) * 0.04);

      const volIcon = L.divIcon({
        className: 'volunteer-map-pin',
        html: `
          <div style="
            width: 30px;
            height: 30px;
            background: #3B82F6;
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.6), 0 2px 6px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFFFFF;
            font-size: 12px;
          ">
            👤
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([volLat, volLng], { icon: volIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: sans-serif; color: #111; padding: 4px; min-width: 170px;">
          <strong style="color: #3B82F6; font-size: 11px; display: block; text-transform: uppercase;">
            Nearby Responder
          </strong>
          <strong style="font-size: 13px; display: block; margin-bottom: 2px;">
            ${vol.name}
          </strong>
          <div style="font-size: 12px; color: #444; margin-bottom: 2px;">
            Skill: <strong>${vol.skill}</strong> (${vol.proficiency})
          </div>
          <div style="font-size: 12px; color: #EA580C; font-weight: 600;">
            Distance: ${vol.distance}
          </div>
          <div style="font-size: 11px; color: #10B981; font-weight: bold; margin-top: 2px;">
            ${vol.eligibility}
          </div>
        </div>
      `);
      volunteerMarkers.push(marker);
    });

    // Invalidate size after layout stabilization
    const timer1 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    const timer2 = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (err) {
          // ignore cleanup error
        }
        mapInstanceRef.current = null;
      }
      if (container) {
        delete container._leaflet_id;
        container.innerHTML = '';
      }
    };
  }, [emergencyLat, emergencyLng, zoom, nearbyVolunteers, emergency]);

  return (
    <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      {/* Map Element */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height,
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          zIndex: 1
        }}
      />

      {/* Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          zIndex: 1000,
          fontSize: 'var(--font-xs)',
          color: 'var(--text-primary)',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--color-critical)',
              boxShadow: '0 0 6px var(--color-critical)'
            }}
          />
          <span style={{ fontWeight: 600 }}>Emergency Epicentre</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: 'var(--color-info)',
              boxShadow: '0 0 6px var(--color-info)'
            }}
          />
          <span style={{ fontWeight: 600 }}>
            Nearby Responders ({nearbyVolunteers.length})
          </span>
        </div>
      </div>
    </div>
  );
};

export default EmergencyMap;
