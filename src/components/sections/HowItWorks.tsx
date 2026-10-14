const steps = [
  {
    number: '01',
    title: 'Log Sales & Expenses',
    description: 'Two-tap entry with big buttons. Works offline. Voice entry supported.',
    shape: 'circle' as const,
    color: '#D02020',
  },
  {
    number: '02',
    title: 'AI Analyzes Your Data',
    description: 'Forecasts, cash projections, and health score computed on your phone.',
    shape: 'square' as const,
    color: '#1040C0',
  },
  {
    number: '03',
    title: 'Get Alerts & Advice',
    description: 'Plain-language warnings 30 days ahead, with suggested actions.',
    shape: 'triangle' as const,
    color: '#F0C020',
  },
  {
    number: '04',
    title: 'Decide And Act',
    description: 'Reorder, adjust prices, plan payroll. The owner always decides.',
    shape: 'circle' as const,
    color: '#D02020',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b-4 border-black bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="mb-10 md:mb-16">
          <span className="font-bold uppercase text-sm tracking-widest text-primary-red mb-4 block">
            How It Works
          </span>
          <h2 className="font-black uppercase text-3xl sm:text-4xl lg:text-6xl tracking-tighter leading-[0.9] max-w-3xl">
            From Paper To Predictions
          </h2>
        </div>

        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-black z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-6 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                {/* Number in geometric shape */}
                <div className="relative mb-6">
                  {step.shape === 'circle' && (
                    <div
                      className="h-24 w-24 rounded-full border-4 border-black bg-white shadow-hard-6 flex items-center justify-center"
                      style={{ backgroundColor: step.color }}
                    >
                      <span className="font-black text-2xl tracking-tighter text-white -rotate-0">
                        {step.number}
                      </span>
                    </div>
                  )}
                  {step.shape === 'square' && (
                    <div
                      className="h-24 w-24 border-4 border-black shadow-hard-6 flex items-center justify-center rotate-45"
                      style={{ backgroundColor: step.color }}
                    >
                      <span className="font-black text-2xl tracking-tighter text-white -rotate-45">
                        {step.number}
                      </span>
                    </div>
                  )}
                  {step.shape === 'triangle' && (
                    <div className="relative h-24 w-24 flex items-center justify-center">
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: step.color,
                          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                          border: '4px solid #121212',
                        }}
                      />
                      <span className="relative font-black text-2xl tracking-tighter text-black mt-6">
                        {step.number}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="font-bold uppercase text-base md:text-lg tracking-tight mb-3 leading-tight">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base font-medium leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
