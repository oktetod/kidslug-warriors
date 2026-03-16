import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getLeaderboard } from '../firebase/db';
import type { LeaderboardEntry } from '../types';

export function LeaderboardScreen() {
  const { setScreen, user } = useGameStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(20).then(e => { setEntries(e); setLoading(false); });
  }, []);

  return (
    <div className="ui-screen min-h-screen bg-gradient-to-b from-[#0a0a1e] to-[#1a1a3e] flex flex-col items-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between pt-4 pb-6">
          <button onClick={() => setScreen('menu')} className="text-gray-400 hover:text-white font-mono text-sm">← Back</button>
          <h1 className="text-yellow-400 font-mono text-2xl font-black">🏆 LEADERBOARD</h1>
          <div className="w-16" />
        </div>

        {loading ? (
          <div className="text-center text-yellow-400 font-mono py-20 animate-pulse">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-500 font-mono py-20">No scores yet. Be the first!</div>
        ) : (
          <div className="space-y-2">
            {entries.map((e, i) => {
              const isMe = e.uid === user?.uid;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
              return (
                <div key={e.uid} className={`flex items-center gap-4 p-3 rounded-xl border ${
                  isMe ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700/50 bg-black/40'
                }`}>
                  <div className="text-xl w-8 text-center font-mono">{medal}</div>
                  <img src={e.photoURL || '/assets/Metal_Slug/Player/PlayerLeft.png'} className="w-8 h-8 rounded-full object-cover border border-gray-600" alt="" />
                  <div className="flex-1">
                    <div className="text-white font-mono text-sm font-bold">{e.displayName} {isMe && '(You)'}</div>
                    <div className="text-gray-400 font-mono text-xs">Stages: {e.stagesCleared}</div>
                  </div>
                  <div className="text-yellow-400 font-mono font-bold text-lg">{e.score.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
