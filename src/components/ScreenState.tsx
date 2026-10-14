import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/Button';

export function Spinner({ tall = false }: { tall?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${tall ? 'min-h-[60vh]' : 'min-h-[40vh]'}`}>
      <div className="h-12 w-12 rounded-full border-4 border-black border-t-primary-red animate-spin" />
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white border-2 md:border-4 border-black shadow-hard-4 p-6 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-primary-red" strokeWidth={2.5} />
        <h3 className="font-bold uppercase text-lg tracking-tight mb-2">Something went wrong</h3>
        <p className="text-sm font-medium text-gray-600 mb-4 break-words">{message}</p>
        {onRetry && (
          <Button variant="red" shape="square" onClick={onRetry}>Try again</Button>
        )}
      </div>
    </div>
  );
}
