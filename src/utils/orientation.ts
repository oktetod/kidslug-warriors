/**
 * Force landscape orientation and request fullscreen.
 * Called once on first user interaction (required by browser policy).
 */
export async function forceLandscape(): Promise<void> {
  try {
    const so = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
    if (so?.lock) await so.lock('landscape').catch(() => {});
  } catch {}

  try {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen().catch(() => {});
    }
  } catch {}
}

/**
 * Unlock AudioContext on first user touch (mandatory on Android Chrome).
 */
export function unlockAudio() {
  const resume = () => {
    try {
      // Find all suspended audio contexts and resume them
      const AudioCtx = (window.AudioContext || (window as Record<string,unknown>).webkitAudioContext) as typeof AudioContext | undefined;
      if (AudioCtx) {
        const tmp = new AudioCtx();
        if (tmp.state === 'suspended') tmp.resume().catch(() => {});
        tmp.close().catch(() => {});
      }
    } catch {}
    document.removeEventListener('touchstart', resume);
    document.removeEventListener('touchend',   resume);
    document.removeEventListener('pointerdown',resume);
  };
  document.addEventListener('touchstart',  resume, { once: true, passive: true });
  document.addEventListener('touchend',    resume, { once: true, passive: true });
  document.addEventListener('pointerdown', resume, { once: true, passive: true });
}

/**
 * Block all default browser touch gestures that interfere with gameplay.
 */
export function lockGameGestures() {
  // Prevent pinch-zoom
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Prevent context menu on long press
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent pull-to-refresh and iOS bounce
  document.addEventListener('touchmove', (e) => {
    const t = e.target as HTMLElement;
    if (!t?.closest?.('.allow-scroll')) e.preventDefault();
  }, { passive: false });

  // Prevent text selection drag
  document.addEventListener('dragstart', (e) => e.preventDefault());
}
