const problems = [
  {
    icon: '📉',
    title: 'Cash Shortfalls',
    description: 'Finding out the balance is low when the bank already says no.',
  },
  {
    icon: '📦',
    title: 'Overstocking',
    description: 'Stocking by gut feeling leads to waste or stock-outs.',
  },
  {
    icon: '🧾',
    title: 'No Records',
    description: 'Running on memory and paper means no track record for lenders.',
  },
  {
    icon: '🔍',
    title: 'Guesswork',
    description: 'Pricing and reordering without data means missed profit.',
  },
];

export function Problem() {
  return (
    <section id="problem" className="border-b-4 border-black bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="mb-10 md:mb-16">
          <span className="font-bold uppercase text-sm tracking-widest text-primary-red mb-4 block">
            The Problem
          </span>
          <h2 className="font-black uppercase text-3xl sm:text-4xl lg:text-6xl tracking-tighter leading-[0.9] max-w-3xl">
            Small Businesses Run On Memory And Paper
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {problems.map((problem, i) => (
            <div
              key={i}
              className="bg-white border-2 md:border-4 border-black shadow-hard-4 md:shadow-hard-8 p-6 md:p-8 flex items-start gap-6 hover:-translate-y-1 transition-all duration-200 ease-out"
            >
              <div className="flex-shrink-0 h-14 w-14 md:h-16 md:w-16 border-2 md:border-4 border-black flex items-center justify-center text-2xl md:text-3xl shadow-hard-4 bg-background">
                {problem.icon}
              </div>
              <div>
                <h3 className="font-bold uppercase text-lg md:text-xl tracking-tight mb-2">
                  {problem.title}
                </h3>
                <p className="text-sm md:text-base font-medium leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
