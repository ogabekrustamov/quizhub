// import { useState, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// import Navbar from "../components/Navbar";
// import api from "../api/axios";

// export default function Dashboard() {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const [questions, setQuestions] = useState([]);
//   const [collections, setCollections] = useState([]);
//   const [rooms, setRooms] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let cancelled = false;

//     async function loadData() {
//       try {
//         const [qRes, cRes, rRes] = await Promise.all([
//           api.get("/questions/"),
//           api.get("/collections/"),
//           api.get("/rooms/"),
//         ]);
//         if (!cancelled) {
//           setQuestions(qRes.data);
//           setCollections(cRes.data);
//           setRooms(rRes.data);
//         }
//       } catch (err) {
//         console.error("Failed to fetch data", err);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     }

//     loadData();
//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-slate-900">
//         <Navbar />
//         <div className="flex items-center justify-center h-[80vh] text-slate-400">
//           Loading...
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-slate-900">
//       <Navbar />

//       <div className="max-w-6xl mx-auto px-8 py-8">
//         <div className="mb-8">
//           <h1 className="text-2xl font-bold text-white mb-1">
//             Welcome back, {user?.username}
//           </h1>
//           <p className="text-slate-400">Manage your quizzes and host games</p>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
//           <StatCard label="Questions" value={questions.length} emoji="📝" />
//           <StatCard label="Collections" value={collections.length} emoji="📚" />
//           <StatCard label="Rooms" value={rooms.length} emoji="🎮" />
//           <StatCard
//             label="Games Played"
//             value={rooms.filter((r) => r.status === "finished").length}
//             emoji="🏆"
//           />
//         </div>

//         {/* Two main blocks */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//           {/* Questions Block */}
//           <div
//             onClick={() => navigate("/questions")}
//             className="bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-2xl p-6 cursor-pointer transition group"
//           >
//             <div className="flex items-center gap-3 mb-4">
//               <span className="text-3xl">📝</span>
//               <div>
//                 <h2 className="text-lg font-semibold text-white group-hover:text-violet-400 transition">
//                   Questions
//                 </h2>
//                 <p className="text-slate-500 text-sm">
//                   {questions.length} questions created
//                 </p>
//               </div>
//             </div>
//             <div className="space-y-2">
//               {questions.slice(0, 3).map((q) => (
//                 <p key={q.id} className="text-slate-400 text-sm truncate">
//                   • {q.text}
//                 </p>
//               ))}
//               {questions.length > 3 && (
//                 <p className="text-slate-500 text-xs">
//                   +{questions.length - 3} more
//                 </p>
//               )}
//               {questions.length === 0 && (
//                 <p className="text-slate-500 text-sm">
//                   No questions yet. Click to create!
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Collections Block */}
//           <div
//             onClick={() => navigate("/collections")}
//             className="bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-2xl p-6 cursor-pointer transition group"
//           >
//             <div className="flex items-center gap-3 mb-4">
//               <span className="text-3xl">📚</span>
//               <div>
//                 <h2 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition">
//                   Collections
//                 </h2>
//                 <p className="text-slate-500 text-sm">
//                   {collections.length} collections created
//                 </p>
//               </div>
//             </div>
//             <div className="space-y-2">
//               {collections.slice(0, 3).map((c) => (
//                 <p key={c.id} className="text-slate-400 text-sm truncate">
//                   • {c.title} ({c.question_count} questions)
//                 </p>
//               ))}
//               {collections.length > 3 && (
//                 <p className="text-slate-500 text-xs">
//                   +{collections.length - 3} more
//                 </p>
//               )}
//               {collections.length === 0 && (
//                 <p className="text-slate-500 text-sm">
//                   No collections yet. Click to create!
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Recent Rooms */}
//         <div>
//           <h2 className="text-lg font-semibold text-white mb-4">
//             Recent Rooms
//           </h2>
//           {rooms.length === 0 ? (
//             <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
//               <p className="text-slate-500">
//                 No rooms yet. Host a game from a collection!
//               </p>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {rooms.slice(0, 6).map((r) => (
//                 <div
//                   key={r.id}
//                   className="bg-slate-800 border border-slate-700 rounded-xl p-4"
//                 >
//                   <div className="flex items-center justify-between mb-2">
//                     <span className="text-white font-mono font-bold text-lg">
//                       {r.room_code}
//                     </span>
//                     <StatusBadge status={r.status} />
//                   </div>
//                   <p className="text-slate-400 text-sm mb-3">
//                     {new Date(r.created_at).toLocaleDateString()}
//                   </p>
//                   {r.status === "waiting" && (
//                     <Link
//                       to={`/host/${r.id}`}
//                       className="block w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition text-center"
//                     >
//                       Open Room
//                     </Link>
//                   )}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function StatCard({ label, value, emoji }) {
//   return (
//     <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
//       <div className="text-2xl mb-2">{emoji}</div>
//       <div className="text-2xl font-bold text-white">{value}</div>
//       <div className="text-slate-400 text-sm">{label}</div>
//     </div>
//   );
// }

// function StatusBadge({ status }) {
//   const colors = {
//     waiting: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
//     active: "bg-green-500/10 text-green-400 border-green-500/20",
//     finished: "bg-slate-500/10 text-slate-400 border-slate-500/20",
//   };
//   return (
//     <span
//       className={`px-2 py-0.5 rounded text-xs font-mono border ${
//         colors[status] || colors.waiting
//       }`}
//     >
//       {status}
//     </span>
//   );
// }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [collections, setCollections] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [qRes, cRes, rRes] = await Promise.all([
          api.get("/questions/"),
          api.get("/collections/"),
          api.get("/rooms/"),
        ]);
        if (!cancelled) {
          setQuestions(qRes.data);
          setCollections(cRes.data);
          setRooms(rRes.data);
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

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome back, {user?.username}
          </h1>
          <p className="text-slate-400">Manage your quizzes and host games</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Questions" value={questions.length} emoji="📝" />
          <StatCard label="Collections" value={collections.length} emoji="📚" />
          <StatCard label="Rooms" value={rooms.length} emoji="🎮" />
          <StatCard
            label="Games Played"
            value={rooms.filter((r) => r.status === "finished").length}
            emoji="🏆"
          />
        </div>

        {/* Three main blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Questions Block */}
          <BlockCard
            emoji="📝"
            title="Questions"
            count={questions.length}
            color="violet"
            onClick={() => navigate("/questions")}
          >
            {questions.slice(0, 3).map((q) => (
              <p key={q.id} className="text-slate-400 text-sm truncate">
                • {q.text}
              </p>
            ))}
            {questions.length === 0 && (
              <p className="text-slate-500 text-sm">
                No questions yet. Click to create!
              </p>
            )}
          </BlockCard>

          {/* Collections Block */}
          <BlockCard
            emoji="📚"
            title="Collections"
            count={collections.length}
            color="cyan"
            onClick={() => navigate("/collections")}
          >
            {collections.slice(0, 3).map((c) => (
              <p key={c.id} className="text-slate-400 text-sm truncate">
                • {c.title} ({c.question_count})
              </p>
            ))}
            {collections.length === 0 && (
              <p className="text-slate-500 text-sm">
                No collections yet. Click to create!
              </p>
            )}
          </BlockCard>

          {/* Rooms Block */}
          <BlockCard
            emoji="🎮"
            title="Rooms"
            count={rooms.length}
            color="green"
            onClick={() => navigate("/rooms")}
          >
            {rooms.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <p className="text-slate-400 text-sm font-mono">
                  {r.room_code}
                </p>
                <StatusBadge status={r.status} />
              </div>
            ))}
            {rooms.length === 0 && (
              <p className="text-slate-500 text-sm">
                No rooms yet. Click to create!
              </p>
            )}
          </BlockCard>
        </div>
      </div>
    </div>
  );
}

function BlockCard({ emoji, title, count, color, onClick, children }) {
  const borders = {
    violet: "hover:border-violet-500/50",
    cyan: "hover:border-cyan-500/50",
    green: "hover:border-green-500/50",
  };
  const titles = {
    violet: "group-hover:text-violet-400",
    cyan: "group-hover:text-cyan-400",
    green: "group-hover:text-green-400",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800 border border-slate-700 ${borders[color]} rounded-2xl p-6 cursor-pointer transition group`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h2
            className={`text-lg font-semibold text-white ${titles[color]} transition`}
          >
            {title}
          </h2>
          <p className="text-slate-500 text-sm">
            {count} {title.toLowerCase()}
          </p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatCard({ label, value, emoji }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
      <div className="text-2xl mb-2">{emoji}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-sm">{label}</div>
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
