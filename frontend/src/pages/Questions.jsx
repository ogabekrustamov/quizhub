import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Questions() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Question form
  const [showForm, setShowForm] = useState(false);
  const [qText, setQText] = useState("");
  const [qTimeLimit, setQTimeLimit] = useState(30);
  const [qOptions, setQOptions] = useState([
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
    { text: "", is_correct: false },
  ]);
  const [qError, setQError] = useState("");

  // Collection creation flow
  const [selectingForCollection, setSelectingForCollection] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showNamePopup, setShowNamePopup] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadQuestions() {
      try {
        const res = await api.get("/questions/");
        if (!cancelled) setQuestions(res.data);
      } catch (err) {
        console.error("Failed to fetch questions", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadQuestions();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshQuestions() {
    const res = await api.get("/questions/");
    setQuestions(res.data);
  }

  // ── Question Form ──

  function resetForm() {
    setQText("");
    setQTimeLimit(30);
    setQOptions([
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ]);
    setQError("");
    setShowForm(false);
  }

  function handleOptionChange(index, field, value) {
    setQOptions((prev) =>
      prev.map((opt, i) => {
        if (field === "is_correct") return { ...opt, is_correct: i === index };
        return i === index ? { ...opt, [field]: value } : opt;
      })
    );
  }

  async function handleCreateQuestion(e) {
    e.preventDefault();
    setQError("");
    if (qOptions.some((o) => !o.text.trim())) {
      setQError("All 4 options are required");
      return;
    }
    if (!qOptions.some((o) => o.is_correct)) {
      setQError("Select one correct answer");
      return;
    }
    try {
      await api.post("/questions/", {
        text: qText,
        time_limit: qTimeLimit,
        options: qOptions,
      });
      resetForm();
      refreshQuestions();
    } catch (err) {
      setQError(err.response?.data?.detail || "Failed to create question");
    }
  }

  async function handleDeleteQuestion(id) {
    if (!confirm("Delete this question?")) return;
    try {
      await api.delete(`/questions/${id}`);
      refreshQuestions();
    } catch {
      alert("Failed to delete question");
    }
  }

  // ── Collection Flow ──

  function startCollectionFlow() {
    setSelectingForCollection(true);
    setSelectedIds([]);
    setShowForm(false);
  }

  function cancelCollectionFlow() {
    setSelectingForCollection(false);
    setSelectedIds([]);
    setShowNamePopup(false);
    setCollectionName("");
  }

  function toggleQuestion(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleNext() {
    if (selectedIds.length === 0) {
      alert("Select at least one question");
      return;
    }
    setShowNamePopup(true);
    setCollectionName("");
  }

  async function handleCreateCollection() {
    if (!collectionName.trim()) return;
    setSaving(true);
    try {
      await api.post("/collections/", {
        title: collectionName,
        question_ids: selectedIds,
      });
      cancelCollectionFlow();
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create collection");
    } finally {
      setSaving(false);
    }
  }

  const optionColors = [
    "border-red-500/40 bg-red-500/5",
    "border-blue-500/40 bg-blue-500/5",
    "border-yellow-500/40 bg-yellow-500/5",
    "border-green-500/40 bg-green-500/5",
  ];

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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Questions</h1>
            <p className="text-slate-400 text-sm">
              {questions.length} questions
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectingForCollection ? (
              <>
                <span className="text-violet-400 text-sm mr-2">
                  {selectedIds.length} selected
                </span>
                <button
                  onClick={cancelCollectionFlow}
                  className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Next
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
                >
                  + New Question
                </button>
                <button
                  onClick={startCollectionFlow}
                  className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition"
                >
                  + Create Collection
                </button>
              </>
            )}
          </div>
        </div>

        {/* Question Form */}
        {showForm && !selectingForCollection && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              New Question
            </h2>
            {qError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {qError}
              </div>
            )}
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">
                  Question Text
                </label>
                <input
                  type="text"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                  placeholder="What is the capital of France?"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-violet-500 transition"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1.5">
                  Time Limit
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={qTimeLimit}
                    onChange={(e) => setQTimeLimit(Number(e.target.value))}
                    min={5}
                    max={120}
                    className="w-24 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-violet-500 transition"
                  />
                  <span className="text-slate-500 text-sm">seconds</span>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-3">
                  Options (select the correct one)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {qOptions.map((opt, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-3 p-3 border rounded-lg transition ${
                        opt.is_correct
                          ? "border-green-500 bg-green-500/10"
                          : optionColors[i]
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct"
                        checked={opt.is_correct}
                        onChange={() =>
                          handleOptionChange(i, "is_correct", true)
                        }
                        className="accent-green-500 w-4 h-4 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) =>
                          handleOptionChange(i, "text", e.target.value)
                        }
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <p className="text-slate-500 text-lg mb-2">No questions yet</p>
            <p className="text-slate-600 text-sm">
              Create your first question to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div
                key={q.id}
                onClick={() => selectingForCollection && toggleQuestion(q.id)}
                className={`bg-slate-800 border rounded-xl p-5 transition ${
                  selectingForCollection ? "cursor-pointer" : ""
                } ${
                  selectingForCollection && selectedIds.includes(q.id)
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-slate-700"
                }`}
              >
                <div className="flex items-start gap-3">
                  {selectingForCollection && (
                    <div
                      className={`w-5 h-5 mt-1 rounded border-2 flex items-center justify-center shrink-0 ${
                        selectedIds.includes(q.id)
                          ? "border-violet-500 bg-violet-600"
                          : "border-slate-600"
                      }`}
                    >
                      {selectedIds.includes(q.id) && (
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
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-white font-medium">{q.text}</p>
                      <span className="text-slate-500 text-xs font-mono ml-3 shrink-0">
                        {q.time_limit}s
                      </span>
                    </div>

                    {!selectingForCollection && (
                      <>
                        <div className="grid grid-cols-2 gap-2 mt-3 mb-3">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`px-3 py-2 rounded-lg text-sm ${
                                opt.is_correct
                                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                                  : "bg-slate-900 border border-slate-700 text-slate-400"
                              }`}
                            >
                              {opt.is_correct && (
                                <span className="mr-1">✓</span>
                              )}
                              {opt.text}
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-medium transition"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Name Popup */}
      {showNamePopup && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={cancelCollectionFlow}
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Name your collection
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {selectedIds.length} questions selected
            </p>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              placeholder="e.g. Geography Quiz"
              autoFocus
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm outline-none focus:border-violet-500 transition mb-5"
              onKeyDown={(e) =>
                e.key === "Enter" &&
                collectionName.trim() &&
                handleCreateCollection()
              }
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelCollectionFlow}
                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCollection}
                disabled={!collectionName.trim() || saving}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
