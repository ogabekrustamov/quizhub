import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const res = await api.get("/history/");
        if (!cancelled) setHistory(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh] text-slate-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Game History</h1>
          <p className="text-slate-400 text-sm">
            {history.length} games played
          </p>
        </div>

        {history.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <p className="text-5xl mb-4">🎮</p>
            <p className="text-slate-400 text-lg mb-2">No games played yet</p>
            <p className="text-slate-500 text-sm mb-6">
              Host a game and complete it to see results here
            </p>
            <Link
              to="/rooms"
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
            >
              Create a Room
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((game) => (
                <div
                  key={game.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-medium">
                        {game.total_questions} questions · {game.player_count}{" "}
                        players
                      </p>
                      <p className="text-slate-400 text-sm">
                        {new Date(game.played_at).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      to={`/results/${game.room_id}`}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                    >
                      View Results
                    </Link>
                  </div>

                  {/* Top 3 */}
                  {game.results_json?.leaderboard?.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">
                        Top players:
                      </span>
                      {game.results_json.leaderboard.slice(0, 3).map((p, i) => (
                        <span
                          key={p.player_id}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            i === 0
                              ? "bg-yellow-500/20 text-yellow-400"
                              : i === 1
                              ? "bg-slate-500/20 text-slate-400"
                              : "bg-amber-700/20 text-amber-600"
                          }`}
                        >
                          {i === 0 ? "👑" : `#${i + 1}`} {p.name} · {p.score}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
