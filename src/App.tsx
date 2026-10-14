import { lazy, Suspense, useEffect, useState, type FormEvent } from 'react';
import { Circle, Square, Triangle } from 'lucide-react';
import { useAuth, AuthProvider } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { AppShell, type AppScreen } from '@/components/AppShell';
import { Spinner, ErrorState } from '@/components/ScreenState';
import { Button } from '@/components/Button';

// Each screen is its own chunk, downloaded only when first opened.
const AuthScreen = lazy(() => import('@/screens/AuthScreen').then((m) => ({ default: m.AuthScreen })));
const Dashboard = lazy(() => import('@/screens/Dashboard').then((m) => ({ default: m.Dashboard })));
const QuickLog = lazy(() => import('@/screens/QuickLog').then((m) => ({ default: m.QuickLog })));
const Inventory = lazy(() => import('@/screens/Inventory').then((m) => ({ default: m.Inventory })));
const Insights = lazy(() => import('@/screens/Insights').then((m) => ({ default: m.Insights })));
const AIChat = lazy(() => import('@/screens/AIChat').then((m) => ({ default: m.AIChat })));

function FullPageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Circle className="h-8 w-8 animate-pulse" fill="#D02020" stroke="#D02020" strokeWidth={1} />
          <Square className="h-8 w-8 animate-pulse" fill="#1040C0" stroke="#1040C0" strokeWidth={1} style={{ animationDelay: '150ms' }} />
          <Triangle className="h-8 w-8 animate-pulse" fill="#F0C020" stroke="#F0C020" strokeWidth={1} style={{ animationDelay: '300ms' }} />
        </div>
        <span className="font-black uppercase text-xl tracking-tighter">BizPulse</span>
      </div>
    </div>
  );
}

/** Shown when a user is signed in but has no business row (e.g. the signup insert failed). */
function BusinessSetup() {
  const { refreshBusiness, signOut, businessError } = useAuth();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { error: insertError } = await supabase.from('businesses').insert({
      name: name || 'My Business',
      type: 'grocery',
      opening_balance: parseFloat(balance) || 0,
      lang: 'en',
    });
    if (insertError) setError(insertError.message);
    else await refreshBusiness();
    setSaving(false);
  }

  if (businessError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>
          <ErrorState message={businessError} onRetry={refreshBusiness} />
          <div className="text-center"><button onClick={signOut} className="text-xs font-bold uppercase underline">Sign out</button></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white border-2 md:border-4 border-black shadow-hard-8 p-6 space-y-4">
        <h1 className="font-black uppercase text-2xl tracking-tighter">Set up your business</h1>
        {error && <div className="bg-primary-red/10 border-2 border-primary-red p-3 text-sm font-medium text-primary-red">{error}</div>}
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Business name"
          className="w-full border-2 border-black p-3 bg-white text-base" />
        <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="Opening balance (₹)"
          className="w-full border-2 border-black p-3 bg-white text-base" />
        <Button type="submit" variant="red" shape="square" disabled={saving} className="w-full">{saving ? 'Saving…' : 'Continue'}</Button>
        <div className="text-center"><button type="button" onClick={signOut} className="text-xs font-bold uppercase underline">Sign out</button></div>
      </form>
    </div>
  );
}

function AppContent() {
  const { user, business, loading } = useAuth();
  const [screen, setScreen] = useState<AppScreen>('dashboard');

  useEffect(() => {
    if (user && business) setScreen('dashboard');
  }, [user?.uid, business?.id]);

  if (loading) return <FullPageLoader />;

  if (!user) {
    return (
      <Suspense fallback={<FullPageLoader />}>
        <AuthScreen />
      </Suspense>
    );
  }

  if (!business) return <BusinessSetup />;

  return (
    <AppShell current={screen} onNavigate={setScreen}>
      <Suspense fallback={<Spinner tall />}>
        {screen === 'dashboard' && <Dashboard onNavigate={setScreen} />}
        {screen === 'quick-log' && <QuickLog />}
        {screen === 'inventory' && <Inventory />}
        {screen === 'insights' && <Insights />}
        {screen === 'chat' && <AIChat />}
      </Suspense>
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
