import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy, faCrown, faChartBar } from "@fortawesome/free-solid-svg-icons";

export default function Results() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      try {
        const res = await api.get(`/games/${roomId}/summary`);
        if (!cancelled) setSummary(res.data);
      } catch {
        if (!cancelled) setError("Results not available yet or game not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh] text-slate-400">
          Loading results...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
          <p className="text-slate-400">{error}</p>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Game Results</h1>
            <p className="text-slate-400 text-sm">
              {summary.total_questions} questions · {summary.leaderboard.length}{" "}
              players
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
          >
            ← Dashboard
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Final Leaderboard */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              <FontAwesomeIcon icon={faTrophy} className="mr-2 text-yellow-400" /> Final Leaderboard
            </h2>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
              {summary.leaderboard.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No players</p>
              ) : (
                <div className="space-y-2">
                  {summary.leaderboard.map((entry) => (
                    <div
                      key={entry.player_id}
                      className="flex items-center justify-between py-3 px-4 bg-slate-900 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            entry.rank === 1
                              ? "bg-yellow-500 text-slate-900 text-lg"
                              : entry.rank === 2
                              ? "bg-slate-400 text-slate-900"
                              : entry.rank === 3
                              ? "bg-amber-700 text-white"
                              : "bg-slate-700 text-slate-300 text-sm"
                          }`}
                        >
                          {entry.rank === 1 ? <FontAwesomeIcon icon={faCrown} /> : entry.rank}
                        </span>
                        <span className="text-white font-medium">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-cyan-400 font-mono font-bold text-lg">
                        {entry.score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Question Stats */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">
              <FontAwesomeIcon icon={faChartBar} className="mr-2 text-cyan-400" /> Question Stats
            </h2>
            <div className="space-y-3">
              {summary.question_results.map((q) => {
                const pct =
                  q.total_answers > 0
                    ? Math.round((q.correct_answers / q.total_answers) * 100)
                    : 0;
                return (
                  <div
                    key={q.question_index}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">
                        Question {q.question_index + 1}
                      </span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          pct >= 70
                            ? "text-green-400"
                            : pct >= 40
                            ? "text-yellow-400"
                            : "text-red-400"
                        }`}
                      >
                        {pct}% correct
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-900 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            pct >= 70
                              ? "bg-green-500"
                              : pct >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-xs shrink-0">
                        {q.correct_answers}/{q.total_answers}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
