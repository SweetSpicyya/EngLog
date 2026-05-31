export async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = (attempt: number) => 1000 * attempt,
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt >= maxAttempts) throw e;
      await new Promise(resolve => setTimeout(resolve, delayMs(attempt)));
    }
  }
}
