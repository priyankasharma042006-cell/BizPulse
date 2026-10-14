import { LayoutDashboard, PlusSquare, Package, Sparkles, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { ReactNode } from 'react';

export type AppScreen = 'dashboard' | 'quick-log' | 'inventory' | 'insights' | 'chat';

interface AppShellProps {
  current: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  children: ReactNode;
}

const navItems: { key: AppScreen; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'quick-log', label: 'Log', icon: PlusSquare },
  { key: 'inventory', label: 'Stock', icon: Package },
  { key: 'insights', label: 'Digest', icon: Sparkles },
  { key: 'chat', label: 'Ask AI', icon: MessageCircle },
];

export function AppShell({ current, onNavigate, children }: AppShellProps) {
  const { business, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b-2 md:border-b-4 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mini geometric logo */}
            <div className="flex items-center gap-0.5">
              <div className="h-3 w-3 rounded-full bg-primary-red" />
              <div className="h-3 w-3 bg-primary-blue" />
              <div className="h-0 w-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent border-b-primary-yellow" />
            </div>
            <span className="font-black uppercase text-base md:text-lg tracking-tighter">
              BizPulse
            </span>
            {business && (
              <span className="hidden md:inline text-xs font-medium text-gray-500 ml-2">
                · {business.name}
              </span>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1 border-2 border-black px-2 md:px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-hard-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 md:ml-48" id={current}>
        {children}
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-black z-40 md:hidden">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = current === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 ${
                  isActive
                    ? item.key === 'quick-log'
                      ? 'bg-primary-red text-white'
                      : item.key === 'chat'
                        ? 'bg-primary-blue text-white'
                        : 'bg-primary-yellow'
                    : 'text-black'
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Side nav — desktop only */}
      <nav className="hidden md:flex fixed left-0 top-14 md:top-16 bottom-0 w-48 bg-white border-r-4 border-black flex-col z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-3 px-4 py-4 border-b-2 border-black/20 transition-all ${
                isActive ? 'bg-primary-yellow font-black' : 'font-bold hover:bg-gray-100'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-sm uppercase tracking-wider">{item.label}</span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}
