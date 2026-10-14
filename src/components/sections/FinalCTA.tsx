import { ArrowRight, Circle, Square } from 'lucide-react';
import { Button } from '../Button';

export function FinalCTA() {
  return (
    <section className="bg-primary-yellow border-b-4 border-black relative overflow-hidden">
      {/* Decorative shapes */}
      <Circle
        className="absolute h-48 w-48 md:h-72 md:w-72 -top-12 -left-12 opacity-50"
        fill="#D02020"
        stroke="#121212"
        strokeWidth={4}
      />
      <Square
        className="absolute h-40 w-40 md:h-56 md:w-56 -bottom-12 -right-12 opacity-50 rotate-12"
        fill="#1040C0"
        stroke="#121212"
        strokeWidth={4}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-32 text-center">
        <h2 className="font-black uppercase text-4xl sm:text-6xl lg:text-8xl tracking-tighter leading-[0.9] mb-6">
          No Business Should Close Because It Didn't See What Was Coming
        </h2>

        <p className="text-base md:text-xl font-medium leading-relaxed max-w-2xl mx-auto mb-10">
          Start using BizPulse today. Free forever. Works on any phone. No accountant needed.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="red" shape="square" className="px-8 py-4 text-base md:text-lg">
            Start Free Now
            <ArrowRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" shape="square" className="px-8 py-4 text-base md:text-lg">
            Talk To Us
          </Button>
        </div>
      </div>
    </section>
  );
}
