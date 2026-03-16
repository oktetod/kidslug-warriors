import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { WEAPONS, WEAPON_ORDER } from '../game/constants';
import { buyWeapon } from '../firebase/db';
import type { WeaponId } from '../types';

export function ShopScreen() {
  const { user, setScreen, updateUserCoins, addOwnedWeapon } = useGameStore();
  const [msg, setMsg] = useState('');
  const [buying, setBuying] = useState(false);

  const handleBuy = async (weaponId: WeaponId, price: number) => {
    if (!user) return;
    if (user.coins < price) { setMsg('❌ Not enough coins!'); return; }
    if (user.ownedWeapons.includes(weaponId)) { setMsg('✅ Already owned!'); return; }
    setBuying(true);
    try {
      await buyWeapon(user.uid, weaponId, price);
      updateUserCoins(-price);
      addOwnedWeapon(weaponId);
      setMsg(`✅ ${WEAPONS[weaponId].name} purchased!`);
    } catch (e) {
      setMsg('❌ Purchase failed.');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="ui-screen min-h-screen bg-gradient-to-b from-[#0a0a1e] to-[#1a1a3e] flex flex-col items-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between pt-4 pb-6">
          <button onClick={() => setScreen('menu')} className="text-gray-400 hover:text-white font-mono text-sm flex items-center gap-2">
            ← Back
          </button>
          <h1 className="text-yellow-400 font-mono text-2xl font-black">🏪 WEAPON SHOP</h1>
          <div className="text-yellow-300 font-mono font-bold">🪙 {user?.coins ?? 0}</div>
        </div>

        {msg && (
          <div className="mb-4 py-2 px-4 bg-gray-800 border border-gray-600 rounded-xl text-center font-mono text-sm text-white">
            {msg}
          </div>
        )}

        {/* How to get coins */}
        <div className="mb-4 bg-yellow-900/30 border border-yellow-500/40 rounded-xl p-3">
          <p className="text-yellow-300 font-mono text-xs font-bold">💡 HOW TO EARN COINS</p>
          <p className="text-yellow-200/70 font-mono text-xs mt-1">Clear stages, kill enemies, ask GM for top-up!</p>
        </div>

        <div className="grid gap-4">
          {WEAPON_ORDER.map(wid => {
            const w = WEAPONS[wid];
            const owned = user?.ownedWeapons?.includes(w.id) ?? false;
            const canAfford = (user?.coins ?? 0) >= w.price;

            return (
              <div key={wid} className={`bg-black/50 border rounded-xl p-4 flex items-center gap-4 ${
                owned ? 'border-green-500/50' : canAfford ? 'border-yellow-500/40' : 'border-gray-700'
              }`}>
                <div className="text-4xl w-12 text-center">{w.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold">{w.name}</span>
                    {w.isDefault && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-mono">DEFAULT</span>}
                    {owned && !w.isDefault && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-mono">OWNED</span>}
                  </div>
                  <p className="text-gray-400 font-mono text-xs mt-1">{w.description}</p>
                  <div className="flex gap-3 mt-2 text-xs font-mono">
                    <span className="text-red-400">DMG: {w.damage}</span>
                    <span className="text-blue-400">SPD: {Math.round(1000 / w.fireRate * 10) / 10}/s</span>
                    {w.isExplosive && <span className="text-orange-400">💥 AOE: {w.splashRadius}</span>}
                    {w.spreadCount && <span className="text-purple-400">×{w.spreadCount} spread</span>}
                    {w.range && <span className="text-green-400">🗡 Melee</span>}
                  </div>
                </div>
                <div className="text-right">
                  {w.isDefault || owned ? (
                    <div className="text-green-400 font-mono text-sm font-bold">{owned ? '✅ OWNED' : 'FREE'}</div>
                  ) : (
                    <button onClick={() => handleBuy(w.id, w.price)} disabled={buying || !canAfford}
                      className={`px-4 py-2 rounded-xl font-mono font-bold text-sm transition-colors ${
                        canAfford
                          ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}>
                      🪙 {w.price}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
