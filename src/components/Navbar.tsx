import { useState } from 'react';
import { Circle, Square, Triangle, Menu, X } from 'lucide-react';
import { Button } from './Button';

const navLinks = [
  { label: 'Problem', href: '#problem' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'FAQ', href: '#faq' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Geometric Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Circle className="h-6 w-6 md:h-8 md:w-8" fill="#D02020" stroke="#D02020" strokeWidth={1} />
              <Square className="h-6 w-6 md:h-8 md:w-8" fill="#1040C0" stroke="#1040C0" strokeWidth={1} />
              <Triangle className="h-6 w-6 md:h-8 md:w-8" fill="#F0C020" stroke="#F0C020" strokeWidth={1} />
            </div>
            <span className="font-black uppercase text-xl md:text-2xl tracking-tighter">
              BizPulse
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-bold uppercase text-sm tracking-wider hover:text-primary-red transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <Button variant="blue" shape="pill">
              Get Started
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden border-2 border-black p-2 shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t-2 border-black bg-white">
          <div className="flex flex-col px-4 py-4 gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="font-bold uppercase text-sm tracking-wider py-2 border-b-2 border-black/20"
              >
                {link.label}
              </a>
            ))}
            <Button variant="blue" shape="pill" className="mt-2" onClick={() => setIsOpen(false)}>
              Get Started
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
