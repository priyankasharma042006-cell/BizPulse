import { Circle, Square } from 'lucide-react';

const stats = [
  { value: '50', label: 'Pilot Businesses', shape: 'circle' as const },
  { value: '30', label: 'Days Ahead Cash Warning', shape: 'square' as const },
  { value: '25%', label: 'Forecast Accuracy (MAPE)', shape: 'circle' as const },
  { value: '10s', label: 'Median Time To Log Sale', shape: 'square' as const },
];

export function Stats() {
  return (
    <section className="bg-primary-yellow border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y-2 sm:divide-y-0 sm:divide-x-2 lg:divide-x-2 divide-black">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center text-center py-8 sm:py-10 px-4"
            >
              <div className="relative mb-4">
                {stat.shape === 'circle' ? (
                  <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-white border-2 md:border-4 border-black flex items-center justify-center shadow-hard-4">
                    <span className="font-black text-2xl md:text-3xl tracking-tighter">
                      {stat.value}
                    </span>
                  </div>
                ) : (
                  <div className="h-20 w-20 md:h-24 md:w-24 bg-white border-2 md:border-4 border-black flex items-center justify-center shadow-hard-4 rotate-45">
                    <span className="font-black text-2xl md:text-3xl tracking-tighter -rotate-45">
                      {stat.value}
                    </span>
                  </div>
                )}
              </div>
              <span className="font-bold uppercase text-xs md:text-sm tracking-widest max-w-[120px]">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
