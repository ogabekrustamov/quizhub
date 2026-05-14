import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Collections() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Detail view
  const [activeCollection, setActiveCollection] = useState(null);
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [cRes, qRes] = await Promise.all([
          api.get("/collections/"),
          api.get("/questions/"),
        ]);
        if (!cancelled) {
          setCollections(cRes.data);
          setQuestions(qRes.data);
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

  async function refreshData() {
    const [cRes, qRes] = await Promise.all([
      api.get("/collections/"),
      api.get("/questions/"),
    ]);
    setCollections(cRes.data);
    setQuestions(qRes.data);
  }

  async function openCollection(c) {
    try {
      const res = await api.get(`/collections/${c.id}`);
      setActiveCollection(res.data);
      setEditing(false);
    } catch {
      alert("Failed to load collection");
    }
  }

  function startEdit() {
    setEditing(true);
    setSelectedIds(activeCollection.questions.map((q) => q.id));
  }

  function cancelEdit() {
    setEditing(false);
    setSelectedIds([]);
  }

  function toggleQuestion(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function saveEdit() {
    if (selectedIds.length === 0) {
      alert("Select at least one question");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/collections/${activeCollection.id}`, {
        title: activeCollection.title,
        question_ids: selectedIds,
      });
      const res = await api.get(`/collections/${activeCollection.id}`);
      setActiveCollection(res.data);
      setEditing(false);
      refreshData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to update collection");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this collection?")) return;
    try {
      await api.delete(`/collections/${id}`);
      setActiveCollection(null);
      refreshData();
    } catch {
      alert("Failed to delete collection");
    }
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

  // ── Collection Detail View ──
  if (activeCollection) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navbar />

        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {activeCollection.title}
              </h1>
              <p className="text-slate-400 text-sm">
                {activeCollection.questions.length} questions
              </p>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <span className="text-cyan-400 text-sm mr-2">
                    {selectedIds.length} selected
                  </span>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEdit}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(activeCollection.id)}
                    className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setActiveCollection(null)}
                    className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition"
                  >
                    ← Back
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-3">
            {editing
              ? // Edit mode — all questions with checkboxes
                questions.map((q) => {
                  const selected = selectedIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleQuestion(q.id)}
                      className={`bg-slate-800 p-4 border rounded-xl cursor-pointer transition ${
                        selected
                          ? "border-cyan-500 bg-cyan-500/5"
                          : "border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                            selected
                              ? "border-cyan-500 bg-cyan-600"
                              : "border-slate-600"
                          }`}
                        >
                          {selected && (
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
                          <p className="text-white text-sm">{q.text}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            {q.time_limit}s · {q.options.length} options
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              : // View mode — collection questions with options
                activeCollection.questions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-slate-800 border border-slate-700 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-white font-medium">{q.text}</p>
                      <span className="text-slate-500 text-xs font-mono ml-3 shrink-0">
                        {q.time_limit}s
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            opt.is_correct
                              ? "bg-green-500/10 border border-green-500/30 text-green-400"
                              : "bg-slate-900 border border-slate-700 text-slate-400"
                          }`}
                        >
                          {opt.is_correct && <span className="mr-1">✓</span>}
                          {opt.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Collections List View ──
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Collections</h1>
            <p className="text-slate-400 text-sm">
              {collections.length} collections
            </p>
          </div>
        </div>

        {collections.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <p className="text-slate-500 text-lg mb-2">No collections yet</p>
            <p className="text-slate-600 text-sm mb-4">
              Create a collection from the Questions page
            </p>
            <button
              onClick={() => navigate("/questions")}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
            >
              Go to Questions
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {collections.map((c) => (
              <div
                key={c.id}
                onClick={() => openCollection(c)}
                className="bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl p-5 cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">{c.title}</h3>
                    <p className="text-slate-400 text-sm">
                      {c.question_count} questions
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600 text-xs font-mono">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
