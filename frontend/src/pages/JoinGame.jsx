import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function JoinGame() {
  const { roomCode: urlCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState(urlCode || "");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);

  async function handleCheckRoom(e) {
    e.preventDefault();
    setError("");
    if (!code.trim()) return;

    setLoading(true);
    try {
      const res = await api.post(`/rooms/join/${code.toUpperCase()}`);
      setRoomInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Room not found");
    } finally {
      setLoading(false);
    }
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter your name");
      return;
    }
    navigate(
      `/game/${roomInfo.room_id}?name=${encodeURIComponent(name.trim())}`
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🧠</p>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-cyan-400 bg-clip-text text-transparent">
            QuizHub
          </h1>
          <p className="text-slate-400 text-sm mt-1">Join a live quiz</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {!roomInfo ? (
            // Step 1: Enter room code
            <form onSubmit={handleCheckRoom} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">
                  Room Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABC123"
                  autoFocus
                  className="w-full px-4 py-4 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono font-bold tracking-[0.3em] uppercase outline-none focus:border-violet-500 transition placeholder:text-slate-600 placeholder:text-lg placeholder:tracking-widest"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
              >
                {loading ? "Checking..." : "Find Room"}
              </button>
            </form>
          ) : (
            // Step 2: Enter name
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-slate-400 text-sm">Joining room</p>
                <p className="text-white font-mono font-bold text-xl tracking-widest">
                  {roomInfo.room_code}
                </p>
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-1.5">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="Enter your name"
                  autoFocus
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-lg outline-none focus:border-violet-500 transition placeholder:text-slate-600"
                />
              </div>

              <button
                type="submit"
                disabled={!name.trim()}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition"
              >
                Join Game
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoomInfo(null);
                  setError("");
                }}
                className="w-full py-2 text-slate-500 hover:text-slate-300 text-sm transition"
              >
                ← Different code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
