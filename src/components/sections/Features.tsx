import { TrendingDown, BarChart3, PackageCheck, LayoutDashboard } from 'lucide-react';
import { Card } from '../Card';
import type { ShapeColor } from '../GeoShape';

const features = [
  {
    id: 'C1',
    icon: TrendingDown,
    title: 'Cash-Flow Risk Detection',
    description: 'Projects balance 30/60/90 days out and flags dates it may go negative.',
    priority: 'P0',
    cornerShape: 'circle' as const,
    cornerColor: 'red' as ShapeColor,
    iconBg: 'bg-primary-red',
  },
  {
    id: 'C2',
    icon: BarChart3,
    title: 'Demand Forecasting',
    description: 'Weekly and monthly sales forecast per item and for the whole shop.',
    priority: 'P0',
    cornerShape: 'square' as const,
    cornerColor: 'blue' as ShapeColor,
    iconBg: 'bg-primary-blue',
  },
  {
    id: 'C3',
    icon: PackageCheck,
    title: 'Inventory Waste Reduction',
    description: 'Combines forecast, stock, and shelf life to cut over-ordering and expiry.',
    priority: 'P0',
    cornerShape: 'triangle' as const,
    cornerColor: 'yellow' as ShapeColor,
    iconBg: 'bg-primary-yellow',
  },
  {
    id: 'C4',
    icon: LayoutDashboard,
    title: 'Decision Dashboard',
    description: 'One screen with cash, sales, profit, stock alerts, and top 3 actions.',
    priority: 'P0',
    cornerShape: 'circle' as const,
    cornerColor: 'red' as ShapeColor,
    iconBg: 'bg-primary-red',
  },
];

export function Features() {
  return (
    <section id="features" className="border-b-4 border-black bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-24">
        <div className="mb-10 md:mb-16">
          <span className="font-bold uppercase text-sm tracking-widest text-primary-blue mb-4 block">
            Core Features
          </span>
          <h2 className="font-black uppercase text-3xl sm:text-4xl lg:text-6xl tracking-tighter leading-[0.9] max-w-3xl">
            Four Tools.<br />One Co-Pilot.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Card
                key={i}
                cornerShape={feature.cornerShape}
                cornerColor={feature.cornerColor}
                className={`p-6 md:p-8 ${i === 3 ? 'lg:col-start-2' : ''}`}
              >
                <div className={`h-12 w-12 md:h-14 md:w-14 ${feature.iconBg} border-2 border-black flex items-center justify-center shadow-hard-4 mb-5`}>
                  <Icon className="h-6 w-6 md:h-7 md:w-7 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold uppercase text-xs tracking-widest bg-background border-2 border-black px-2 py-0.5">
                    {feature.id}
                  </span>
                  <span className="font-bold uppercase text-xs tracking-widest text-primary-red border-2 border-primary-red px-2 py-0.5">
                    {feature.priority}
                  </span>
                </div>
                <h3 className="font-bold uppercase text-lg md:text-xl tracking-tight mb-3 leading-tight">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-base font-medium leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
