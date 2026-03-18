import { useState } from 'react';
import CommentsSection from './CommentsSection';
import RepresentModal from './RepresentModal';

const FIELD_LABELS = {
  phone_1: 'Telefon 1',
  phone_2: 'Telefon 2',
  email: 'E-mail',
  website: 'Strona WWW',
  social_media: 'Social Media',
  operator_name: 'Operator',
  operator_type: 'Typ operatora',
  owner: 'Właściciel',
  nip: 'NIP',
  krs: 'KRS',
  license_status: 'Status licencji',
  veterinary_supervision: 'Nadzór weterynaryjny',
  municipality_cooperation: 'Współpraca z gminą',
  accepted_dogs: 'Przyjmuje psy',
  accepted_cats: 'Przyjmuje koty',
  accepted_other: 'Przyjmuje inne',
  public_access: 'Dostęp publiczny',
  public_access_notes: 'Uwagi o dostępie',
  volunteering: 'Wolontariat',
  transparency_level: 'Transparentność',
  last_verified: 'Ostatnia weryfikacja',
};

const HIDDEN_FIELDS = ['id', 'latitude', 'longitude', 'name', 'city', 'address'];

function formatValue(key, val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'boolean') return val ? '✅ Tak' : '❌ Nie';
  if (key === 'website') {
    const href = String(val);
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-[#FFFC0F] underline hover:text-yellow-300 break-all">
        {href}
      </a>
    );
  }
  if (key === 'email') {
    return (
      <a href={`mailto:${val}`} className="text-[#FFFC0F] underline hover:text-yellow-300">
        {val}
      </a>
    );
  }
  if (key === 'social_media') {
    const str = String(val);
    // Rozdzielamy linki po przecinkach lub spacjach i dajemy każdy w nowej linii (bez robienia z nich tagów <a>)
    const lines = str.split(/[,\s]+/).filter(Boolean);
    return (
      <div className="flex flex-col gap-1 break-all text-gray-300">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    );
  }
  return String(val);
}

// score is passed in from App.jsx (same object used for map marker color)
export default function ShelterInfo({ shelter, score }) {
  const [representOpen, setRepresentOpen] = useState(false);

  if (!shelter) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
        <h1 className="text-[#FFFC0F] text-3xl sm:text-4xl font-serif leading-tight">
          Wybierz<br />potrzebne<br />schronisko
        </h1>
        <p className="text-gray-400 text-sm">
          Kliknij na marker na mapie, aby zobaczyć szczegóły schroniska.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-2">
      {/* Title */}      <h2 className="text-[#FFFC0F] text-xl font-bold leading-tight mb-1">
        {shelter.name}
      </h2>      <p className="text-gray-400 text-xs mb-3">
        📍 {shelter.city} · {shelter.address}
      </p>

      {/* Trust score badge */}
      {score && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-gray-800/60 border border-gray-700">
          {/* Color dot */}
          <div
            className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold text-sm text-white"
            style={{ backgroundColor: score.color }}
          >
            {score.finalScore}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">Poziom zaufania:</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: score.color + '33', color: score.color }}
              >
                {score.trustLabel}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score.finalScore}%`, backgroundColor: score.color }}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Dane: {score.structuredScore}/100 · Opinie: {score.reviewScore}/100
              {score.reviewCount === 0 && ' · brak opinii'}
            </p>
          </div>
        </div>
      )}
      <button
        onClick={() => setRepresentOpen(true)}
        className="w-full mb-4 py-2 px-4 rounded-xl border border-yellow-400/50
                   text-[#FFFC0F] text-xs font-semibold uppercase tracking-wide
                   hover:bg-yellow-400 hover:text-black transition-all duration-200
                   flex items-center justify-center gap-2"
      >
        🏛️ Reprezentuję to schronisko
      </button>

      {/* Shelter fields */}
      <div className="space-y-2 mb-2">
        {Object.entries(shelter)
          .filter(([key]) => !HIDDEN_FIELDS.includes(key))
          .map(([key, val]) => {
            const formatted = formatValue(key, val);
            if (formatted === null) return null;
            return (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:gap-2 text-sm border-b border-gray-700/60 pb-1.5"
              >
                <span className="text-gray-500 min-w-35 shrink-0 text-xs uppercase tracking-wide">
                  {FIELD_LABELS[key] || key}
                </span>
                <span className="text-gray-200 wrap-break-word">{formatted}</span>
              </div>
            );
          })}
      </div>      {/* Comments + average rating */}
      <CommentsSection shelterId={shelter.id} />

      {/* Represent modal */}
      {representOpen && (
        <RepresentModal
          shelter={shelter}
          onClose={() => setRepresentOpen(false)}
        />
      )}
    </div>
  );
}
