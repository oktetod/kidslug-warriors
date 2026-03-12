// ============================================================
//  KIDSLUG WARRIORS v2 - MAIN ENTRY POINT
// ============================================================

import { Engine }              from './core/Engine';
import { GameScene }           from './core/GameScene';
import { Scene as BabylonScene } from '@babylonjs/core';
import { ScreenManager }       from './screens/ScreenManager';
import { buildHomeScreen }     from './screens/HomeScreen';
import { buildStageScreen }    from './screens/StageScreen';
import { buildAuthScreen }     from './screens/AuthScreen';
import { buildGachaScreen }    from './screens/GachaScreen';
import { buildCharacterScreen} from './screens/CharacterScreen';
import { buildInventoryScreen} from './screens/InventoryScreen';
import { buildQuestScreen }    from './screens/QuestScreen';
import { buildShopScreen }     from './screens/ShopScreen';
import { buildCostumeScreen }  from './screens/CostumeScreen';
import { buildGMScreen }       from './screens/GMScreen';
import { loadSave, writeSave, DEFAULT_SAVE, deepClone, SaveData } from './network/SaveSystem';
import {
  ADMIN_UIDS,
  loginWithGoogle, logoutUser, onAuthChange,
  loadFromFirebase, saveToFirebase, getAllPlayers, gmBanPlayer,
  AutoSaveManager,
} from './network/FirebaseManager';
import { AudioManager } from './audio/AudioManager';
import { STAGES }       from './data/GameData';
import { applyRunResult } from './systems/ProgressSystem';

// ── Bootstrap ───────────────────────────────────────────────
const engine = new Engine('gameCanvas');
const audio  = AudioManager.getInstance();

// ── Loading screen ──────────────────────────────────────────
const loadingEl = document.getElementById('loading');
function hideLoading() {
  if (loadingEl) {
    loadingEl.style.opacity = '0';
    setTimeout(() => loadingEl.remove(), 400);
  }
}

// ── App state ───────────────────────────────────────────────
let save: SaveData   = deepClone(DEFAULT_SAVE);
let currentUser: any = null;
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Auto-save every 30 seconds to Firebase when logged in
const autoSaveMgr = new AutoSaveManager();

function persistSave(ns: SaveData) {
  save = ns;
  ns.lastSaved = Date.now();
  writeSave(ns);
  // Immediate debounced cloud push
  if (currentUser && !ns.player.isGuest) {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveToFirebase(currentUser.uid, ns), 3000);
  }
  // AutoSaveManager always reads from () => save getter, so no extra call needed
}

// ── Scene/screen state ──────────────────────────────────────
let gameScene: GameScene | null = null;
let screenMgr: ScreenManager | null = null;
let menuBabylonScene: BabylonScene | null = null;

function ensureMenuScene(): ScreenManager {
  if (!menuBabylonScene || !screenMgr) {
    menuBabylonScene = new BabylonScene(engine.babylon);
    screenMgr = new ScreenManager(menuBabylonScene);
    engine.runRenderLoop(() => menuBabylonScene!.render());
  }
  return screenMgr!;
}

// ── Screen helpers ──────────────────────────────────────────

function showAuth(errMsg?: string) {
  const mgr = ensureMenuScene();
  mgr.register('auth', () => buildAuthScreen(mgr.gui, {
    onGoogle: () => loginWithGoogle()
      .then(r => { if (r.user) showHome(); else showAuth(r.error ?? undefined); })
      .catch((e: unknown) => showAuth(String(e))),
    onGuest: () => {
      save.player.isGuest = true;
      persistSave(save);
      showHome();
    },
  }, errMsg));
  mgr.show('auth');
}

function showHome() {
  const mgr = ensureMenuScene();
  const isAdmin = ADMIN_UIDS.includes(currentUser?.uid ?? '');
  mgr.register('home', () => buildHomeScreen(mgr.gui, save, {
    onStage:      () => showStage(),
    onGacha:      () => showGacha(),
    onShop:       () => showShop(),
    onCharacter:  () => showCharacter(),
    onInventory:  () => showInventory(),
    onQuest:      () => showQuest(),
    onCostume:    () => showCostume(),
    onGM:         () => showGM(),
    onLogout:     () => handleLogout(),
    onToggleMute: () => audio.toggleMute(),
  }, audio.getMuted(), isAdmin));
  mgr.show('home');
  audio.playBGM(0);
}

function showStage() {
  const mgr = ensureMenuScene();
  mgr.register('stage', () => buildStageScreen(mgr.gui, save,
    (id) => startGame(id), () => showHome()),
  );
  mgr.show('stage');
}

function showGacha() {
  const mgr = ensureMenuScene();
  mgr.register('gacha', () => buildGachaScreen(mgr.gui, save, {
    onBack: () => showHome(),
    onSave: (ns) => { persistSave(ns); showGacha(); },
  }));
  mgr.show('gacha');
}

function showCharacter() {
  const mgr = ensureMenuScene();
  mgr.register('character', () => buildCharacterScreen(mgr.gui, save, {
    onBack: () => showHome(),
    onSave: (ns) => { persistSave(ns); showCharacter(); },
  }));
  mgr.show('character');
}

function showInventory() {
  const mgr = ensureMenuScene();
  mgr.register('inventory', () => buildInventoryScreen(mgr.gui, save, {
    onBack: () => showHome(),
    onSave: (ns) => { persistSave(ns); showInventory(); },
  }));
  mgr.show('inventory');
}

function showQuest() {
  const mgr = ensureMenuScene();
  mgr.register('quest', () => buildQuestScreen(mgr.gui, save, {
    onBack:      () => showHome(),
    onSave:      (ns) => { persistSave(ns); showQuest(); },
    onPlayStage: (id) => startGame(id),
  }));
  mgr.show('quest');
}

function showShop() {
  const mgr = ensureMenuScene();
  mgr.register('shop', () => buildShopScreen(mgr.gui, save, {
    onBack: () => showHome(),
    onSave: (ns) => { persistSave(ns); showShop(); },
    onPurchase: (pid, _ok, err) => { console.log('[Shop]', pid); err('cancelled'); },
  }));
  mgr.show('shop');
}

function showCostume() {
  const mgr = ensureMenuScene();
  mgr.register('costume', () => buildCostumeScreen(mgr.gui, save, {
    onBack: () => showHome(),
    onSave: (ns) => { persistSave(ns); showCostume(); },
    onPurchase: (pid, _ok, err) => { console.log('[Costume]', pid); err('cancelled'); },
  }));
  mgr.show('costume');
}

function showGM() {
  const mgr = ensureMenuScene();
  mgr.register('gm', () => buildGMScreen(mgr.gui, save, {
    onBack:          () => showHome(),
    onSave:          (ns) => { persistSave(ns); showGM(); },
    onGetAllPlayers: () => getAllPlayers(),
    onBanPlayer:     (uid) => gmBanPlayer(uid),
    currentUid:      currentUser?.uid,
  }));
  mgr.show('gm');
}

// ── Game flow ───────────────────────────────────────────────

function startGame(stageId: number) {
  const stage = STAGES.find(s => s.id === stageId);
  if (!stage) return;

  // Stop menu render loop and dispose menu scene
  engine.stopRenderLoop();
  screenMgr?.dispose();
  menuBabylonScene?.dispose();
  menuBabylonScene = null;
  screenMgr = null;

  gameScene = new GameScene(engine);
  void gameScene.start(stage, save, {
    onComplete: (coins: number, kills: number, bossKilled: boolean, noDamage: boolean) => {
      const ns = applyRunResult(save, { stageId, kills, coinsEarned: coins, bossKilled, noDamage });
      persistSave(ns);
      engine.stopRenderLoop();
      gameScene?.dispose();
      gameScene = null;
      showStage();
    },
    onDie: () => {
      engine.stopRenderLoop();
      gameScene?.dispose();
      gameScene = null;
      showStage();
    },
    getSave:  () => save,
    onSave:   (ns: SaveData) => persistSave(ns),
  });
  audio.playBGM(stageId);
}

async function handleLogout() {
  autoSaveMgr.stop();
  await logoutUser();
  currentUser = null;
  showAuth();
}

// ── Error overlay (shown if something goes very wrong) ──────
function showErrorOverlay(msg: string) {
  const el = document.createElement('div');
  el.style.cssText = [
    'position:fixed;inset:0;background:#0a0a14;display:flex;flex-direction:column',
    'align-items:center;justify-content:center;z-index:99999;padding:24px',
  ].join(';');
  el.innerHTML = `
    <p style="font-family:'Press Start 2P',monospace;font-size:clamp(10px,3vw,14px);color:#f44336;text-align:center;margin-bottom:16px">BOOT ERROR</p>
    <p style="font-family:monospace;font-size:11px;color:#888;text-align:center;word-break:break-all;max-width:90%">${msg}</p>
    <p style="font-family:monospace;font-size:10px;color:#555;text-align:center;margin-top:20px">Check Vercel env vars &amp; Firebase config</p>
    <button onclick="location.reload()" style="margin-top:24px;padding:10px 24px;background:#1565C0;color:#fff;border:none;font-family:'Press Start 2P',monospace;font-size:10px;cursor:pointer;border-radius:4px">RETRY</button>
  `;
  document.body.appendChild(el);
}

// ── Boot ────────────────────────────────────────────────────

async function bootApp() {
  ensureMenuScene();
  window.addEventListener('resize', () => engine.babylon.resize());

  // ---- STEP 1: Show auth screen immediately from localStorage
  // This guarantees something is always on screen right away.
  // Firebase state update happens in the background below.
  save = loadSave();
  showAuth();
  hideLoading();

  // ---- STEP 2: Listen for Firebase auth state in background
  // When Firebase resolves (0.5-2s later) we update accordingly.
  try {
    onAuthChange(async (user) => {
      currentUser = user;
      if (user?.uid) {
        // Logged-in user: merge cloud save if newer
        let cloud: SaveData | null = null;
        try { cloud = await loadFromFirebase(user.uid); } catch { /* offline ok */ }
        const local = loadSave();
        save = (cloud && (cloud.lastSaved ?? 0) > (local.lastSaved ?? 0))
          ? { ...deepClone(DEFAULT_SAVE), ...cloud } as SaveData
          : local;
        save.player.isGuest = false;
        save.player.uid     = user.uid;
        save.player.name    = (user as any).displayName ?? 'PEJUANG';
        save.gm.isGM        = ADMIN_UIDS.includes(user.uid);
        persistSave(save);
        autoSaveMgr.start(user.uid, () => save);
        showHome();
      } else {
        // Not logged in (or logged out) - stay on / return to auth
        autoSaveMgr.stop();
        save = loadSave();
        showAuth();
      }
    });
  } catch (fbErr: unknown) {
    // Firebase not configured (missing Vercel env vars) - guest mode only
    console.warn('[Main] Firebase unavailable, guest mode only:', fbErr);
    // Auth screen is already shown from Step 1, guest play still works
  }
}

bootApp().catch((err: unknown) => {
  console.error('[Main] Boot error:', err);
  showErrorOverlay(String(err));
});
