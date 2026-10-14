import { Check } from 'lucide-react';

const benefits = [
  'Warns of cash shortfalls at least 30 days ahead',
  'Cuts inventory waste with data-backed reorder advice',
  'Works offline and in local languages on a basic phone',
  'Runs entirely on free tiers — zero hosting cost',
  'No accountant or data team needed',
  'Lender-ready report helps owners access credit',
  'Health score explains every deduction in plain words',
  'AI advice is guidance, not a replacement for the owner',
];

export function Benefits() {
  return (
    <section className="bg-primary-red border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="mb-10 md:mb-16">
          <span className="font-bold uppercase text-sm tracking-widest text-primary-yellow mb-4 block">
            Benefits
          </span>
          <h2 className="font-black uppercase text-3xl sm:text-4xl lg:text-6xl tracking-tighter leading-[0.9] text-white max-w-3xl">
            Keep Your Business Alive And Growing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {benefits.map((benefit, i) => (
            <div
              key={i}
              className="flex items-center gap-4 bg-white border-2 md:border-4 border-black p-4 md:p-6 shadow-hard-4 md:shadow-hard-6 hover:-translate-y-1 transition-all duration-200 ease-out"
            >
              <div className="flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary-yellow border-2 border-black flex items-center justify-center shadow-hard-4">
                <Check className="h-5 w-5 md:h-6 md:w-6" strokeWidth={3} />
              </div>
              <p className="font-medium text-sm md:text-base leading-relaxed">
                {benefit}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
