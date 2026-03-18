import { useState } from 'react';

const navLinks = [
    { label: 'Strona główna', href: 'https://www.animalhelper.pl/' },
    { label: 'Mapa schronisk', href: '/'},
    { label: 'O nas', href: 'https://www.animalhelper.pl/o-nas/' },
    { label: 'Wspieraj pieski', href: 'https://www.animalhelper.pl/wspomoz-nas/' },
];

export default function Navbar({ onOpenReport }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="bg-[#1a1a1a] text-white shadow-lg sticky top-0 z-9999">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <a href="#" className="flex items-center gap-3 shrink-0">
                        <img src="public/vite.svg" alt="AnimalHelper" width={40} height={40} style={{ borderRadius: 20 }} />
                        <span className="text-[#FFFC0F] font-bold text-lg tracking-wide hidden sm:block">
                            AnimalHelper
                        </span>
                    </a>          {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="text-sm font-medium text-gray-300 hover:text-[#FFFC0F] transition-colors duration-200"
                            >
                                {link.label}
                            </a>
                        ))}
                        <button
                            onClick={onOpenReport}
                            className="ml-2 px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-sm font-semibold rounded-lg transition-colors duration-200 whitespace-nowrap"
                        >
                            + Dodaj zgłoszenie
                        </button>
                    </nav>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 rounded-md text-gray-300 hover:text-[#FFFC0F] focus:outline-none"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-label="Toggle menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}      {menuOpen && (
                <div className="md:hidden bg-[#111] border-t border-gray-700 px-4 pb-4 pt-2">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="block py-2 text-sm font-medium text-[#FFFC0F] transition-colors"
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.label}
                        </a>
                    ))}
                    <button
                        onClick={() => { setMenuOpen(false); onOpenReport(); }}
                        className="mt-3 w-full px-4 py-2 bg-[#FFFC0F] text-black text-sm font-semibold rounded-lg transition-colors duration-200"
                    >
                        + Dodaj zgłoszenie
                    </button>
                </div>
            )}
        </header>
    );
}
