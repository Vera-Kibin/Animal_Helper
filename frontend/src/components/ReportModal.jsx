import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const PinIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });

const API_BASE = 'http://localhost:8000/api/v1';

// ─── static data ──────────────────────────────────────────────────────────────

const SHELTER_CATEGORIES = [
  { value: 'poor_conditions',        label: 'Złe warunki' },
  { value: 'lack_of_water_or_food',  label: 'Brak wody lub jedzenia' },
  { value: 'medical_neglect',        label: 'Zaniedbania medyczne' },
  { value: 'overcrowding',           label: 'Przepełnienie' },
  { value: 'violence_or_abuse',      label: 'Przemoc lub znęcanie' },
  { value: 'transparency_issue',     label: 'Problem z transparentnością' },
  { value: 'adoption_process_issue', label: 'Problem z adopcją' },
  { value: 'staff_behavior_issue',   label: 'Zachowanie personelu' },
  { value: 'other',                  label: 'Inne' },
];

const AREA_CATEGORIES = [
  { value: 'poison_risk',      label: 'Zagrożenie trucizną' },
  { value: 'injured_animal',   label: 'Ranne zwierzę' },
  { value: 'abandoned_animal', label: 'Porzucone zwierzę' },
  { value: 'dangerous_area',   label: 'Niebezpieczny teren' },
  { value: 'dead_animal',      label: 'Martwe zwierzę' },
  { value: 'other',            label: 'Inne' },
];

const SEVERITIES = [
  { value: 'low',      label: 'Niski',    color: 'text-green-400',  dot: 'bg-green-400' },
  { value: 'medium',   label: 'Średni',   color: 'text-[color:#FFFC0F]', dot: 'bg-yellow-400' },
  { value: 'high',     label: 'Wysoki',   color: 'text-orange-400', dot: 'bg-orange-400' },
  { value: 'critical', label: 'Krytyczny',color: 'text-red-500',    dot: 'bg-red-500' },
];

const TOTAL_STEPS = 5;

// ─── small helpers ─────────────────────────────────────────────────────────────

function StepDots({ current, total }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i < current ? 'w-4 bg-yellow-400' : i === current ? 'w-4 bg-yellow-400' : 'w-2 bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs uppercase tracking-wide text-gray-400 mb-1">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Input({ className = '', ...props }) {
  return (
    <input
      {...props}
      className={`w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200
                  focus:outline-none focus:border-yellow-400 placeholder-gray-600 transition-colors ${className}`}
    />
  );
}

function Textarea({ className = '', ...props }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200
                  focus:outline-none focus:border-yellow-400 placeholder-gray-600 transition-colors resize-none ${className}`}
    />
  );
}

// ─── map click picker ──────────────────────────────────────────────────────────

function MapClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

function LocationPicker({ lat, lng, onPick }) {
  const center = lat && lng ? [lat, lng] : [52.0693, 19.4803];
  return (
    <div className="rounded-xl overflow-hidden border border-gray-700" style={{ height: 220 }}>
      <MapContainer center={center} zoom={lat ? 12 : 6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onPick} />
        {lat && lng && <Marker position={[lat, lng]} icon={PinIcon} />}
      </MapContainer>
    </div>
  );
}

// ─── main modal ────────────────────────────────────────────────────────────────

const EMPTY = {
  report_scope: '',
  shelter_id: '',
  category: '',
  severity: '',
  title: '',
  description: '',
  incident_date: '',
  latitude: null,
  longitude: null,
  address: '',
};

export default function ReportModal({ onClose, shelters = [] }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  // close on Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const categories = form.report_scope === 'shelter' ? SHELTER_CATEGORIES : AREA_CATEGORIES;

  // ── validation per step ────────────────────────────────────────────────────
  const validateStep = useCallback(() => {
    const e = {};
    if (step === 0 && !form.report_scope) e.report_scope = 'Wybierz typ zgłoszenia';
    if (step === 1) {
      if (form.report_scope === 'shelter' && !form.shelter_id) e.shelter_id = 'Wybierz schronisko';
      if (form.report_scope === 'area' && (!form.latitude || !form.longitude)) e.location = 'Zaznacz miejsce na mapie';
    }
    if (step === 2 && !form.category) e.category = 'Wybierz kategorię';
    if (step === 3 && !form.severity) e.severity = 'Wybierz poziom ważności';
    if (step === 4) {
      if (!form.title.trim()) e.title = 'Pole wymagane';
      if (!form.description.trim()) e.description = 'Pole wymagane';
      if (!form.incident_date) e.incident_date = 'Pole wymagane';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [step, form]);

  const next = () => { if (validateStep()) setStep((s) => s + 1); };
  const back = () => { setErrors({}); setStep((s) => s - 1); };

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setServerError('');
    const payload = {
      report_scope:  form.report_scope,
      shelter_id:    form.report_scope === 'shelter' ? Number(form.shelter_id) : null,
      category:      form.category,
      severity:      form.severity,
      title:         form.title.trim(),
      description:   form.description.trim(),
      incident_date: form.incident_date,
      latitude:      form.report_scope === 'area' ? form.latitude  : null,
      longitude:     form.report_scope === 'area' ? form.longitude : null,
      address:       form.report_scope === 'area' ? (form.address.trim() || null) : null,
    };
    try {
      const res = await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || `HTTP ${res.status}`);
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <Backdrop onClose={onClose}>
        <ModalBox>
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="text-5xl">✅</span>
            <h2 className="text-[#FFFC0F] text-xl font-bold">Zgłoszenie wysłane!</h2>
            <p className="text-gray-400 text-sm">Dziękujemy. Twoje zgłoszenie zostało przyjęte do weryfikacji.</p>
            <button onClick={onClose} className="mt-2 px-6 py-2 bg-yellow-400 text-black rounded-lg font-semibold text-sm hover:bg-yellow-300 transition-colors">
              Zamknij
            </button>
          </div>
        </ModalBox>
      </Backdrop>
    );
  }

  return (
    <Backdrop onClose={onClose}>
      <ModalBox>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[#FFFC0F] font-bold text-lg">Dodaj zgłoszenie</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl leading-none">✕</button>
        </div>

        <StepDots current={step} total={TOTAL_STEPS} />

        {/* ── STEP 0: type ── */}
        {step === 0 && (
          <Step title="Typ zgłoszenia" subtitle="Co chcesz zgłosić?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ScopeCard
                selected={form.report_scope === 'shelter'}
                onClick={() => { set('report_scope', 'shelter'); set('category', ''); }}
                icon="🏠"
                title="Problem w schronisku"
                desc="Złe warunki, zaniedbania, przemoc w schronisku"
              />
              <ScopeCard
                selected={form.report_scope === 'area'}
                onClick={() => { set('report_scope', 'area'); set('category', ''); }}
                icon="📍"
                title="Zagrożenie w terenie"
                desc="Ranne zwierzę, trucizna, niebezpieczne miejsce"
              />
            </div>
            {errors.report_scope && <ErrMsg>{errors.report_scope}</ErrMsg>}
          </Step>
        )}

        {/* ── STEP 1: shelter or location ── */}
        {step === 1 && form.report_scope === 'shelter' && (
          <Step title="Wybierz schronisko" subtitle="Którego schroniska dotyczy zgłoszenie?">
            <FieldLabel required>Schronisko</FieldLabel>
            <select
              value={form.shelter_id}
              onChange={(e) => set('shelter_id', e.target.value)}
              className="w-full bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200
                         focus:outline-none focus:border-yellow-400 transition-colors"
            >
              <option value="">— wybierz schronisko —</option>
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
              ))}
            </select>
            {errors.shelter_id && <ErrMsg>{errors.shelter_id}</ErrMsg>}
          </Step>
        )}

        {step === 1 && form.report_scope === 'area' && (
          <Step title="Wybierz miejsce" subtitle="Kliknij na mapie lub wpisz adres">
            <div className="space-y-3">
              <div>
                <FieldLabel>Adres (opcjonalnie)</FieldLabel>
                <Input
                  placeholder="np. Sopot, ul. Lipowa 3"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Lokalizacja na mapie</FieldLabel>
                <LocationPicker
                  lat={form.latitude}
                  lng={form.longitude}
                  onPick={(lat, lng) => { set('latitude', lat); set('longitude', lng); }}
                />
                {form.latitude && (
                  <p className="text-xs text-gray-500 mt-1">
                    📌 {form.latitude.toFixed(5)}, {form.longitude.toFixed(5)}
                  </p>
                )}
              </div>
              {errors.location && <ErrMsg>{errors.location}</ErrMsg>}
            </div>
          </Step>
        )}

        {/* ── STEP 2: category ── */}
        {step === 2 && (
          <Step title="Kategoria" subtitle="Wybierz najlepiej pasującą kategorię">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => set('category', c.value)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all
                    ${form.category === c.value
                      ? 'border-yellow-400 bg-yellow-400/10 text-[#FFFC0F]'
                      : 'border-gray-700 text-gray-300 hover:border-gray-500'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {errors.category && <ErrMsg>{errors.category}</ErrMsg>}
          </Step>
        )}

        {/* ── STEP 3: severity ── */}
        {step === 3 && (
          <Step title="Poziom ważności" subtitle="Jak poważne jest to zgłoszenie?">
            <div className="grid grid-cols-2 gap-3">
              {SEVERITIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => set('severity', s.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all
                    ${form.severity === s.value
                      ? 'border-yellow-400 bg-yellow-400/10'
                      : 'border-gray-700 hover:border-gray-500'}`}
                >
                  <span className={`w-3 h-3 rounded-full shrink-0 ${s.dot}`} />
                  <span className={form.severity === s.value ? s.color : 'text-gray-300'}>{s.label}</span>
                </button>
              ))}
            </div>
            {errors.severity && <ErrMsg>{errors.severity}</ErrMsg>}
          </Step>
        )}

        {/* ── STEP 4: title + desc + date ── */}
        {step === 4 && (
          <Step title="Szczegóły zgłoszenia" subtitle="Opisz dokładnie sytuację">
            <div className="space-y-3">
              <div>
                <FieldLabel required>Tytuł</FieldLabel>
                <Input
                  placeholder="Krótki opis problemu"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  maxLength={120}
                />
                {errors.title && <ErrMsg>{errors.title}</ErrMsg>}
              </div>
              <div>
                <FieldLabel required>Opis</FieldLabel>
                <Textarea
                  rows={4}
                  placeholder="Opisz sytuację jak najdokładniej…"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
                {errors.description && <ErrMsg>{errors.description}</ErrMsg>}
              </div>
              <div>
                <FieldLabel required>Data zdarzenia</FieldLabel>
                <Input
                  type="date"
                  value={form.incident_date}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => set('incident_date', e.target.value)}
                />
                {errors.incident_date && <ErrMsg>{errors.incident_date}</ErrMsg>}
              </div>
            </div>
          </Step>
        )}

        {/* server error */}
        {serverError && <ErrMsg>⚠️ {serverError}</ErrMsg>}

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={back}
              className="flex-1 py-2 rounded-xl border border-gray-600 text-gray-300 text-sm
                         hover:border-gray-400 transition-colors"
            >
              ← Wstecz
            </button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <button
              onClick={next}
              className="flex-1 py-2 rounded-xl bg-yellow-400 text-black font-semibold text-sm
                         hover:bg-yellow-300 transition-colors"
            >
              Dalej →
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 py-2 rounded-xl bg-yellow-400 text-black font-semibold text-sm
                         hover:bg-yellow-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Wysyłanie…</>
              ) : '✓ Wyślij zgłoszenie'}
            </button>
          )}
        </div>
      </ModalBox>
    </Backdrop>
  );
}

// ─── layout helpers ────────────────────────────────────────────────────────────

function Backdrop({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-99999 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {children}
    </div>
  );
}

function ModalBox({ children }) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
      {children}
    </div>
  );
}

function Step({ title, subtitle, children }) {
  return (
    <div>
      <h3 className="text-white font-semibold text-base mb-0.5">{title}</h3>
      <p className="text-gray-500 text-xs mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function ScopeCard({ selected, onClick, icon, title, desc }) {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border transition-all
        ${selected
          ? 'border-yellow-400 bg-yellow-400/10'
          : 'border-gray-700 hover:border-gray-500'}`}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`font-semibold text-sm mb-1 ${selected ? 'text-[#FFFC0F]' : 'text-gray-200'}`}>{title}</div>
      <div className="text-gray-500 text-xs leading-relaxed">{desc}</div>
    </button>
  );
}

function ErrMsg({ children }) {
  return <p className="text-red-400 text-xs mt-1.5">{children}</p>;
}
