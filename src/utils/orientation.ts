/** Force landscape + fullscreen on first user gesture. */
export async function forceLandscape(): Promise<void> {
  // Screen Orientation API (Android Chrome / Samsung Browser)
  try {
    type LockableOrientation = ScreenOrientation & { lock?: (o: string) => Promise<void> };
    const so = screen.orientation as LockableOrientation;
    if (so?.lock) await so.lock('landscape').catch(() => {});
  } catch { /* not supported */ }

  // Fullscreen API
  try {
    type FullscreenEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    const el = document.documentElement as FullscreenEl;
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen().catch(() => {});
    }
  } catch { /* not supported */ }
}

/** Unlock Web Audio on first touch (required on Android Chrome). */
export function unlockAudio(): void {
  const resume = () => {
    try {
      // Fix TS2352: use 'unknown' as intermediate cast instead of directly
      // casting Window to Record<string,unknown>
      type AnyWindow = { webkitAudioContext?: typeof AudioContext };
      const win = window as unknown as AnyWindow;
      const Ctor = window.AudioContext ?? win.webkitAudioContext;
      if (Ctor) {
        const ctx = new Ctor();
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        ctx.close().catch(() => {});
      }
    } catch { /* no Web Audio */ }
    document.removeEventListener('touchstart',  resume);
    document.removeEventListener('touchend',    resume);
    document.removeEventListener('pointerdown', resume);
  };
  document.addEventListener('touchstart',  resume, { once: true, passive: true });
  document.addEventListener('touchend',    resume, { once: true, passive: true });
  document.addEventListener('pointerdown', resume, { once: true, passive: true });
}

/** Block browser gestures that break gameplay (zoom, context menu, scroll). */
export function lockGameGestures(): void {
  // Prevent pinch-zoom
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // Prevent long-press context menu
  window.addEventListener('contextmenu', (e) => e.preventDefault());

  // Prevent pull-to-refresh & iOS elastic scroll outside .allow-scroll elements
  document.addEventListener('touchmove', (e) => {
    const t = e.target as HTMLElement | null;
    if (!t?.closest?.('.allow-scroll')) e.preventDefault();
  }, { passive: false });

  // Prevent drag selection
  document.addEventListener('dragstart', (e) => e.preventDefault());
}
