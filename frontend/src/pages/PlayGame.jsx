import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";

export default function PlayGame() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const playerName = searchParams.get("name") || "Anonymous";
  const navigate = useNavigate();

  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  // Game state
  const [phase, setPhase] = useState("waiting"); // waiting | question | answered | results | gameover
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

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

    const wsUrl = import.meta.env.DEV
      ? `ws://localhost:5173/ws/play/${roomId}`
      : `wss://quizhub.uz/ws/play/${roomId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ action: "join", name: playerName }));
    };

    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);

      switch (data.event) {
        case "joined":
          setJoined(true);
          setPlayerId(data.player_id);
          break;

        case "question_start":
          setPhase("question");
          setCurrentQuestion(data.question);
          setSelectedOption(null);
          setAnswerResult(null);
          startTimer(data.question.time_limit);
          break;

        case "answer_accepted":
          setPhase("answered");
          setAnswerResult(data);
          stopTimer();
          break;

        case "question_results":
          setPhase("results");
          setLeaderboard(data.leaderboard || []);
          stopTimer();
          break;

        case "game_over":
          setPhase("gameover");
          setLeaderboard(data.leaderboard || []);
          stopTimer();
          break;

        case "host_closed":
          navigate("/");
          break;

        // case "host_disconnected":
        //   alert("Host disconnected");
        //   navigate("/");
        //   break;

        case "error":
          alert(data.message);
          break;
      }
    };

    return () => ws.close();
  }, [roomId, playerName, startTimer, stopTimer, navigate]);

  // Cleanup timer
  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  function sendAnswer(optionId) {
    if (wsRef.current?.readyState === WebSocket.OPEN && !selectedOption) {
      setSelectedOption(optionId);
      wsRef.current.send(
        JSON.stringify({ action: "answer", option_id: optionId })
      );
    }
  }

  function getMyRank() {
    const entry = leaderboard.find((e) => e.player_id === playerId);
    return entry || null;
  }

  const optionColors = [
    { bg: "bg-red-500", hover: "hover:bg-red-600", border: "border-red-500" },
    {
      bg: "bg-blue-500",
      hover: "hover:bg-blue-600",
      border: "border-blue-500",
    },
    {
      bg: "bg-yellow-500",
      hover: "hover:bg-yellow-600",
      border: "border-yellow-500",
    },
    {
      bg: "bg-green-500",
      hover: "hover:bg-green-600",
      border: "border-green-500",
    },
  ];

  // ── NOT CONNECTED ──
  if (!connected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Connecting...</p>
        </div>
      </div>
    );
  }

  // ── WAITING ──
  if (phase === "waiting") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-6">
            {playerName[0].toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{playerName}</h2>
          <p className="text-slate-400 mb-6">
            {joined
              ? "You're in! Waiting for the host to start..."
              : "Joining..."}
          </p>
          <div className="flex justify-center">
            <div className="animate-pulse flex gap-2">
              <div className="w-3 h-3 bg-violet-500 rounded-full" />
              <div className="w-3 h-3 bg-violet-500 rounded-full" />
              <div className="w-3 h-3 bg-violet-500 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── QUESTION ──
  if (phase === "question") {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Timer bar */}
        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-slate-400 text-sm">
            Q{currentQuestion.question_index + 1}/
            {currentQuestion.total_questions}
          </p>
          <div
            className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
              timeLeft <= 5 ? "border-red-500" : "border-violet-500"
            }`}
          >
            <span
              className={`text-lg font-bold font-mono ${
                timeLeft <= 5 ? "text-red-400" : "text-white"
              }`}
            >
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-4">
          <h2 className="text-white text-xl font-bold text-center">
            {currentQuestion.text}
          </h2>
        </div>

        {/* Options */}
        <div className="flex-1 px-4 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3 content-center">
          {currentQuestion.options.map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => sendAnswer(opt.id)}
              disabled={!!selectedOption}
              className={`p-6 rounded-2xl text-white text-lg font-semibold transition transform active:scale-95 ${
                selectedOption === opt.id
                  ? `${optionColors[i].bg} ring-4 ring-white/30 scale-95`
                  : selectedOption
                  ? `${optionColors[i].bg} opacity-40`
                  : `${optionColors[i].bg} ${optionColors[i].hover}`
              }`}
            >
              {opt.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── ANSWERED (waiting for results) ──
  if (phase === "answered" && answerResult) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div
            className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 ${
              answerResult.is_correct ? "bg-green-500/20" : "bg-red-500/20"
            }`}
          >
            {answerResult.is_correct ? "✅" : "❌"}
          </div>
          <h2
            className={`text-3xl font-bold mb-2 ${
              answerResult.is_correct ? "text-green-400" : "text-red-400"
            }`}
          >
            {answerResult.is_correct ? "Correct!" : "Wrong!"}
          </h2>
          <p className="text-white text-xl font-bold mb-1">
            +{answerResult.points} points
          </p>
          <p className="text-slate-400 text-sm">{answerResult.time_spent}s</p>
          <p className="text-slate-500 text-sm mt-4">Waiting for results...</p>
        </div>
      </div>
    );
  }

  // ── RESULTS ──
  if (phase === "results") {
    const myRank = getMyRank();
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* My position */}
          {myRank && (
            <div className="text-center mb-6">
              <p className="text-slate-400 text-sm">Your position</p>
              <p className="text-4xl font-bold text-white">#{myRank.rank}</p>
              <p className="text-cyan-400 font-mono font-bold text-xl">
                {myRank.score} pts
              </p>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((entry) => (
                <div
                  key={entry.player_id}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                    entry.player_id === playerId
                      ? "bg-violet-500/20 border border-violet-500/30"
                      : "bg-slate-900"
                  }`}
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
                      {entry.name} {entry.player_id === playerId && "(you)"}
                    </span>
                  </div>
                  <span className="text-cyan-400 font-mono font-bold">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-sm text-center mt-4">
            Next question coming up...
          </p>
        </div>
      </div>
    );
  }

  // ── GAME OVER ──
  // if (phase === "gameover") {
  //   const myRank = getMyRank();
  //   return (
  //     <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
  //       <div className="w-full max-w-md text-center">
  //         <p className="text-5xl mb-4">🏆</p>
  //         <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>

  //         {myRank && (
  //           <div className="mb-6">
  //             <p className="text-slate-400">You finished</p>
  //             <p className="text-5xl font-bold text-white mb-1">
  //               #{myRank.rank}
  //             </p>
  //             <p className="text-cyan-400 font-mono font-bold text-2xl">
  //               {myRank.score} pts
  //             </p>
  //           </div>
  //         )}

  //         {/* Final Leaderboard */}
  //         <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6 text-left">
  //           <div className="space-y-2">
  //             {leaderboard.map((entry) => (
  //               <div
  //                 key={entry.player_id}
  //                 className={`flex items-center justify-between py-3 px-4 rounded-xl ${
  //                   entry.player_id === playerId
  //                     ? "bg-violet-500/20 border border-violet-500/30"
  //                     : "bg-slate-900"
  //                 }`}
  //               >
  //                 <div className="flex items-center gap-3">
  //                   <span
  //                     className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
  //                       entry.rank === 1
  //                         ? "bg-yellow-500 text-slate-900"
  //                         : entry.rank === 2
  //                         ? "bg-slate-400 text-slate-900"
  //                         : entry.rank === 3
  //                         ? "bg-amber-700 text-white"
  //                         : "bg-slate-700 text-slate-300"
  //                     }`}
  //                   >
  //                     {entry.rank === 1 ? "👑" : entry.rank}
  //                   </span>
  //                   <span className="text-white font-medium">
  //                     {entry.name} {entry.player_id === playerId && "(you)"}
  //                   </span>
  //                 </div>
  //                 <span className="text-cyan-400 font-mono font-bold">
  //                   {entry.score}
  //                 </span>
  //               </div>
  //             ))}
  //           </div>
  //         </div>

  //         <button
  //           onClick={() => navigate("/")}
  //           className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-base font-semibold transition"
  //         >
  //           Back to Home
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }
  {
    /* ── GAME OVER ── */
  }
  {
    phase === "gameover" && (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-5xl mb-4">🏆</p>
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>

          {getMyRank() && (
            <div className="mb-6">
              <p className="text-slate-400">You finished</p>
              <p className="text-5xl font-bold text-white mb-1">
                #{getMyRank().rank}
              </p>
              <p className="text-cyan-400 font-mono font-bold text-2xl">
                {getMyRank().score} pts
              </p>
            </div>
          )}

          {/* Final Leaderboard */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 mb-6 text-left">
            <div className="space-y-2">
              {leaderboard.map((entry) => (
                <div
                  key={entry.player_id}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                    entry.player_id === playerId
                      ? "bg-violet-500/20 border border-violet-500/30"
                      : "bg-slate-900"
                  }`}
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
                      {entry.rank === 1 ? "👑" : entry.rank}
                    </span>
                    <span className="text-white font-medium">
                      {entry.name} {entry.player_id === playerId && "(you)"}
                    </span>
                  </div>
                  <span className="text-cyan-400 font-mono font-bold">
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-500 text-sm">
            Waiting for host to close the game...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
