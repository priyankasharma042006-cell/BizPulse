import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Is BizPulse really free?',
    answer: 'Yes. BizPulse runs entirely on free tiers with zero hosting cost for the pilot. All AI models run in your browser, and the app works offline as a PWA.',
  },
  {
    question: 'Does it work without internet?',
    answer: 'Yes. BizPulse is a Progressive Web App that works offline. You can log sales, view forecasts, and get alerts without a connection. Data syncs when you are back online.',
  },
  {
    question: 'What languages are supported?',
    answer: 'English, Hindi, and Gujarati are supported at launch. The UI uses simple icons alongside text for low-literacy users. Numbers and dates format to your locale.',
  },
  {
    question: 'Do I need an accountant?',
    answer: 'No. BizPulse is designed for owners who use notebooks or WhatsApp. It records data, runs forecasts, and explains everything in plain language.',
  },
  {
    question: 'Is my data safe?',
    answer: 'Yes. We collect the minimum needed. Customer phone numbers stay in your data. No raw data is sent to the AI model — only aggregated summaries. You can export or delete everything at any time.',
  },
  {
    question: 'What kind of businesses is this for?',
    answer: 'Kirana stores, home-based food sellers, tailors, boutiques, and small manufacturers or workshops. Any micro or small business that wants data-driven decisions without complexity.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-b-4 border-black bg-background">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="mb-10 md:mb-16">
          <span className="font-bold uppercase text-sm tracking-widest text-primary-blue mb-4 block">
            FAQ
          </span>
          <h2 className="font-black uppercase text-3xl sm:text-4xl lg:text-6xl tracking-tighter leading-[0.9]">
            Questions Answered
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`border-2 md:border-4 border-black shadow-hard-4 transition-all duration-200 ease-out ${
                  isOpen ? 'bg-primary-red' : 'bg-white'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between p-4 md:p-6 text-left"
                  aria-expanded={isOpen}
                >
                  <span
                    className={`font-bold uppercase text-sm md:text-base tracking-wider pr-4 ${
                      isOpen ? 'text-white' : 'text-black'
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`h-6 w-6 flex-shrink-0 transition-transform duration-200 ease-out ${
                      isOpen ? 'rotate-180 text-white' : 'text-black'
                    }`}
                    strokeWidth={2.5}
                  />
                </button>
                {isOpen && (
                  <div className="bg-pale-yellow border-t-4 border-black p-4 md:p-6">
                    <p className="text-sm md:text-base font-medium leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
