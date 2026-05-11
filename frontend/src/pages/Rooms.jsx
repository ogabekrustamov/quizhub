import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Rooms() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create room flow
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Active room detail
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [rRes, cRes] = await Promise.all([
          api.get("/rooms/"),
          api.get("/collections/"),
        ]);
        if (!cancelled) {
          setRooms(rRes.data);
          setCollections(cRes.data);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshRooms() {
    const res = await api.get("/rooms/");
    setRooms(res.data);
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    setCreateError("");

    if (!selectedCollectionId) {
      setCreateError("Please select a collection");
      return;
    }

    setCreating(true);
    try {
      const res = await api.post("/rooms/", {
        collection_id: selectedCollectionId,
        save_as_collection: false,
      });
      setShowCreate(false);
      setSelectedCollectionId("");
      await refreshRooms();
      setActiveRoom(res.data);
    } catch (err) {
      setCreateError(err.response?.data?.detail || "Failed to create room");
    } finally {
      setCreating(false);
    }
  }

  async function openRoom(room) {
    try {
      const res = await api.get(`/rooms/${room.id}`);
      setActiveRoom(res.data);
    } catch {
      alert("Failed to load room");
    }
  }

  const joinLink = activeRoom
    ? `${window.location.origin}/join/${activeRoom.room_code}`
    : "";

  function copyLink() {
    navigator.clipboard.writeText(joinLink);
    alert("Link copied!");
  }

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

  // ── Room Detail ──
  if (activeRoom) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />

        <div className="max-w-2xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Room</h1>
              <StatusBadge status={activeRoom.status} />
            </div>
            <button
              onClick={() => setActiveRoom(null)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm transition"
            >
              ← Back
            </button>
          </div>

          {/* Room Code */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center mb-6">
            <p className="text-slate-400 text-sm mb-2">Room Code</p>
            <p className="text-white font-mono font-bold text-6xl tracking-[0.3em] mb-4">
              {activeRoom.room_code}
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Share this code with players
            </p>

            {/* Direct link */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 mb-3">
              <p className="text-slate-400 text-sm flex-1 truncate text-left">
                {joinLink}
              </p>
              <button
                onClick={copyLink}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-medium transition shrink-0"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Actions */}
          {/* {activeRoom.status === "waiting" && (
            <button
              onClick={() => navigate(`/host/${activeRoom.id}`)}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-base font-semibold transition"
            >
              Start Hosting
            </button>
          )}

          {activeRoom.status === "finished" && (
            <button
              onClick={() => navigate(`/results/${activeRoom.id}`)}
              className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-base font-semibold transition"
            >
              View Results
            </button>
          )} */}
          {/* Actions */}
          {activeRoom.status === "waiting" && (
            <button
              onClick={() => navigate(`/host/${activeRoom.id}`)}
              className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-base font-semibold transition"
            >
              Start Hosting
            </button>
          )}

          {activeRoom.status === "active" && (
            <button
              onClick={() => navigate(`/host/${activeRoom.id}`)}
              className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-base font-semibold transition"
            >
              Rejoin as Host
            </button>
          )}

          {activeRoom.status === "finished" && (
            <div className="text-center py-4">
              <p className="text-slate-400 text-sm mb-3">This game has ended</p>
              <button
                onClick={() => navigate(`/results/${activeRoom.id}`)}
                className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-base font-semibold transition"
              >
                View Results
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Rooms List ──
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Rooms</h1>
            <p className="text-slate-400 text-sm">
              {rooms.length} rooms created
            </p>
          </div>
          {!showCreate && (
            <button
              onClick={() => {
                setShowCreate(true);
                setCreateError("");
              }}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              + Create Room
            </button>
          )}
        </div>

        {/* Create Room Form */}
        {showCreate && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Create New Room
            </h2>

            {createError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">
                  Select a Collection
                </label>

                {collections.length === 0 ? (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-center">
                    <p className="text-slate-500 mb-2">
                      No collections available
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate("/questions")}
                      className="text-violet-400 hover:text-violet-300 text-sm transition"
                    >
                      Create a collection first →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {collections.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCollectionId(c.id)}
                        className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition ${
                          selectedCollectionId === c.id
                            ? "border-green-500 bg-green-500/10"
                            : "border-slate-700 bg-slate-900 hover:border-slate-600"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedCollectionId === c.id
                              ? "border-green-500 bg-green-500"
                              : "border-slate-600"
                          }`}
                        >
                          {selectedCollectionId === c.id && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{c.title}</p>
                          <p className="text-slate-400 text-xs">
                            {c.question_count} questions
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating || !selectedCollectionId}
                  className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                >
                  {creating ? "Creating..." : "Create Room"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreate(false);
                    setSelectedCollectionId("");
                    setCreateError("");
                  }}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms List */}
        {rooms.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <p className="text-slate-500 text-lg mb-2">No rooms yet</p>
            <p className="text-slate-600 text-sm">
              Create a room and share the code with players
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((r) => (
              <div
                key={r.id}
                onClick={() => openRoom(r)}
                className="bg-slate-800 border border-slate-700 hover:border-green-500/50 rounded-xl p-5 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <p className="text-white font-mono font-bold text-2xl tracking-widest">
                      {r.room_code}
                    </p>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-slate-500 text-xs font-mono">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    waiting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    finished: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-mono border ${
        colors[status] || colors.waiting
      }`}
    >
      {status}
    </span>
  );
}
