import { Circle, Square, Triangle } from 'lucide-react';

const footerLinks = [
  {
    title: 'Product',
    links: ['Cash-Flow Risk', 'Demand Forecast', 'Inventory', 'Dashboard'],
  },
  {
    title: 'Resources',
    links: ['Help Center', 'Onboarding', 'CSV Import', 'WhatsApp Share'],
  },
  {
    title: 'Company',
    links: ['About', 'SDG 8 Alignment', 'Privacy', 'Contact'],
  },
];

export function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo and description */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Circle className="h-6 w-6" fill="#D02020" stroke="#D02020" strokeWidth={1} />
              <Square className="h-6 w-6" fill="#1040C0" stroke="#1040C0" strokeWidth={1} />
              <Triangle className="h-6 w-6" fill="#F0C020" stroke="#F0C020" strokeWidth={1} />
              <span className="font-black uppercase text-xl tracking-tighter ml-1">
                BizPulse
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-gray-400 max-w-xs">
              AI co-pilot for small business survival and growth. Aligned with UN SDG 8.
            </p>
          </div>

          {/* Footer links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold uppercase text-sm tracking-widest text-primary-yellow mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t-2 border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            © 2026 BizPulse · Free Forever · Works Offline
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              English · Hindi · Gujarati
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
