import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// ── Classic map-pin marker (teardrop) colored by trust level ─────────────────
// Fixed 24×36 viewBox, anchor at bottom tip. Scale up when selected.
function makePinIcon(color = '#eab308', selected = false) {
  const scale = selected ? 1.35 : 1;
  const w = Math.round(24 * scale);
  const h = Math.round(36 * scale);

  // Pulsing ring shown only for selected marker
  const pulse = selected
    ? `<circle cx="12" cy="12" r="14" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.7">
         <animate attributeName="r"       values="12;20;12" dur="1.5s" repeatCount="indefinite"/>
         <animate attributeName="opacity" values="0.7;0;0.7" dur="1.5s" repeatCount="indefinite"/>
       </circle>`
    : '';

  // Standard teardrop: circle (cx=12,cy=12,r=11) + pointy tail down to (12,35)
  const sw = selected ? 2 : 1.8;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${w}" height="${h}">
    ${pulse}
    <path d="M12 2C7.03 2 3 6.03 3 11c0 7.25 9 23 9 23s9-15.75 9-23c0-4.97-4.03-9-9-9z"
          fill="${color}" stroke="white" stroke-width="${sw}" stroke-linejoin="round"/>
    <circle cx="12" cy="11" r="4" fill="white" opacity="0.85"/>
  </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize:   [w, h],
    iconAnchor: [w / 2, h],   // bottom tip
    popupAnchor:[0, -(h + 2)],
  });
}

// ── Fly to selected ────────────────────────────────────────────────────────────
function FlyToMarker({ position }) {
  const map = useMap();
  const prevPosition = useRef(null);
  useEffect(() => {
    if (position && JSON.stringify(position) !== JSON.stringify(prevPosition.current)) {
      map.flyTo(position, 12, { duration: 1 });
      prevPosition.current = position;
    }
  }, [position, map]);
  return null;
}

const MAP_CENTER = [52.0693, 19.4803];
const ZOOM = 6;

// scores: { [shelterId]: { color, finalScore, ... } }
export default function ShelterMap({ shelters, selectedId, onSelect, loading, scores = {} }) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-1000 rounded-2xl">
          <div className="flex flex-col items-center gap-3 text-white">
            <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Ładowanie schronisk…</span>
          </div>
        </div>
      )}
      <MapContainer center={MAP_CENTER} zoom={ZOOM} scrollWheelZoom className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shelters.map((shelter) => {
          const isSelected = shelter.id === selectedId;
          const color = scores[shelter.id]?.color ?? '#eab308';
          return (
            <Marker
              key={shelter.id}
              position={[shelter.latitude, shelter.longitude]}
              icon={makePinIcon(color, isSelected)}
              eventHandlers={{ click: () => onSelect(shelter) }}
              title={shelter.name}
            />
          );
        })}

        {selectedId && (() => {
          const s = shelters.find((x) => x.id === selectedId);
          return s ? <FlyToMarker position={[s.latitude, s.longitude]} /> : null;
        })()}
      </MapContainer>
    </div>
  );
}
