import { useEffect, useRef, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Phaser from 'phaser';
import { createGame } from '../game';
import { useGameStore } from '../store/gameStore';
import type { GameEventPayload } from '../types';
import { saveScore, updateCoins } from '../firebase/db';
import { forceLandscape } from '../utils/orientation';

interface HUD {
  score: number; coins: number; health: number; maxHealth: number;
  weapon: string; stage: number; bossHPPct: number;
}

type GSType = import('../game/scenes/GameScene').GameScene & {
  _hudHooked?: boolean;
  _mobileInterface?: Record<string, (k?: string) => void>;
  events: Phaser.Events.EventEmitter;
};

// ── Haptic feedback helper ───────────────────────────────────────
function vibrate(ms = 18) {
  try { navigator.vibrate?.(ms); } catch {}
}

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef      = useRef<Phaser.Game | null>(null);
  const { user, setScreen, selectedStage, updateUserCoins, setSelectedStage } = useGameStore();

  const [hud, setHud]         = useState<HUD>({ score:0, coins:0, health:3, maxHealth:3, weapon:'Pistol', stage:1, bossHPPct:0 });
  const [overlay, setOverlay] = useState<'none'|'gameover'|'stageclear'>('none');
  const [resultData, setResultData] = useState<Record<string,number>>({});

  // Track which d-pad directions are pressed (for visual feedback)
  const [dpad, setDpad] = useState({ left:false, right:false, up:false, down:false });
  // Track which action buttons are pressed
  const [btns, setBtns] = useState({ fire:false, jump:false });

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // ── Get live GameScene ───────────────────────────────────────────
  const getGS = useCallback((): GSType | null =>
    (gameRef.current?.scene.getScene('GameScene') as GSType) ?? null,
  []);

  // ── Stable callbacks (via refs) ──────────────────────────────────
  const handleGameOverRef   = useRef<(d: Record<string,number>) => void>(() => {});
  const handleStageClearRef = useRef<(d: Record<string,number>) => void>(() => {});

  handleGameOverRef.current = async (data) => {
    setOverlay('gameover'); setResultData(data);
    if (user) {
      await saveScore(user.uid, data.score??0, 0, data.kills??0).catch(()=>{});
      const earned = (data.coins??0) - (user.coins??0);
      if (earned > 0) { await updateCoins(user.uid, earned).catch(()=>{}); updateUserCoins(earned); }
    }
  };

  handleStageClearRef.current = async (data) => {
    setOverlay('stageclear'); setResultData(data);
    if (user) {
      await saveScore(user.uid, data.score??0, data.stage??0, data.kills??0).catch(()=>{});
      const earned = (data.coins??0) - (user.coins??0);
      if (earned > 0) { await updateCoins(user.uid, earned).catch(()=>{}); updateUserCoins(earned); }
    }
  };

  // ── Attach GameScene events ──────────────────────────────────────
  const attachSceneEvents = useCallback((gs: GSType) => {
    if (gs._hudHooked) return;
    gs._hudHooked = true;
    gs.events.on('gameEvent', (payload: GameEventPayload) => {
      if (payload.type === 'score') {
        const d = JSON.parse(payload.value as string);
        setHud(h => ({ ...h, score:d.score, coins:d.coins, health:d.health, maxHealth:d.maxHealth, weapon:d.weapon, stage:d.stage }));
      } else if (payload.type === 'bosshp') {
        setHud(h => ({ ...h, bossHPPct: payload.value as number }));
      } else if (payload.type === 'gameover') {
        handleGameOverRef.current(JSON.parse(payload.value as string));
      } else if (payload.type === 'stageclear') {
        handleStageClearRef.current(JSON.parse(payload.value as string));
      }
    });
  }, []);

  // ── Create Phaser game ───────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    forceLandscape();
    const game = createGame('game-container');
    gameRef.current = game;

    game.events.once('ready', () => {
      const boot = game.scene.getScene('BootScene') as Phaser.Scene & { events: Phaser.Events.EventEmitter };
      if (!boot) return;
      boot.events.once('bootReady', () => {
        game.scene.start('GameScene', {
          stage:        selectedStage,
          ownedWeapons: user?.ownedWeapons ?? ['pistol','grenade'],
          playerCoins:  user?.coins ?? 0,
        });
        const iv = setInterval(() => {
          const gs = game.scene.getScene('GameScene') as GSType | null;
          if (!gs || !gs.sys.isActive()) return;
          clearInterval(iv);
          setTimeout(() => { const gs2 = game.scene.getScene('GameScene') as GSType|null; if (gs2) attachSceneEvents(gs2); }, 120);
        }, 60);
      });
    });

    return () => { game.destroy(true); gameRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Restart helper ───────────────────────────────────────────────
  const restartGame = useCallback((stageId: number) => {
    setOverlay('none');
    setHud(h => ({ ...h, bossHPPct: 0 }));
    const g = gameRef.current;
    if (!g) return;
    g.scene.stop('GameScene');
    g.scene.start('GameScene', {
      stage: stageId,
      ownedWeapons: user?.ownedWeapons ?? ['pistol','grenade'],
      playerCoins:  user?.coins ?? 0,
    });
    const iv = setInterval(() => {
      const gs = g.scene.getScene('GameScene') as GSType|null;
      if (!gs || !gs.sys.isActive()) return;
      clearInterval(iv);
      setTimeout(() => {
        const gs2 = g.scene.getScene('GameScene') as GSType|null;
        if (gs2) { gs2._hudHooked = false; attachSceneEvents(gs2); }
      }, 120);
    }, 60);
  }, [user, attachSceneEvents]);

  // ── Key press helper ─────────────────────────────────────────────
  const pressKey = useCallback((key: string, down: boolean) => {
    const gs = getGS();
    if (!gs?._mobileInterface) return;
    if (down) gs._mobileInterface[key]?.();
    else gs._mobileInterface.release?.(key);
  }, [getGS]);

  // ── D-pad handlers with visual state + haptic ────────────────────
  const dpadDown = useCallback((dir: 'left'|'right'|'up'|'down') => {
    vibrate(12);
    setDpad(d => ({ ...d, [dir]: true }));
    pressKey(dir, true);
  }, [pressKey]);

  const dpadUp = useCallback((dir: 'left'|'right'|'up'|'down') => {
    setDpad(d => ({ ...d, [dir]: false }));
    pressKey(dir, false);
  }, [pressKey]);

  const fireDown = useCallback(() => { vibrate(15); setBtns(b=>({...b, fire:true}));  pressKey('shoot', true);  }, [pressKey]);
  const fireUp   = useCallback(() => {               setBtns(b=>({...b, fire:false})); pressKey('shoot', false); }, [pressKey]);
  const jumpDown = useCallback(() => { vibrate(12); setBtns(b=>({...b, jump:true}));  pressKey('up', true);     }, [pressKey]);
  const jumpUp   = useCallback(() => {               setBtns(b=>({...b, jump:false})); pressKey('up', false);   }, [pressKey]);

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* ── Phaser Canvas ── */}
      <div id="game-container" ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* ── HUD (always on top) ── */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between px-3 pt-2 pointer-events-none z-10"
           style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 8px))' }}>

        {/* Health hearts */}
        <div className="flex gap-1 items-center bg-black/70 px-2 py-1 rounded-xl border border-yellow-600/40 backdrop-blur-sm">
          {Array.from({ length: hud.maxHealth }).map((_, i) => (
            <span key={i} className="text-lg leading-none">{i < hud.health ? '❤️' : '🖤'}</span>
          ))}
        </div>

        {/* Stage + Score (center) */}
        <div className="text-center bg-black/70 px-4 py-1 rounded-xl border border-yellow-600/40 backdrop-blur-sm">
          <div className="text-yellow-400 font-mono text-[10px] font-bold tracking-widest">STAGE {hud.stage}</div>
          <div className="text-white font-mono text-base font-bold leading-tight">{hud.score.toLocaleString()}</div>
        </div>

        {/* Coins + Weapon */}
        <div className="text-right bg-black/70 px-2 py-1 rounded-xl border border-yellow-600/40 backdrop-blur-sm">
          <div className="text-yellow-300 font-mono text-xs font-bold">🪙 {hud.coins}</div>
          <div className="text-green-400 font-mono text-[10px]">{hud.weapon}</div>
        </div>
      </div>

      {/* ── Boss HP Bar ── */}
      {hud.bossHPPct > 0 && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
             style={{ width: 'min(500px, 90vw)' }}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-red-400 font-mono text-[10px] font-bold animate-pulse">⚡ BOSS</span>
            <span className="text-red-300 font-mono text-[10px] font-bold">{Math.round(hud.bossHPPct*100)}%</span>
          </div>
          <div className="w-full h-4 bg-black/80 border border-red-600/70 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-red-900 to-red-500 transition-all duration-150"
                 style={{ width: `${hud.bossHPPct*100}%` }} />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          MLBB / PUBGM STYLE TOUCH CONTROLS
          ════════════════════════════════════════════════════════ */}
      {isMobile && overlay === 'none' && (
        <div className="absolute inset-0 pointer-events-none z-20">

          {/* ── LEFT SIDE: D-PAD ─────────────────────────────── */}
          <div className="absolute pointer-events-auto select-none"
               style={{
                 bottom: 'max(18px, env(safe-area-inset-bottom, 18px))',
                 left: 'max(18px, env(safe-area-inset-left, 18px))',
               }}>

            {/* Outer ring — visual only */}
            <div className="relative" style={{ width: 164, height: 164 }}>
              {/* Background disc */}
              <div className="absolute inset-0 rounded-full border-2 border-white/10 bg-white/5 backdrop-blur-sm" />

              {/* ← LEFT */}
              <DirButton
                active={dpad.left}
                onDown={() => dpadDown('left')} onUp={() => dpadUp('left')}
                style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)' }}
                className="w-14 h-14 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white/80 text-2xl font-bold active:bg-white/25"
              >◀</DirButton>

              {/* → RIGHT */}
              <DirButton
                active={dpad.right}
                onDown={() => dpadDown('right')} onUp={() => dpadUp('right')}
                style={{ position:'absolute', right:0, top:'50%', transform:'translateY(-50%)' }}
                className="w-14 h-14 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white/80 text-2xl font-bold active:bg-white/25"
              >▶</DirButton>

              {/* ↑ UP/JUMP */}
              <DirButton
                active={dpad.up}
                onDown={() => dpadDown('up')} onUp={() => dpadUp('up')}
                style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)' }}
                className="w-14 h-14 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white/80 text-2xl font-bold active:bg-white/25"
              >▲</DirButton>

              {/* ↓ CROUCH */}
              <DirButton
                active={dpad.down}
                onDown={() => dpadDown('down')} onUp={() => dpadUp('down')}
                style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)' }}
                className="w-14 h-14 rounded-full bg-black/30 border border-white/20 flex items-center justify-center text-white/80 text-2xl font-bold active:bg-white/25"
              >▼</DirButton>

              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/8 border border-white/15" />
            </div>
          </div>

          {/* ── RIGHT SIDE: ACTION BUTTONS ───────────────────── */}
          <div className="absolute pointer-events-auto select-none"
               style={{
                 bottom: 'max(18px, env(safe-area-inset-bottom, 18px))',
                 right:  'max(18px, env(safe-area-inset-right, 18px))',
               }}>

            {/* SWITCH WEAPON — top small button */}
            <div className="flex justify-center mb-3">
              <ActionBtn
                active={false}
                onDown={() => { vibrate(10); getGS()?._mobileInterface?.switchWeapon?.(); }}
                onUp={() => {}}
                size={46}
                color="rgba(255,200,0,0.22)"
                borderColor="rgba(255,200,0,0.55)"
                label="⟳ WPN"
                labelSize={9}
              />
            </div>

            {/* JUMP + FIRE — side by side */}
            <div className="flex gap-4 items-center">
              {/* JUMP */}
              <ActionBtn
                active={btns.jump}
                onDown={jumpDown} onUp={jumpUp}
                size={72}
                color="rgba(40,100,220,0.28)"
                borderColor="rgba(80,160,255,0.75)"
                label="JUMP"
                labelSize={11}
              />
              {/* FIRE — bigger, right side */}
              <ActionBtn
                active={btns.fire}
                onDown={fireDown} onUp={fireUp}
                size={86}
                color="rgba(200,30,30,0.32)"
                borderColor="rgba(255,60,60,0.85)"
                label="FIRE"
                labelSize={13}
              />
            </div>
          </div>

          {/* ── CENTER BOTTOM: weapon name reminder ─────────── */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="text-white/30 font-mono text-[9px] tracking-widest">{hud.weapon.toUpperCase()}</div>
          </div>

        </div>
      )}

      {/* ── Game Over Overlay ── */}
      {overlay === 'gameover' && (
        <div className="absolute inset-0 bg-black/82 flex flex-col items-center justify-center z-30 gap-4 px-4">
          <div className="text-red-500 font-mono text-4xl font-black animate-pulse drop-shadow-lg tracking-widest">MISSION FAILED</div>
          <div className="text-center space-y-1">
            <div className="text-white font-mono text-lg">Score <span className="text-yellow-400 font-bold">{(resultData.score??0).toLocaleString()}</span></div>
            <div className="text-white font-mono text-base">🪙 {resultData.coins??0} coins total</div>
            <div className="text-gray-400 font-mono text-sm">{resultData.kills??0} kills</div>
          </div>
          <div className="flex gap-3 mt-2 pointer-events-auto">
            <button onPointerDown={() => restartGame(selectedStage)}
              className="px-5 py-3 bg-yellow-500 active:bg-yellow-300 text-black font-bold rounded-xl font-mono text-base shadow-lg shadow-yellow-500/30">
              🔄 RETRY
            </button>
            <button onPointerDown={() => setScreen('menu')}
              className="px-5 py-3 bg-gray-700 active:bg-gray-500 text-white font-bold rounded-xl font-mono text-base">
              🏠 MENU
            </button>
          </div>
        </div>
      )}

      {/* ── Stage Clear Overlay ── */}
      {overlay === 'stageclear' && (
        <div className="absolute inset-0 bg-black/82 flex flex-col items-center justify-center z-30 gap-4 px-4">
          <div className="text-yellow-400 font-mono text-3xl font-black tracking-wide drop-shadow-lg">✅ MISSION COMPLETE!</div>
          <div className="text-center space-y-1">
            <div className="text-white font-mono text-lg">Score <span className="text-yellow-400 font-bold">{(resultData.score??0).toLocaleString()}</span></div>
            <div className="text-green-400 font-mono text-base font-bold">🪙 +{resultData.coinReward??0} bonus coins!</div>
            <div className="text-gray-400 font-mono text-sm">{resultData.kills??0} kills</div>
          </div>
          <div className="flex gap-3 mt-2 pointer-events-auto">
            {selectedStage < 4 && (
              <button onPointerDown={() => { const n=selectedStage+1; setSelectedStage(n); restartGame(n); }}
                className="px-5 py-3 bg-green-500 active:bg-green-300 text-black font-bold rounded-xl font-mono text-base shadow-lg shadow-green-500/30">
                ▶ NEXT STAGE
              </button>
            )}
            <button onPointerDown={() => setScreen('menu')}
              className="px-5 py-3 bg-gray-700 active:bg-gray-500 text-white font-bold rounded-xl font-mono text-base">
              🏠 MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── D-pad directional button ──────────────────────────────────────
function DirButton({ active, onDown, onUp, className, style, children }: {
  active: boolean; onDown: ()=>void; onUp: ()=>void;
  className: string; style?: import('react').CSSProperties; children: ReactNode;
}) {
  return (
    <button
      style={style}
      className={`${className} ${active ? 'bg-white/30 scale-90' : ''} transition-transform duration-50`}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={e   => { e.preventDefault(); onUp(); }}
      onPointerLeave={e => { onUp(); }}
      onPointerCancel={e => { onUp(); }}
    >
      {children}
    </button>
  );
}

// ── Action button (FIRE, JUMP, SWITCH) ───────────────────────────
function ActionBtn({ active, onDown, onUp, size, color, borderColor, label, labelSize }: {
  active: boolean; onDown: ()=>void; onUp: ()=>void;
  size: number; color: string; borderColor: string; label: string; labelSize: number;
}) {
  return (
    <button
      style={{
        width:  size, height: size,
        borderRadius: '50%',
        background:   active ? borderColor.replace('0.85','0.5').replace('0.75','0.45').replace('0.55','0.4') : color,
        border:       `2.5px solid ${borderColor}`,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        transform:    active ? 'scale(0.91)' : 'scale(1)',
        transition:   'transform 0.05s, background 0.05s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: active ? `0 0 18px ${borderColor}` : 'none',
      }}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); onDown(); }}
      onPointerUp={e   => { e.preventDefault(); onUp(); }}
      onPointerLeave={e => { onUp(); }}
      onPointerCancel={e => { onUp(); }}
    >
      <span style={{
        color: 'rgba(255,255,255,0.90)',
        fontFamily: 'monospace',
        fontSize: labelSize,
        fontWeight: 'bold',
        letterSpacing: 1,
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
      }}>{label}</span>
    </button>
  );
}
