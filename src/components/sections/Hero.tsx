import { ArrowRight, Circle, Square, Triangle } from 'lucide-react';
import { Button } from '../Button';

export function Hero() {
  return (
    <section className="border-b-4 border-black">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 min-h-[500px] md:min-h-[600px]">
        {/* Left: Content */}
        <div className="flex flex-col justify-center px-4 md:px-8 py-12 md:py-24 border-b-2 md:border-b-0 md:border-r-4 border-black">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="border-2 border-black px-3 py-1 bg-primary-yellow shadow-hard-4">
              <span className="font-bold uppercase text-xs tracking-widest">
                SDG 8 Aligned
              </span>
            </div>
          </div>

          <h1 className="font-black uppercase text-4xl sm:text-6xl lg:text-8xl tracking-tighter leading-[0.9] mb-6">
            Your AI<br />
            <span className="text-primary-red">Co-Pilot</span><br />
            For Business
          </h1>

          <p className="text-base md:text-lg font-medium leading-relaxed max-w-md mb-8">
            BizPulse gives micro and small businesses an AI partner for cash flow,
            demand, inventory, and growth decisions. No accountant needed.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="red" shape="square" className="px-8 py-4 text-base">
              Start Free
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" shape="square" className="px-8 py-4 text-base">
              See How It Works
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <span className="font-bold uppercase text-xs tracking-widest text-gray-600">
              Free Forever · Works Offline · Multilingual
            </span>
          </div>
        </div>

        {/* Right: Blue geometric panel */}
        <div className="relative bg-primary-blue border-t-2 md:border-t-0 border-black overflow-hidden min-h-[300px] flex items-center justify-center">
          {/* Overlapping geometric composition */}
          {/* Large circle */}
          <Circle
            className="absolute h-48 w-48 md:h-72 md:w-72 top-8 left-8 md:top-12 md:left-12 opacity-90"
            fill="none"
            stroke="#F0C020"
            strokeWidth={6}
          />
          {/* Rotated square (diamond) */}
          <div className="absolute h-32 w-32 md:h-48 md:w-48 bg-primary-red border-4 border-black rotate-45 bottom-8 right-8 md:bottom-16 md:right-16 shadow-hard-8" />
          {/* Centered square with triangle */}
          <div className="absolute h-28 w-28 md:h-40 md:w-40 bg-white border-4 border-black flex items-center justify-center shadow-hard-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <Triangle className="h-16 w-16 md:h-24 md:w-24" fill="#F0C020" stroke="#121212" strokeWidth={3} />
          </div>
          {/* Small circle bottom-left */}
          <Circle
            className="absolute h-12 w-12 md:h-16 md:w-16 bottom-4 left-4 md:bottom-8 md:left-8"
            fill="#F0C020"
            stroke="#121212"
            strokeWidth={3}
          />
          {/* Small square top-right */}
          <Square
            className="absolute h-10 w-10 md:h-14 md:w-14 top-4 right-4 md:top-8 md:right-8 rotate-12"
            fill="#D02020"
            stroke="#121212"
            strokeWidth={3}
          />
        </div>
      </div>
    </section>
  );
}
