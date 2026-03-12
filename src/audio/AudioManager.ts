// =================================================================
//  KIDSLUG WARRIORS v2 - AUDIO MANAGER
//  Uses BABYLON.Sound for all SFX and BGM (WAV files in /public/audio/)
//  Falls back to Web Audio API procedural tones if WAV not available
// =================================================================

import { Sound, Scene as BabylonScene, Engine as BabylonEngine } from '@babylonjs/core';

// ---- Shared state ------------------------------------------------
let _scene:     BabylonScene | null = null;
let muted       = false;
let bgmSound:   Sound | null = null;
let currentBgm: string       = '';
let actx:       AudioContext | null = null;
let masterGain: GainNode     | null = null;

const sfxCache: Map<string, Sound> = new Map();

// ---- BGM mapping -------------------------------------------------
const BGM_MAP: Record<number, string> = {
  0: 'BGM1',
  1: 'BGM1', 2: 'BGM1', 3: 'BGM1', 4: 'BGM1',
  5: 'BGM2', 6: 'BGM2', 7: 'BGM2', 8: 'BGM2',
  9: 'Boss', 10: 'Boss',
  25: 'Finalwave',
};

// ---- BABYLON.Sound loader ----------------------------------------
function getScene(): BabylonScene | null { return _scene; }

function loadSFX(name: string, vol = 1.0): Sound | null {
  const scene = getScene();
  if (!scene) return null;
  if (sfxCache.has(name)) return sfxCache.get(name)!;
  try {
    const s = new Sound(
      name, `/audio/${name}.wav`, scene,
      null,
      { volume: vol, autoplay: false, loop: false }
    );
    sfxCache.set(name, s);
    return s;
  } catch { return null; }
}

function playSFX(name: string, vol = 1.0): void {
  if (muted) return;
  const scene = getScene();
  if (!scene) { playFallback(name); return; }
  try {
    // Short one-shot: create a new Sound each call so overlapping is OK
    new Sound(
      name + '_' + Date.now(),
      `/audio/${name}.wav`,
      scene,
      () => { /* loaded */ },
      { volume: muted ? 0 : vol, autoplay: true, loop: false }
    );
  } catch { playFallback(name); }
}

// ---- Web Audio procedural fallback --------------------------------
function getActx(): AudioContext {
  if (!actx) {
    const W = window as any;
    const ctx = new (W.AudioContext || W.webkitAudioContext)() as AudioContext;
    actx = ctx;
    masterGain = actx.createGain();
    masterGain.gain.value = muted ? 0 : 0.7;
    masterGain.connect(actx.destination);
  }
  if (actx.state === 'suspended') void actx.resume();
  return actx;
}

function playTone(freq: number, type: OscillatorType, dur: number, vol: number): void {
  if (muted) return;
  try {
    const c = getActx();
    const o = c.createOscillator(); const g = c.createGain();
    if (!masterGain) return;
    o.connect(g); g.connect(masterGain);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.start(); o.stop(c.currentTime + dur);
  } catch { /**/ }
}

function playNoise(dur: number, vol: number, lpFreq = 1000): void {
  if (muted) return;
  try {
    const c = getActx();
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 0.8);
    const src = c.createBufferSource(); src.buffer = buf;
    const flt = c.createBiquadFilter(); flt.type = 'lowpass'; flt.frequency.value = lpFreq;
    const g = c.createGain(); if (!masterGain) return;
    src.connect(flt); flt.connect(g); g.connect(masterGain);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.start(); src.stop(c.currentTime + dur);
  } catch { /**/ }
}

function playFallback(name: string): void {
  switch (name) {
    case 'Shoot':       playNoise(0.08, 0.25, 1200); break;
    case 'Machinegun':  playNoise(0.12, 0.35, 800);  break;
    case 'Explosion':   playNoise(0.50, 0.60, 400);  break;
    case 'Gettinghit':  playTone(300, 'sawtooth', 0.10, 0.22); break;
    case 'Death':       [400,280,160].forEach((f,i) => setTimeout(()=>playTone(f,'sawtooth',0.3,0.18),i*180)); break;
    case 'Mission1':    [523,659,784,1047].forEach((f,i) => setTimeout(()=>playTone(f,'sine',0.2,0.15),i*100)); break;
    case 'Victory':     [523,659,784,1047].forEach((f,i) => setTimeout(()=>playTone(f,'sine',0.14,0.14),i*90)); break;
    default:            playTone(600, 'sine', 0.07, 0.10); break;
  }
}

// ---- BGM via BABYLON.Sound ---------------------------------------
function playBGM(stageId: number): void {
  const file = BGM_MAP[stageId] ?? 'BGM1';
  const src  = `/audio/${file}.wav`;
  if (currentBgm === src) return;
  stopBGM();

  const scene = getScene();
  if (!scene) return;

  try {
    const s = new Sound(
      'bgm_' + file, src, scene,
      null,
      { volume: muted ? 0 : 0.28, autoplay: true, loop: true, streaming: true }
    );
    bgmSound   = s;
    currentBgm = src;
  } catch { /**/ }
}

function stopBGM(): void {
  if (bgmSound) {
    try { bgmSound.stop(); bgmSound.dispose(); } catch { /**/ }
    bgmSound   = null;
    currentBgm = '';
  }
}

function getMuted(): boolean   { return muted; }
function toggleMute(): boolean {
  muted = !muted;
  if (bgmSound)   bgmSound.setVolume(muted ? 0 : 0.28);
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
  return muted;
}

// ---- SFX API ------------------------------------------------------
const SFX = {
  ui_click:      () => playTone(900, 'sine',  0.07, 0.12),
  ui_back:       () => playTone(500, 'sine',  0.09, 0.10),

  shoot_pistol:  () => playSFX('Shoot',      0.55),
  shoot_heavy:   () => playSFX('Machinegun', 0.60),
  shoot_laser:   () => playSFX('Shoot1',     0.50),
  shoot_rocket:  () => playSFX('Shoot2',     0.55),

  explosion:     () => playSFX('Explosion',  0.70),
  explosion_big: () => playSFX('Explosion1', 0.75),

  jump:          () => playTone(350, 'square', 0.10, 0.08),
  land:          () => playNoise(0.06, 0.25, 200),
  hit_player:    () => playSFX('Gettinghit', 0.70),
  game_over:     () => playSFX('Death',       0.80),

  hit_enemy:     () => playSFX('Shoot3',     0.45),

  coin_pickup:   () => {
    [800,1000,1200].forEach((f,i) => setTimeout(()=>playTone(f,'sine',0.08,0.09),i*60));
  },

  boss_appear:   () => {
    if (muted) return;
    try {
      const c = getActx(); if (!masterGain) return;
      const o = c.createOscillator(); const g = c.createGain();
      o.connect(g); g.connect(masterGain); o.type = 'sawtooth';
      o.frequency.setValueAtTime(80, c.currentTime);
      o.frequency.exponentialRampToValueAtTime(40, c.currentTime + 0.8);
      g.gain.setValueAtTime(0.3, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.9);
      o.start(); o.stop(c.currentTime + 0.9);
    } catch { /**/ }
  },

  mission_clear: () => playSFX('Mission1', 0.75),
  level_up:      () => [400,500,630,800,1000].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.18,0.14),i*80)),
  purchase_ok:   () => [523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.18,0.11),i*90)),

  gacha_pull: () => {
    if (muted) return;
    try {
      const c = getActx(); if (!masterGain) return;
      for (let i=0;i<8;i++){
        const o=c.createOscillator();const g=c.createGain();
        o.connect(g);g.connect(masterGain);o.type='sine';
        o.frequency.setValueAtTime(300+Math.random()*800,c.currentTime+i*0.06);
        o.frequency.exponentialRampToValueAtTime(200+Math.random()*600,c.currentTime+i*0.06+0.09);
        g.gain.setValueAtTime(0.07,c.currentTime+i*0.06);
        g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+i*0.06+0.10);
        o.start(c.currentTime+i*0.06);o.stop(c.currentTime+i*0.06+0.11);
      }
    } catch { /**/ }
  },

  gacha_legendary: () => playSFX('Victory', 0.80),
};

// ---- AudioManager singleton class --------------------------------
export class AudioManager {
  private static _inst: AudioManager | null = null;

  static getInstance(): AudioManager {
    if (!AudioManager._inst) AudioManager._inst = new AudioManager();
    return AudioManager._inst;
  }

  /** Call this once after a Babylon.js Scene is available. */
  setScene(scene: BabylonScene): void {
    _scene = scene;
  }

  playBGM(stageId: number): void  { playBGM(stageId); }
  stopBGM(): void                  { stopBGM();          }
  getMuted(): boolean              { return getMuted();   }
  toggleMute(): boolean            { return toggleMute(); }

  get sfx() { return SFX; }

  dispose(): void {
    stopBGM();
    sfxCache.forEach(s => { try { s.dispose(); } catch { /**/ } });
    sfxCache.clear();
    _scene = null;
  }
}

/** Convenience re-export for code that imports SFX directly */
export { SFX, playBGM, stopBGM, getMuted, toggleMute };
