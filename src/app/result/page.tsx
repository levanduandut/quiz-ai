"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
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

export default function ResultPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<{
    score: number;
    answers: number[];
    questions: Question[];
    player: string;
    subject: string;
    grade: string;
    topic: string;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LbEntry[]>([]);

  useEffect(() => {
    setMounted(true);
    try {
      const d = JSON.parse(sessionStorage.getItem("quiz-result") || "{}");
      if (d.questions?.length) {
        setData(d);
        const correctCount = d.answers.filter((a: number, i: number) => a === d.questions[i]?.correct).length;
        const entry = {
          player: d.player,
          score: d.score,
          correctCount,
          total: d.questions.length,
          subject: d.subject,
          grade: d.grade,
          topic: d.topic,
          date: new Date().toISOString(),
        };

        // Submit score to server
        fetch("/api/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        })
          .then(() => fetch("/api/leaderboard"))
          .then((r) => r.json())
          .then((allLb) => {
            const filtered = allLb.filter((e: LbEntry) =>
              d.subject === "teacher"
                ? e.subject === "teacher" && e.topic === d.topic
                : e.subject === d.subject && e.grade === d.grade,
            );
            setLeaderboard(filtered.slice(0, 10));
          })
          .catch(() => {});
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!mounted || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-xl text-gray-500">{"\u0110ang t\u1ea3i..."}</div>
      </div>
    );
  }

  const { score, answers, questions, player, subject, grade, topic } = data;
  const correctCount = answers.filter((a, i) => a === questions[i]?.correct).length;
  const total = questions.length;
  const percentage = Math.round((correctCount / total) * 100);
  const subjectMap: Record<string, string> = { math: "To\u00e1n", vietnamese: "Ti\u1ebfng Vi\u1ec7t", english: "Ti\u1ebfng Anh", teacher: "B\u00e0i t\u1eadp GV" };

  const rank = percentage >= 90 ? { title: "Xu\u1ea5t s\u1eafc!", color: "text-yellow-500" }
    : percentage >= 70 ? { title: "Gi\u1ecfi l\u1eafm!", color: "text-purple-500" }
    : percentage >= 50 ? { title: "Kh\u00e1 t\u1ed1t!", color: "text-blue-500" }
    : { title: "C\u1ed1 g\u1eafng h\u01a1n nh\u00e9!", color: "text-orange-500" };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
          <h1 className={`text-3xl font-extrabold mb-2 ${rank.color}`}>{rank.title}</h1>
          <p className="text-gray-500 mb-6">{player} - {subjectMap[subject] || subject}{grade ? ` L\u1edbp ${grade}` : ""}</p>

          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-4xl font-black text-purple-600">{score}</div>
              <div className="text-sm text-gray-500">{"T\u1ed5ng \u0111i\u1ec3m"}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-green-500">{correctCount}/{total}</div>
              <div className="text-sm text-gray-500">{"C\u00e2u \u0111\u00fang"}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-black text-blue-500">{percentage}%</div>
              <div className="text-sm text-gray-500">{"T\u1ec9 l\u1ec7"}</div>
            </div>
          </div>

          <div className="bg-gray-100 rounded-full h-4 overflow-hidden mb-6">
            <div
              className={`h-full rounded-full ${percentage >= 70 ? "bg-green-500" : percentage >= 50 ? "bg-blue-500" : "bg-orange-500"}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-xl font-bold text-purple-600 bg-purple-50 cursor-pointer"
            >
              {"Ch\u01a1i l\u1ea1i"}
            </button>
            <button
              type="button"
              onClick={() => {
                const text = `Quiz AI - ${player} \u0111\u1ea1t ${score} \u0111i\u1ec3m (${correctCount}/${total} c\u00e2u \u0111\u00fang) - ${subjectMap[subject] || subject}${grade ? ` L\u1edbp ${grade}` : ""} - Ch\u1ee7 \u0111\u1ec1: ${topic}`;
                navigator.clipboard?.writeText(text);
                alert("\u0110\u00e3 copy k\u1ebft qu\u1ea3!");
              }}
              className="px-6 py-3 rounded-xl font-bold text-white bg-purple-600 cursor-pointer"
            >
              {"Chia s\u1ebb k\u1ebft qu\u1ea3"}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">{"Chi ti\u1ebft b\u00e0i l\u00e0m"}</h2>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correct;
              return (
                <div key={i} className={`p-4 rounded-xl border-2 ${isCorrect ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <p className="font-medium text-gray-800 mb-1">{`C\u00e2u ${i + 1}: ${q.question}`}</p>
                  {!isCorrect && answers[i] >= 0 && (
                    <p className="text-sm text-red-500">{`Em ch\u1ecdn: ${q.options[answers[i]]}`}</p>
                  )}
                  {answers[i] === -1 && <p className="text-sm text-orange-500">{"H\u1ebft gi\u1edd"}</p>}
                  <p className="text-sm text-green-600">{`\u0110\u00e1p \u00e1n: ${q.options[q.correct]}`}</p>
                  <p className="text-sm text-gray-500">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">{`B\u1ea3ng x\u1ebfp h\u1ea1ng - ${subjectMap[subject] || subject}${grade ? ` L\u1edbp ${grade}` : ""}`}</h2>
            <div className="space-y-2">
              {leaderboard.map((entry: LbEntry, i: number) => {
                const isMe = entry.player === player && entry.score === score;
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${
                    isMe ? "bg-purple-100 border-2 border-purple-400 shadow-md"
                    : i === 0 ? "bg-yellow-50 border border-yellow-200"
                    : i === 1 ? "bg-gray-50 border border-gray-200"
                    : i === 2 ? "bg-orange-50 border border-orange-200"
                    : "bg-white border border-gray-100"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-500 w-8 text-center">
                        {i === 0 ? "\u{1F947}" : i === 1 ? "\u{1F948}" : i === 2 ? "\u{1F949}" : `${i + 1}`}
                      </span>
                      <span className={`font-medium ${isMe ? "text-purple-700 font-bold" : "text-gray-700"}`}>
                        {entry.player}{isMe ? " (b\u1ea1n)" : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${isMe ? "text-purple-700" : "text-purple-600"}`}>{entry.score} {"\u0111i\u1ec3m"}</span>
                      <span className="text-sm text-gray-400 ml-2">({entry.correctCount}/{entry.total})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-sm text-gray-500">
        © Quiz AI.Built by Nguyen Thi Hoang Ngan.
      </footer>
    </main>
  );
}
