import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function HostGame() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // Game state
  const [phase, setPhase] = useState("lobby"); // lobby | question | results | gameover
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionResults, setQuestionResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answersCount, setAnswersCount] = useState(0);
  const [initialized, setInitialized] = useState(false);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  // Fetch room info
  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        const res = await api.get(`/rooms/${roomId}`);
        if (!cancelled) setRoom(res.data);
      } catch {
        alert("Room not found");
        navigate("/dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoom();
    return () => {
      cancelled = true;
    };
  }, [roomId, navigate]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(
    (seconds) => {
      stopTimer();
      setTimeLeft(seconds);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stopTimer]
  );

  // WebSocket connection
  useEffect(() => {
    if (!roomId) return;

    // const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    // const wsUrl = `${protocol}//${window.location.host}/ws/host/${roomId}`;
    const wsUrl = import.meta.env.DEV
      ? `ws://localhost:5173/ws/host/${roomId}`
      : `wss://quizhub.uz/ws/host/${roomId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    // ws.onopen = () => setConnected(true);
    ws.onopen = () => {
      setConnected(true);
      setTimeout(() => {
        ws.send(JSON.stringify({ action: "init" }));
      }, 500);
    };
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.event) {
        case "room_initialized":
          setInitialized(true);
          setPlayers(data.players || []);
          break;
        case "player_joined":
          setPlayers(data.players || []);
          break;
        case "player_left":
          setPlayers(data.players || []);
          break;
        case "question_start":
          setPhase("question");
          setCurrentQuestion(data.question);
          setAnswersCount(0);
          setQuestionResults(null);
          startTimer(data.question.time_limit);
          break;
        case "answer_received":
          setAnswersCount(data.answers_count);
          break;
        case "question_results":
          setPhase("results");
          setQuestionResults(data);
          setLeaderboard(data.leaderboard || []);
          stopTimer();
          break;
        case "game_over":
          setPhase("gameover");
          setLeaderboard(data.leaderboard || []);
          stopTimer();
          break;
        case "error":
          alert(data.message);
          break;
      }
    };

    return () => ws.close();
  }, [roomId, startTimer, stopTimer]);

  function send(action) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action }));
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading room...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
            QuizHub
          </h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-slate-400 text-sm">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Room Code
            </p>
            <p className="text-white font-mono font-bold text-xl tracking-widest">
              {room?.room_code}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-500 text-xs uppercase tracking-wider">
              Players
            </p>
            <p className="text-white font-bold text-xl">{players.length}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* ── LOBBY ── */}
        {phase === "lobby" && (
          <div className="text-center">
            <div className="mb-8">
              <p className="text-slate-400 text-lg mb-2">
                Share this code with players
              </p>
              <div className="inline-block bg-slate-800 border border-slate-700 rounded-2xl px-12 py-6">
                <p className="text-white font-mono font-bold text-5xl tracking-[0.3em]">
                  {room?.room_code}
                </p>
              </div>
              <p className="text-slate-500 text-sm mt-3">
                Players join at{" "}
                <span className="text-violet-400">
                  {window.location.origin}/join/{room?.room_code}
                </span>
              </p>
            </div>

            {/* Players list */}
            <div className="mb-8">
              <h2 className="text-white font-semibold mb-4">
                {players.length === 0
                  ? "Waiting for players..."
                  : `Players (${players.length})`}
              </h2>
              {players.length === 0 ? (
                <div className="flex justify-center">
                  <div className="animate-pulse flex gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full" />
                    <div className="w-3 h-3 bg-violet-500 rounded-full animation-delay-200" />
                    <div className="w-3 h-3 bg-violet-500 rounded-full animation-delay-400" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  {players.map((p) => (
                    <div
                      key={p.id}
                      className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-3"
                    >
                      <p className="text-white font-medium">{p.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Controls
            <div className="flex justify-center gap-3">
              {!initialized ? (
                <button
                  onClick={() => send("init")}
                  disabled={!connected}
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl text-base font-semibold transition"
                >
                  Initialize Game
                </button>
              ) : (
                <button
                  onClick={() => send("next_question")}
                  disabled={!connected || players.length === 0}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-base font-semibold transition"
                >
                  Start Game
                </button>
              )}
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-base font-semibold transition"
              >
                Leave
              </button>
            </div> */}
            {/* Controls */}
            <div className="flex justify-center gap-3">
              {!initialized ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="animate-spin w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full" />
                  <span>Initializing...</span>
                </div>
              ) : (
                <button
                  onClick={() => send("next_question")}
                  disabled={!connected || players.length === 0}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-base font-semibold transition"
                >
                  {players.length === 0
                    ? "Waiting for players..."
                    : "Start Game"}
                </button>
              )}
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-base font-semibold transition"
              >
                Leave
              </button>
            </div>
          </div>
        )}

        {/* ── QUESTION ── */}
        {phase === "question" && currentQuestion && (
          <div>
            {/* Timer + Progress */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400 text-sm">
                Question {currentQuestion.question_index + 1} of{" "}
                {currentQuestion.total_questions}
              </p>
              <div className="flex items-center gap-4">
                <p className="text-slate-400 text-sm">
                  {answersCount} / {players.length} answered
                </p>
                <div
                  className={`w-16 h-16 rounded-full border-4 flex items-center justify-center ${
                    timeLeft <= 5 ? "border-red-500" : "border-violet-500"
                  }`}
                >
                  <span
                    className={`text-xl font-bold font-mono ${
                      timeLeft <= 5 ? "text-red-400" : "text-white"
                    }`}
                  >
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>

            {/* Question */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 mb-6 text-center">
              <p className="text-white text-2xl font-bold">
                {currentQuestion.text}
              </p>
            </div>

            {/* Options preview */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {currentQuestion.options.map((opt, i) => {
                const colors = [
                  "bg-red-500/20 border-red-500/40",
                  "bg-blue-500/20 border-blue-500/40",
                  "bg-yellow-500/20 border-yellow-500/40",
                  "bg-green-500/20 border-green-500/40",
                ];
                return (
                  <div
                    key={opt.id}
                    className={`p-5 border rounded-xl ${colors[i]}`}
                  >
                    <p className="text-white font-medium">{opt.text}</p>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="flex justify-center">
              <button
                onClick={() => send("show_results")}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-xl text-base font-semibold transition"
              >
                Show Results
              </button>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase === "results" && questionResults && (
          <div>
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm mb-1">
                Question {questionResults.question_index + 1} Results
              </p>
              <p className="text-white text-lg">
                {questionResults.stats.correct_answers} /{" "}
                {questionResults.stats.total_answers} correct
              </p>
            </div>

            {/* Leaderboard */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 max-w-lg mx-auto">
              <h3 className="text-white font-semibold mb-4 text-center">
                Leaderboard
              </h3>
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.player_id}
                    className="flex items-center justify-between py-3 px-4 bg-slate-900 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-500 text-slate-900"
                            : entry.rank === 2
                            ? "bg-slate-400 text-slate-900"
                            : entry.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {entry.rank}
                      </span>
                      <span className="text-white font-medium">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center">
              <button
                onClick={() => send("next_question")}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-base font-semibold transition"
              >
                Next Question
              </button>
            </div>
          </div>
        )}

        {/* ── GAME OVER ── */}
        {phase === "gameover" && (
          <div className="text-center">
            <div className="mb-8">
              <p className="text-5xl mb-4">🏆</p>
              <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
              <p className="text-slate-400">Here are the final results</p>
            </div>

            {/* Final Leaderboard */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 max-w-lg mx-auto">
              <div className="space-y-2">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.player_id}
                    className="flex items-center justify-between py-4 px-5 bg-slate-900 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ${
                          entry.rank === 1
                            ? "bg-yellow-500 text-slate-900"
                            : entry.rank === 2
                            ? "bg-slate-400 text-slate-900"
                            : entry.rank === 3
                            ? "bg-amber-700 text-white"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {entry.rank === 1 ? "👑" : entry.rank}
                      </span>
                      <span className="text-white font-semibold text-lg">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-cyan-400 font-mono font-bold text-lg">
                      {entry.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button
                onClick={() => navigate(`/results/${roomId}`)}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-base font-semibold transition"
              >
                View Details
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-base font-semibold transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
