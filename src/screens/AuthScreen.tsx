import { useState, type FormEvent } from 'react';
import { Circle, Square, Triangle, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/Button';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('grocery');
  const [openingBalance, setOpeningBalance] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signup') {
      const { error: signUpError } = await signUp(email, password, {
        name: businessName.trim(),
        type: businessType,
        openingBalance: parseFloat(openingBalance) || 0,
      });
      if (signUpError) setError(signUpError);
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) setError(signInError);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Circle className="h-8 w-8" fill="#D02020" stroke="#D02020" strokeWidth={1} />
          <Square className="h-8 w-8" fill="#1040C0" stroke="#1040C0" strokeWidth={1} />
          <Triangle className="h-8 w-8" fill="#F0C020" stroke="#F0C020" strokeWidth={1} />
          <span className="font-black uppercase text-2xl tracking-tighter ml-1">BizPulse</span>
        </div>

        <div className="bg-white border-2 md:border-4 border-black shadow-hard-8 p-6 md:p-8">
          <h1 className="font-black uppercase text-2xl md:text-3xl tracking-tighter mb-2">
            {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-sm font-medium text-gray-600 mb-6">
            {mode === 'signin'
              ? 'Sign in to your business dashboard.'
              : 'Create your free account in seconds.'}
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-primary-red/10 border-2 border-primary-red p-3 mb-4">
              <AlertCircle className="h-5 w-5 text-primary-red flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-primary-red">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-hard-4 transition-all text-base"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-hard-4 transition-all text-base"
                placeholder="Min 6 characters"
              />
            </div>

            {mode === 'signup' && (
              <>
                <div>
                  <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-hard-4 transition-all text-base"
                    placeholder="e.g. Sharma Kirana Store"
                  />
                </div>

                <div>
                  <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
                    Business Type
                  </label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-hard-4 transition-all text-base"
                  >
                    <option value="grocery">Grocery / Kirana</option>
                    <option value="food">Home Food Seller</option>
                    <option value="tailor">Tailor / Boutique</option>
                    <option value="manufacturer">Small Manufacturer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold uppercase text-xs tracking-widest mb-2 block">
                    Opening Balance (INR)
                  </label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    className="w-full border-2 border-black p-3 bg-white focus:outline-none focus:shadow-hard-4 transition-all text-base"
                    placeholder="0"
                  />
                </div>
              </>
            )}

            <Button
              variant="red"
              shape="square"
              className="w-full py-4 text-base"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="font-bold uppercase text-xs tracking-widest hover:text-primary-red transition-colors"
            >
              {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
