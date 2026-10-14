/** Rejects if `promise` takes longer than `ms`, so a hung request can never leave a spinner on forever. */
export function withTimeout<T>(promise: PromiseLike<T>, ms = 15000, label = 'Request'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out. Check your connection and try again.`)), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); }
    );
  });
}
