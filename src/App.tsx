import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import { getOrCreatePlayer } from './firebase/db';
import { useGameStore } from './store/gameStore';
import { AuthScreen }        from './components/AuthScreen';
import { MenuScreen }        from './components/MenuScreen';
import { GameCanvas }        from './components/GameCanvas';
import { ShopScreen }        from './components/ShopScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { GMScreen }          from './components/GMScreen';
import { unlockAudio, lockGameGestures, forceLandscape } from './utils/orientation';

export default function App() {
  const { screen, setScreen, setUser } = useGameStore();

  // ── One-time mobile setup ─────────────────────────────────────
  useEffect(() => {
    // Block scroll/zoom/context-menu gestures everywhere
    lockGameGestures();

    // Pre-register audio unlock (fires on first touch anywhere)
    unlockAudio();

    // Request landscape + fullscreen on first user interaction
    const onFirstTouch = () => {
      forceLandscape();
      document.removeEventListener('touchstart', onFirstTouch);
      document.removeEventListener('pointerdown', onFirstTouch);
    };
    document.addEventListener('touchstart',  onFirstTouch, { once: true, passive: true });
    document.addEventListener('pointerdown', onFirstTouch, { once: true, passive: true });
  }, []);

  // ── Firebase auth listener ────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const player = await getOrCreatePlayer(
            firebaseUser.uid,
            firebaseUser.displayName ?? 'Soldier',
            firebaseUser.email       ?? '',
            firebaseUser.photoURL    ?? '',
          );
          if (player.isBanned) {
            setUser(null);
            setScreen('auth');
            alert('Your account has been banned.');
            return;
          }
          setUser(player);
          setScreen('menu');
        } catch {
          setScreen('auth');
        }
      } else {
        setUser(null);
        setScreen('auth');
      }
    });
    return unsub;
  }, [setUser, setScreen]);

  if (screen === 'loading') {
    return (
      <div className="fixed inset-0 bg-[#0a0a1e] flex flex-col items-center justify-center gap-4">
        <img src="/assets/Metal_Slug/Title.gif" alt="Loading" className="h-20 object-contain" />
        <div className="text-yellow-400 font-mono text-xl animate-pulse tracking-widest">LOADING...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {screen === 'auth'        && <AuthScreen />}
      {screen === 'menu'        && <MenuScreen />}
      {screen === 'game'        && <GameCanvas />}
      {screen === 'shop'        && <ShopScreen />}
      {screen === 'leaderboard' && <LeaderboardScreen />}
      {screen === 'gm'          && <GMScreen />}
    </div>
  );
}
