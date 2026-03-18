import { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import ShelterMap from './components/ShelterMap';
import ShelterInfo from './components/ShelterInfo';
import ReportModal from './components/ReportModal';
import { useShelters } from './hooks/useShelters';
import { useAllComments } from './hooks/useAllComments';
import { calculateShelterScore } from './utils/shelterScore';

// ── Filter defaults ────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  trustLevel: 'all',       // all | high | medium | low
  acceptsDogs: false,
  acceptsCats: false,
  acceptsOther: false,
  volunteering: false,
  publicAccess: false,
};

const SORT_OPTIONS = [
  { value: 'score_desc', label: '⭐ Zaufanie: od najwyższego' },
  { value: 'score_asc',  label: '⭐ Zaufanie: od najniższego' },
  { value: 'name_asc',   label: '🔤 Nazwa: A → Z' },
  { value: 'name_desc',  label: '🔤 Nazwa: Z → A' },
];

const TRUST_COLORS = { high: '#22c55e', medium: '#eab308', low: '#ef4444' };
const TRUST_LABELS = { high: 'Wysoki', medium: 'Średni', low: 'Niski' };

// ── Filter drawer ──────────────────────────────────────────────────────────────
function FilterDrawer({ open, onClose, filters, setFilters, sortBy, setSortBy, totalVisible, totalAll }) {
  function toggle(key) { setFilters(f => ({ ...f, [key]: !f[key] })); }
  function reset() { setFilters(DEFAULT_FILTERS); setSortBy('score_desc'); }

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-9990"
          onClick={onClose}
        />
      )}
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-[#1a1a1a] shadow-2xl z-9995
                    border-l border-gray-700 flex flex-col transition-transform duration-300
                    ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <h2 className="text-white font-bold text-base">Filtruj i sortuj</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Results count */}
          <p className="text-gray-400 text-xs">
            Wyświetlono: <span className="text-white font-semibold">{totalVisible}</span> z {totalAll} schronisk
          </p>

          {/* Sort */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Sortowanie</p>
            <div className="space-y-1.5">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                    ${sortBy === opt.value
                      ? 'bg-yellow-400 text-black font-semibold'
                      : 'text-gray-300 hover:bg-gray-700'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust level */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Poziom zaufania</p>
            <div className="flex gap-2 flex-wrap">
              {['all', 'high', 'medium', 'low'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setFilters(f => ({ ...f, trustLevel: lvl }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                    ${filters.trustLevel === lvl
                      ? 'text-black'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  style={filters.trustLevel === lvl
                    ? { backgroundColor: lvl === 'all' ? '#eab308' : TRUST_COLORS[lvl] }
                    : {}}
                >
                  {lvl === 'all' ? 'Wszystkie' : TRUST_LABELS[lvl]}
                </button>
              ))}
            </div>
          </div>

          {/* Animal types */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Przyjmowane zwierzęta</p>
            <div className="space-y-2">
              {[
                { key: 'acceptsDogs',  label: '🐕 Przyjmuje psy' },
                { key: 'acceptsCats',  label: '🐈 Przyjmuje koty' },
                { key: 'acceptsOther', label: '🐾 Inne zwierzęta' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggle(key)}                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0
                      ${filters[key] ? 'bg-yellow-400 border-yellow-400' : 'border-gray-600 group-hover:border-gray-400'}`}
                  >
                    {filters[key] && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Extra filters */}
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-2">Dodatkowe</p>
            <div className="space-y-2">
              {[
                { key: 'volunteering', label: '🤝 Wolontariat' },
                { key: 'publicAccess', label: '🚪 Dostęp publiczny' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <div
                    onClick={() => toggle(key)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors shrink-0
                      ${filters[key] ? 'bg-yellow-400 border-yellow-400' : 'border-gray-600 group-hover:border-gray-400'}`}
                  >
                    {filters[key] && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-gray-300 text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700">
          <button
            onClick={reset}
            className="w-full py-2 text-sm text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 rounded-lg transition-colors"
          >
            Resetuj filtry
          </button>
        </div>
      </div>
    </>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {
  const { shelters, loading: sheltersLoading, error: sheltersError } = useShelters();
  const { commentsByShelter } = useAllComments();
  const [selectedShelter, setSelectedShelter] = useState(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState('score_desc');

  // Compute scores for every shelter once
  const scores = useMemo(() => {
    const map = {};
    shelters.forEach(s => {
      map[s.id] = calculateShelterScore(s, commentsByShelter[s.id] || []);
    });
    return map;
  }, [shelters, commentsByShelter]);

  // Apply filters + sort
  const visibleShelters = useMemo(() => {
    let list = shelters.filter(s => {
      const sc = scores[s.id];
      if (!sc) return true;

      if (filters.trustLevel !== 'all' && sc.trustLevel !== filters.trustLevel) return false;
      if (filters.acceptsDogs  && !s.accepted_dogs)  return false;
      if (filters.acceptsCats  && !s.accepted_cats)  return false;
      if (filters.acceptsOther && !s.accepted_other) return false;
      if (filters.volunteering && !s.volunteering)   return false;
      if (filters.publicAccess && (!s.public_access || s.public_access.toLowerCase() === 'none')) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      const sa = scores[a.id]?.finalScore ?? 50;
      const sb = scores[b.id]?.finalScore ?? 50;
      if (sortBy === 'score_desc') return sb - sa;
      if (sortBy === 'score_asc')  return sa - sb;
      if (sortBy === 'name_asc')   return a.name.localeCompare(b.name, 'pl');
      if (sortBy === 'name_desc')  return b.name.localeCompare(a.name, 'pl');
      return 0;
    });

    return list;
  }, [shelters, scores, filters, sortBy]);

  // Active filter count badge
  const activeFilters = useMemo(() => {
    let n = 0;
    if (filters.trustLevel !== 'all') n++;
    if (filters.acceptsDogs)  n++;
    if (filters.acceptsCats)  n++;
    if (filters.acceptsOther) n++;
    if (filters.volunteering) n++;
    if (filters.publicAccess) n++;
    return n;
  }, [filters]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-200">
      <Navbar onOpenReport={() => setReportModalOpen(true)} />

      <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 gap-4">
        {/* Error banner */}
        {sheltersError && (
          <div className="bg-red-900/80 text-red-200 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
            <span className="mt-0.5">⚠️</span>
            <span>
              {sheltersError} — sprawdź czy backend działa na{' '}
              <code className="bg-red-950 px-1 rounded">http://localhost:8000</code>.
            </span>
          </div>
        )}

        {/* Filter toolbar */}
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3">
          <p className="text-gray-500 text-xs">
            {visibleShelters.length} z {shelters.length} schronisk
          </p>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-gray-800
                       text-white text-sm font-medium rounded-xl border border-gray-700
                       hover:border-yellow-400 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 4h18M7 12h10M11 20h2" />
            </svg>
            Sortuj i filtruj
            {activeFilters > 0 && (
              <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* Main panel grid */}
        <div
          className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
          style={{ minHeight: '600px' }}
        >
          {/* Left: Shelter info */}
          <div className="bg-[#1a1a1a] rounded-2xl sm:rounded-3xl shadow-xl
                         flex flex-col overflow-hidden h-96 lg:h-auto order-2 lg:order-1">
            <div className="flex-1 min-h-0 overflow-y-auto shelter-scroll p-5 sm:p-6">
              <ShelterInfo
                shelter={selectedShelter}
                score={selectedShelter ? scores[selectedShelter.id] ?? null : null}
              />
            </div>
          </div>

          {/* Right: Map */}
          <div className="bg-[#1a1a1a] rounded-2xl sm:rounded-3xl shadow-xl
                         lg:col-span-2 h-96 sm:h-128 lg:h-auto order-1 lg:order-2 p-3 sm:p-4">
            <ShelterMap
              shelters={visibleShelters}
              selectedId={selectedShelter?.id ?? null}
              onSelect={setSelectedShelter}
              loading={sheltersLoading}
              scores={scores}
            />
          </div>
        </div>
      </main>

      <footer className="bg-[#1a1a1a] text-gray-500 text-xs text-center py-3 px-4">
        © {new Date().getFullYear()} AnimalHelper &mdash; dane z{' '}
        <a href="https://www.animalhelper.pl" target="_blank" rel="noopener noreferrer"
           className="text-yellow-500 hover:text-yellow-400 underline">
          animalhelper.pl
        </a>
      </footer>

      {/* Filter drawer */}
      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        totalVisible={visibleShelters.length}
        totalAll={shelters.length}
      />

      {/* Report modal */}
      {reportModalOpen && (
        <ReportModal shelters={shelters} onClose={() => setReportModalOpen(false)} />
      )}
    </div>
  );
}
