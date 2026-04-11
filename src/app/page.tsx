"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

interface ExerciseSet {
  id: string;
  name: string;
  createdAt: string;
  questions: { question: string; options: string[]; correct: number; explanation: string }[];
}

interface LbEntry {
  player: string;
  score: number;
  correctCount: number;
  total: number;
  subject: string;
  grade: string;
  topic?: string;
}

const MathIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <line x1="12" y1="5" x2="12" y2="13" /><line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const VietnameseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    <path d="M8 7h6" /><path d="M8 11h8" /><path d="M8 15h4" />
  </svg>
);

const EnglishIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const TeacherIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
    <path d="M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z" />
    <path d="M6 9.01V9" />
    <path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19" />
  </svg>
);

const subjectIcons: Record<string, () => React.JSX.Element> = {
  math: MathIcon,
  vietnamese: VietnameseIcon,
  english: EnglishIcon,
};

const subjects = [
  { id: "math", name: "To\u00e1n", color: "bg-blue-500" },
  { id: "vietnamese", name: "Ti\u1ebfng Vi\u1ec7t", color: "bg-pink-500" },
  { id: "english", name: "Ti\u1ebfng Anh", color: "bg-green-500" },
];

const grades = [1, 2, 3, 4, 5];
const questionCounts = [5, 10, 15, 20, 25, 30];

const topicSuggestions: Record<string, Record<number, string[]>> = {
  math: {
    1: ["Ph\u00e9p c\u1ed9ng trong ph\u1ea1m vi 10", "Ph\u00e9p tr\u1eeb trong ph\u1ea1m vi 10", "So s\u00e1nh c\u00e1c s\u1ed1"],
    2: ["Ph\u00e9p nh\u00e2n b\u1ea3ng 2, 3, 4, 5", "Ph\u00e9p chia", "B\u00e0i to\u00e1n c\u00f3 l\u1eddi v\u0103n"],
    3: ["Ph\u00e9p nh\u00e2n b\u1ea3ng 6, 7, 8, 9", "Chu vi h\u00ecnh ch\u1eef nh\u1eadt", "Ph\u00e2n s\u1ed1 \u0111\u01a1n gi\u1ea3n"],
    4: ["Ph\u00e2n s\u1ed1", "S\u1ed1 th\u1eadp ph\u00e2n", "Di\u1ec7n t\u00edch h\u00ecnh b\u00ecnh h\u00e0nh"],
    5: ["S\u1ed1 th\u1eadp ph\u00e2n", "Di\u1ec7n t\u00edch h\u00ecnh tr\u00f2n", "T\u1ec9 s\u1ed1 ph\u1ea7n tr\u0103m"],
  },
  vietnamese: {
    1: ["T\u1eadp \u0111\u1ecdc c\u00e1c ch\u1eef c\u00e1i", "Gh\u00e9p v\u1ea7n \u0111\u01a1n gi\u1ea3n", "T\u1eeb ch\u1ec9 \u0111\u1ed3 v\u1eadt"],
    2: ["T\u1eeb ch\u1ec9 s\u1ef1 v\u1eadt", "\u0110\u1eb7t c\u00e2u v\u1edbi t\u1eeb cho s\u1eb5n", "D\u1ea5u ch\u1ea5m, d\u1ea5u ph\u1ea9y"],
    3: ["T\u1eeb \u0111\u1ed3ng ngh\u0129a, tr\u00e1i ngh\u0129a", "C\u00e2u k\u1ec3, c\u00e2u h\u1ecfi", "Th\u00e0nh ng\u1eef t\u1ee5c ng\u1eef"],
    4: ["Danh t\u1eeb, \u0111\u1ed9ng t\u1eeb, t\u00ednh t\u1eeb", "C\u00e2u gh\u00e9p", "\u0110\u1ecdc hi\u1ec3u v\u0103n b\u1ea3n"],
    5: ["T\u1eeb \u0111\u1ed3ng \u00e2m, \u0111a ngh\u0129a", "V\u0103n t\u1ea3 ng\u01b0\u1eddi, t\u1ea3 c\u1ea3nh", "Ngh\u1ecb lu\u1eadn \u0111\u01a1n gi\u1ea3n"],
  },
  english: {
    1: ["The Alphabet", "Colors", "Numbers 1-10", "Animals"],
    2: ["Family members", "Classroom objects", "Days of the week"],
    3: ["Parts of the body", "Weather", "Sports and hobbies"],
    4: ["Daily routines", "Jobs and occupations", "Seasons and months"],
    5: ["Past tense", "Comparative adjectives", "Travel and transport"],
  },
};

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [topic, setTopic] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    setMounted(true);
    setSiteUrl(window.location.origin);

    // Check if already authenticated this session
    if (sessionStorage.getItem("quiz-authenticated") === "true") {
      setAuthenticated(true);
    }

    // Check if password is required
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!d.hasPassword || sessionStorage.getItem("quiz-authenticated") === "true") {
          setAuthenticated(true);
          sessionStorage.setItem("quiz-authenticated", "true");
        } else {
          setNeedsPassword(true);
        }
      })
      .catch(() => setAuthenticated(true));

    // Load exercises from server
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((sets) => setExerciseSets(sets))
      .catch(() => {});
  }, []);

  const handleStart = async () => {
    if (!selectedSubject || !selectedGrade || !topic.trim() || !playerName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject, grade: selectedGrade, topic, count: numQuestions }),
      });

      const data = await res.json();
      if (data.questions) {
        sessionStorage.setItem("quiz-data", JSON.stringify({
          questions: data.questions,
          subject: selectedSubject,
          grade: selectedGrade,
          topic,
          player: playerName,
        }));
        router.push("/quiz");
      } else {
        alert("L\u1ed7i khi t\u1ea1o c\u00e2u h\u1ecfi. Vui l\u00f2ng th\u1eed l\u1ea1i!");
      }
    } catch {
      alert("L\u1ed7i khi t\u1ea1o c\u00e2u h\u1ecfi. Vui l\u00f2ng th\u1eed l\u1ea1i!");
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = (set: ExerciseSet) => {
    if (!playerName.trim()) {
      alert("Vui l\u00f2ng nh\u1eadp t\u00ean h\u1ecdc sinh!");
      return;
    }
    sessionStorage.setItem("quiz-data", JSON.stringify({
      questions: set.questions,
      subject: "teacher",
      grade: "",
      topic: set.name,
      player: playerName,
    }));
    router.push("/quiz");
  };

  const suggestions = selectedSubject && selectedGrade
    ? topicSuggestions[selectedSubject]?.[selectedGrade] || []
    : [];

  const handlePasswordSubmit = async () => {
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-password", password: passwordInput }),
      });
      const data = await res.json();
      if (data.valid) {
        setAuthenticated(true);
        sessionStorage.setItem("quiz-authenticated", "true");
      } else {
        alert("Sai mật khẩu!");
      }
    } catch {
      alert("Lỗi kết nối!");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!mounted) return null;

  if (!authenticated && needsPassword) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-purple-600 mb-1">Quiz AI</h1>
          <p className="text-gray-400 text-sm mb-6">{"Nh\u1eadp m\u1eadt kh\u1ea9u \u0111\u1ec3 v\u00e0o ch\u01a1i"}</p>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
            placeholder={"M\u1eadt kh\u1ea9u"}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-lg text-center tracking-widest mb-4"
          />
          <button
            type="button"
            onClick={handlePasswordSubmit}
            disabled={passwordLoading}
            className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 cursor-pointer disabled:opacity-50"
          >
            {passwordLoading ? "Đang kiểm tra..." : "Vào chơi"}
          </button>
        </div>
      </main>
    );
  }

  if (!authenticated) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 relative">
      {/* QR nhỏ góc trái */}
      <div className="fixed top-4 left-4 z-40 bg-white rounded-xl shadow-lg p-2 cursor-pointer group">
        <QRCodeSVG value={siteUrl} size={48} />
        <div className="hidden group-hover:block absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl p-3">
          <QRCodeSVG value={siteUrl} size={150} />
          <p className="text-xs text-gray-400 mt-1 text-center">Quét để vào chơi</p>
        </div>
      </div>

      {/* Link admin góc phải */}
      <a href="/admin" className="fixed top-4 right-4 z-40 bg-white rounded-xl shadow-lg px-3 py-2 text-xs text-gray-400 hover:text-purple-600">
        {"⚙ Giáo viên"}
      </a>

      <div className="text-center pt-8 pb-4 px-4">
        <h1 className="text-5xl font-extrabold text-purple-600">Quiz AI</h1>
        <p className="text-gray-600 mt-2 text-lg">{"Tr\u00f2 ch\u01a1i \u00f4n b\u00e0i th\u00f4ng minh cho h\u1ecdc sinh ti\u1ec3u h\u1ecdc"}</p>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowLeaderboard(true)}
            className="px-5 py-2 rounded-xl text-sm font-bold text-purple-600 bg-white shadow cursor-pointer"
          >
            {"\u{1F3C6} B\u1ea3ng x\u1ebfp h\u1ea1ng"}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12 space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{"T\u00ean h\u1ecdc sinh"}</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder={"Nh\u1eadp t\u00ean c\u1ee7a em..."}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-lg"
          />
        </div>

        {/* B\u00e0i t\u1eadp t\u1eeb gi\u00e1o vi\u00ean */}
        {exerciseSets.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{"B\u00e0i t\u1eadp t\u1eeb gi\u00e1o vi\u00ean"}</h2>
            <div className="grid grid-cols-2 gap-3">
              {exerciseSets.map((set) => (
                <button
                  type="button"
                  key={set.id}
                  onClick={() => handleStartExercise(set)}
                  className="p-4 rounded-xl border-2 border-gray-200 bg-white cursor-pointer text-center hover:border-orange-400 hover:bg-orange-50 transition-colors"
                >
                  <div className="w-14 h-14 rounded-full bg-orange-500 mx-auto mb-2 flex items-center justify-center text-white">
                    <TeacherIcon />
                  </div>
                  <div className="text-sm font-bold text-gray-700">{set.name}</div>
                  <div className="text-xs text-gray-400">{set.questions.length} {"c\u00e2u h\u1ecfi"}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">{"Ch\u1ecdn m\u00f4n h\u1ecdc"}</h2>
          <div className="grid grid-cols-3 gap-3">
            {subjects.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => { setSelectedSubject(s.id); setTopic(""); }}
                className={`p-4 rounded-xl border-2 cursor-pointer text-center ${
                  selectedSubject === s.id
                    ? "border-purple-500 bg-purple-50 shadow-lg"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className={`w-14 h-14 rounded-full ${s.color} mx-auto mb-2 flex items-center justify-center text-white`}>
                  {subjectIcons[s.id]()}
                </div>
                <div className="text-sm font-bold text-gray-700">{s.name}</div>
              </button>
            ))}
          </div>
        </div>

        {selectedSubject && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{"Ch\u1ecdn l\u1edbp"}</h2>
            <div className="flex gap-3 justify-center">
              {grades.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => { setSelectedGrade(g); setTopic(""); }}
                  className={`w-14 h-14 rounded-xl font-bold text-lg cursor-pointer ${
                    selectedGrade === g
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSubject && selectedGrade && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{"Ch\u1ee7 \u0111\u1ec1 b\u00e0i h\u1ecdc"}</h2>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={"Nh\u1eadp ch\u1ee7 \u0111\u1ec1 ho\u1eb7c ch\u1ecdn g\u1ee3i \u00fd..."}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-lg mb-3"
            />
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setTopic(s)}
                  className={`px-3 py-1.5 rounded-full text-sm cursor-pointer ${
                    topic === s ? "bg-purple-500 text-white" : "bg-purple-50 text-purple-600"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSubject && selectedGrade && topic && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{"S\u1ed1 c\u00e2u h\u1ecfi"}</h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {questionCounts.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setNumQuestions(n)}
                  className={`w-14 h-14 rounded-xl font-bold text-lg cursor-pointer ${
                    numQuestions === n
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSubject && selectedGrade && topic && playerName && (
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-xl text-white bg-purple-600 cursor-pointer disabled:opacity-50"
          >
            {loading ? "AI \u0111ang t\u1ea1o c\u00e2u h\u1ecfi..." : "B\u1eaft \u0111\u1ea7u ch\u01a1i!"}
          </button>
        )}
      </div>

      {showLeaderboard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLeaderboard(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-700">{"\u{1F3C6} B\u1ea3ng x\u1ebfp h\u1ea1ng"}</h2>
              <button
                type="button"
                onClick={() => setShowLeaderboard(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                X
              </button>
            </div>
            <LeaderboardList />
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-sm text-gray-500">
        © Quiz AI.Built by Nguyen Thi Hoang Ngan.
      </footer>
    </main>
  );
}

function LeaderboardList() {
  const subjectMap: Record<string, string> = { math: "To\u00e1n", vietnamese: "Ti\u1ebfng Vi\u1ec7t", english: "Ti\u1ebfng Anh", teacher: "B\u00e0i t\u1eadp GV" };
  const [lb, setLb] = useState<LbEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => r.json())
      .then((data) => { setLb(data); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return <p className="text-gray-400 text-center py-8">{"Đang tải..."}</p>;
  if (lb.length === 0) return <p className="text-gray-400 text-center py-8">{"Ch\u01b0a c\u00f3 k\u1ebft qu\u1ea3 n\u00e0o"}</p>;

  const filterOptions: { key: string; label: string }[] = [{ key: "all", label: "T\u1ea5t c\u1ea3" }];
  const seen = new Set<string>();
  for (const entry of lb) {
    const key = entry.subject === "teacher" ? `teacher:${entry.topic || ""}` : `${entry.subject}:${entry.grade}`;
    if (!seen.has(key)) {
      seen.add(key);
      if (entry.subject === "teacher") {
        filterOptions.push({ key, label: entry.topic || "B\u00e0i t\u1eadp GV" });
      } else {
        filterOptions.push({ key, label: `${subjectMap[entry.subject] || entry.subject} L${entry.grade}` });
      }
    }
  }

  const filtered = filter === "all" ? lb : lb.filter((e) => {
    const key = e.subject === "teacher" ? `teacher:${e.topic || ""}` : `${e.subject}:${e.grade}`;
    return key === filter;
  });

  return (
    <div>
      {filterOptions.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer ${
                filter === opt.key ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {filtered.length === 0 ? (
        <p className="text-gray-400 text-center py-4">{"Ch\u01b0a c\u00f3 k\u1ebft qu\u1ea3"}</p>
      ) : (
        <div className="space-y-2">
          {filtered.slice(0, 20).map((entry, i) => (
            <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
              i === 0 ? "bg-yellow-50 border border-yellow-200"
              : i === 1 ? "bg-gray-50 border border-gray-200"
              : i === 2 ? "bg-orange-50 border border-orange-200"
              : "bg-white border border-gray-100"
            }`}>
              <div className="flex items-center gap-3">
                <span className="font-bold text-gray-500 w-8 text-center">
                  {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `${i + 1}`}
                </span>
                <div>
                  <span className="font-medium text-gray-700">{entry.player}</span>
                  <span className="text-xs text-gray-400 ml-2">{subjectMap[entry.subject] || entry.subject}{entry.grade ? ` L${entry.grade}` : ""}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="font-bold text-purple-600">{entry.score} {"\u0111i\u1ec3m"}</span>
                <span className="text-sm text-gray-400 ml-1">({entry.correctCount}/{entry.total})</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
