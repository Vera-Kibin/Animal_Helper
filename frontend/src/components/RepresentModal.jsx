import { useState, useEffect } from 'react';

const INITIAL = {
  representative_name: '',
  official_email: '',
  phone: '',
  nip: '',
  krs: '',
};

function validate(fields) {
  const errors = {};
  if (!fields.representative_name.trim()) {
    errors.representative_name = 'Imię i nazwisko jest wymagane.';
  }
  if (!fields.official_email.trim()) {
    errors.official_email = 'Adres e-mail jest wymagany.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.official_email)) {
    errors.official_email = 'Podaj poprawny adres e-mail.';
  }
  return errors;
}

export default function RepresentModal({ shelter, onClose }) {
  const [fields, setFields] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFields((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate(fields);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStatus('loading');
    // Fake async submit — no real API call
    setTimeout(() => setStatus('success'), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-10000 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-[#1a1a1a] rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-gray-700">
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">
              Reprezentuję to schronisko
            </h2>
            <p className="text-gray-400 text-xs mt-0.5 truncate max-w-xs">
              {shelter.name} · {shelter.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors ml-4 mt-0.5 text-xl leading-none"
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {status === 'success' ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">
                ✅
              </div>
              <p className="text-white font-semibold text-base">
                Wniosek został wysłany.
              </p>
              <p className="text-gray-400 text-sm">
                Czekaj na email weryfikacyjny.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* representative_name */}
              <Field
                label="Imię i nazwisko *"
                name="representative_name"
                type="text"
                placeholder="Jan Kowalski"
                value={fields.representative_name}
                onChange={handleChange}
                error={errors.representative_name}
              />

              {/* official_email */}
              <Field
                label="Służbowy e-mail *"
                name="official_email"
                type="email"
                placeholder="kontakt@schronisko.pl"
                value={fields.official_email}
                onChange={handleChange}
                error={errors.official_email}
              />

              {/* phone */}
              <Field
                label="Telefon"
                name="phone"
                type="tel"
                placeholder="+48 123 456 789"
                value={fields.phone}
                onChange={handleChange}
              />

              {/* nip + krs side-by-side */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="NIP"
                  name="nip"
                  type="text"
                  placeholder="000-000-00-00"
                  value={fields.nip}
                  onChange={handleChange}
                />
                <Field
                  label="KRS"
                  name="krs"
                  type="text"
                  placeholder="0000000000"
                  value={fields.krs}
                  onChange={handleChange}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-60
                           text-black text-sm font-bold rounded-lg transition-colors
                           flex items-center justify-center gap-2 mt-1"
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Wysyłanie…
                  </>
                ) : (
                  'Wyślij wniosek'
                )}
              </button>

              <p className="text-gray-600 text-xs text-center">
                Pola oznaczone * są wymagane. Po weryfikacji skontaktujemy się z Tobą e-mailem.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small reusable field ── */
function Field({ label, name, type, placeholder, value, onChange, error }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
        {label}
      </label>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`bg-[#111] border rounded-lg px-3 py-2 text-sm text-white
                    placeholder-gray-600 outline-none transition-colors
                    focus:border-yellow-400
                    ${error ? 'border-red-500' : 'border-gray-700'}`}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
