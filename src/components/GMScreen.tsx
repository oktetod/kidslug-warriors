import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { gmAddCoins, gmBanUser, gmSetGM, getAllPlayers, searchPlayer } from '../firebase/db';
import { ADMIN_UIDS } from '../firebase/config';
import type { PlayerData } from '../types';

export function GMScreen() {
  const { user, setScreen } = useGameStore();
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<PlayerData | null>(null);
  const [topupUid, setTopupUid] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [topupReason, setTopupReason] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAllPlayers().then(setPlayers);
  }, []);

  if (!user?.isGM) return (
    <div className="ui-screen min-h-screen bg-[#0a0a1e] flex items-center justify-center text-red-500 font-mono text-2xl">
      🚫 Access Denied
    </div>
  );

  const isSuperAdmin = ADMIN_UIDS.includes(user.uid);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleSearch = async () => {
    const p = await searchPlayer(searchEmail);
    setSearchResult(p);
    if (!p) showMsg('❌ Player not found');
  };

  const handleTopup = async () => {
    if (!topupUid || !topupAmount) return;
    setLoading(true);
    try {
      await gmAddCoins(user.uid, topupUid, parseInt(topupAmount), topupReason || 'GM top-up');
      showMsg(`✅ Added ${topupAmount} coins!`);
      setTopupAmount(''); setTopupReason('');
      getAllPlayers().then(setPlayers);
    } catch (e: unknown) { showMsg('❌ ' + (e as Error).message); }
    setLoading(false);
  };

  const handleBan = async (targetUid: string, ban: boolean) => {
    try {
      await gmBanUser(user.uid, targetUid, ban);
      showMsg(`✅ User ${ban ? 'banned' : 'unbanned'}`);
      getAllPlayers().then(setPlayers);
    } catch (e: unknown) { showMsg('❌ ' + (e as Error).message); }
  };

  const handleSetGM = async (targetUid: string, isGM: boolean) => {
    try {
      await gmSetGM(user.uid, targetUid, isGM);
      showMsg(`✅ GM status updated`);
      getAllPlayers().then(setPlayers);
    } catch (e: unknown) { showMsg('❌ ' + (e as Error).message); }
  };

  return (
    <div className="ui-screen min-h-screen bg-gradient-to-b from-[#0a0a1e] to-[#1a1a3e] p-4 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between pt-4 pb-6">
          <button onClick={() => setScreen('menu')} className="text-gray-400 hover:text-white font-mono text-sm">← Back</button>
          <h1 className="text-red-400 font-mono text-2xl font-black">⚙️ GM PANEL</h1>
          <span className="text-red-500 font-mono text-xs">{isSuperAdmin ? '👑 SUPER ADMIN' : 'GM'}</span>
        </div>

        {msg && <div className="mb-4 py-2 px-4 bg-gray-800 border border-gray-600 rounded-xl text-center font-mono text-sm text-white">{msg}</div>}

        {/* Search */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-4 mb-4">
          <h2 className="text-yellow-300 font-mono text-sm font-bold mb-3">🔍 SEARCH PLAYER</h2>
          <div className="flex gap-2">
            <input value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="player@email.com"
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-500" />
            <button onClick={handleSearch} className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold font-mono rounded-lg text-sm">Search</button>
          </div>
          {searchResult && (
            <div className="mt-3 p-3 bg-gray-900 rounded-lg">
              <p className="text-white font-mono text-sm"><b>{searchResult.displayName}</b> ({searchResult.email})</p>
              <p className="text-yellow-400 font-mono text-xs">UID: {searchResult.uid}</p>
              <p className="text-green-400 font-mono text-xs">Coins: {searchResult.coins} | Score: {searchResult.highScore}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setTopupUid(searchResult.uid)} className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded font-mono">Top-up This User</button>
                <button onClick={() => handleBan(searchResult.uid, !searchResult.isBanned)} className={`text-xs px-3 py-1 rounded font-mono ${searchResult.isBanned ? 'bg-green-700 hover:bg-green-600' : 'bg-red-700 hover:bg-red-600'} text-white`}>
                  {searchResult.isBanned ? 'Unban' : 'Ban'}
                </button>
                {isSuperAdmin && (
                  <button onClick={() => handleSetGM(searchResult.uid, !searchResult.isGM)} className="text-xs px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded font-mono">
                    {searchResult.isGM ? 'Remove GM' : 'Make GM'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top-up */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-4 mb-4">
          <h2 className="text-yellow-300 font-mono text-sm font-bold mb-3">💰 TOP-UP COINS</h2>
          <div className="space-y-2">
            <input value={topupUid} onChange={e => setTopupUid(e.target.value)} placeholder="Player UID"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-500" />
            <div className="flex gap-2">
              <input value={topupAmount} onChange={e => setTopupAmount(e.target.value)} placeholder="Amount" type="number"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-500" />
              <input value={topupReason} onChange={e => setTopupReason(e.target.value)} placeholder="Reason"
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-yellow-500" />
            </div>
            <button onClick={handleTopup} disabled={loading || !topupUid || !topupAmount}
              className="w-full py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold font-mono rounded-lg text-sm">
              {loading ? 'Processing...' : '💰 Add Coins'}
            </button>
          </div>
        </div>

        {/* All Players */}
        <div className="bg-black/50 border border-gray-700 rounded-xl p-4">
          <h2 className="text-yellow-300 font-mono text-sm font-bold mb-3">👥 ALL PLAYERS ({players.length})</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {players.map(p => (
              <div key={p.uid} className={`flex items-center justify-between p-2 rounded-lg ${p.isBanned ? 'bg-red-900/30 border border-red-700/50' : 'bg-gray-900/50'}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono text-xs font-bold truncate">{p.displayName}</span>
                    {p.isGM && <span className="text-xs bg-red-600 text-white px-1 rounded font-mono">GM</span>}
                    {p.isBanned && <span className="text-xs bg-gray-600 text-white px-1 rounded font-mono">BANNED</span>}
                  </div>
                  <span className="text-gray-400 font-mono text-xs truncate block">{p.email}</span>
                  <span className="text-yellow-400 font-mono text-xs">🪙 {p.coins} | Score: {p.highScore}</span>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => setTopupUid(p.uid)} className="text-xs px-2 py-1 bg-blue-800 hover:bg-blue-700 text-white rounded font-mono">+💰</button>
                  <button onClick={() => handleBan(p.uid, !p.isBanned)} className={`text-xs px-2 py-1 rounded font-mono ${p.isBanned ? 'bg-green-800 hover:bg-green-700' : 'bg-red-800 hover:bg-red-700'} text-white`}>
                    {p.isBanned ? '✓' : 'Ban'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
