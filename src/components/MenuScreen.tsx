import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useGameStore } from '../store/gameStore';
import { STAGES } from '../game/constants';

export function MenuScreen() {
  const { user, setScreen, selectedStage, setSelectedStage } = useGameStore();

  return (
    <div className="ui-screen min-h-screen bg-gradient-to-b from-[#0a0a1e] to-[#1a1a3e] flex flex-col items-center p-4 overflow-y-auto">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between pt-4 pb-2">
        <div className="flex items-center gap-3">
          <img src={user?.photoURL || '/assets/Metal_Slug/Player/PlayerLeft.png'} className="w-10 h-10 rounded-full border-2 border-yellow-500 object-cover" alt="" />
          <div>
            <div className="text-white font-mono text-sm font-bold">{user?.displayName || 'Soldier'}</div>
            <div className="text-yellow-400 font-mono text-xs">🪙 {user?.coins ?? 0} coins</div>
          </div>
          {user?.isGM && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-md font-mono">GM</span>}
        </div>
        <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white text-xs font-mono border border-gray-700 px-3 py-1 rounded-lg hover:border-gray-400">
          Logout
        </button>
      </div>

      <img src="/assets/Metal_Slug/Title.gif" alt="KidSlug Warriors" className="my-4 h-16 object-contain" />
      <h1 className="text-yellow-400 font-mono text-3xl font-black mb-1">KIDSLUG WARRIORS</h1>
      <p className="text-gray-400 font-mono text-xs mb-6">Best: {(user?.highScore ?? 0).toLocaleString()} | Stages Cleared: {user?.stagesCleared ?? 0}</p>

      {/* Stage Select */}
      <div className="w-full max-w-2xl mb-6">
        <h2 className="text-yellow-300 font-mono text-lg font-bold mb-3">SELECT STAGE</h2>
        <div className="grid grid-cols-2 gap-3">
          {STAGES.map(stage => {
            const locked = stage.id > 1 && (user?.stagesCleared ?? 0) < stage.id - 1;
            return (
              <button key={stage.id} onClick={() => !locked && setSelectedStage(stage.id)}
                disabled={locked}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  selectedStage === stage.id
                    ? 'border-yellow-500 bg-yellow-500/20 scale-105'
                    : locked
                    ? 'border-gray-700 bg-gray-900/50 opacity-40 cursor-not-allowed'
                    : 'border-gray-600 bg-gray-900/60 hover:border-yellow-500/60'
                }`}>
                <div className="text-yellow-300 font-mono text-xs font-bold">STAGE {stage.id}</div>
                <div className="text-white font-mono text-sm font-bold">{stage.name}</div>
                <div className="text-green-400 font-mono text-xs mt-1">🪙 +{stage.coinReward}</div>
                {locked && <div className="absolute inset-0 flex items-center justify-center text-2xl">🔒</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action buttons */}
      <div className="w-full max-w-2xl grid grid-cols-2 gap-3 mb-3">
        <button onClick={() => setScreen('game')}
          className="col-span-2 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-black text-xl rounded-xl shadow-lg shadow-yellow-500/30 transition-transform hover:scale-105">
          🎮 PLAY STAGE {selectedStage}
        </button>
        <button onClick={() => setScreen('shop')}
          className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-mono font-bold rounded-xl border border-gray-600">
          🏪 SHOP
        </button>
        <button onClick={() => setScreen('leaderboard')}
          className="py-3 bg-gray-800 hover:bg-gray-700 text-white font-mono font-bold rounded-xl border border-gray-600">
          🏆 LEADERBOARD
        </button>
        {user?.isGM && (
          <button onClick={() => setScreen('gm')}
            className="col-span-2 py-3 bg-red-900 hover:bg-red-800 text-red-300 font-mono font-bold rounded-xl border border-red-700">
            ⚙️ GM PANEL
          </button>
        )}
      </div>

      {/* Controls guide */}
      <div className="w-full max-w-2xl bg-black/40 border border-gray-700 rounded-xl p-3 mt-2">
        <p className="text-gray-400 font-mono text-xs font-bold mb-2">KEYBOARD CONTROLS</p>
        <div className="grid grid-cols-3 gap-1 text-xs font-mono text-gray-400">
          <span>← → / A D = Move</span>
          <span>Space/W = Jump</span>
          <span>S/↓ = Crouch</span>
          <span>J = Shoot</span>
          <span>E/Q = Switch Weapon</span>
          <span>W = Aim Up</span>
        </div>
      </div>
    </div>
  );
}
