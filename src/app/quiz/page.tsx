"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export default function QuizPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [player, setPlayer] = useState("");
  const [subject, setSubject] = useState("");
  const [grade, setGrade] = useState("");
  const [topic, setTopic] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const data = JSON.parse(sessionStorage.getItem("quiz-data") || "{}");
      if (data.questions?.length) {
        setQuestions(data.questions);
        setPlayer(data.player || "");
        setSubject(data.subject || "");
        setGrade(String(data.grade || ""));
        setTopic(data.topic || "");
        setIsTeacher(!!data.isTeacher);
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  }, [router]);

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setShowResult(false);
      setTimeLeft(30);
    } else {
      sessionStorage.setItem("quiz-result", JSON.stringify({
        score, answers, questions, player, subject, grade, topic, isTeacher,
      }));
      router.push("/result");
    }
  };

  useEffect(() => {
    if (showResult || questions.length === 0) return;
    if (timeLeft <= 0) {
      setAnswers((prev) => [...prev, -1]);
      setStreak(0);
      setShowResult(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showResult, questions.length]);

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
    setAnswers((prev) => [...prev, index]);

    const isCorrect = index === questions[current]?.correct;
    if (isCorrect) {
      const timeBonus = Math.ceil(timeLeft / 3);
      setScore((s) => s + 10 + timeBonus);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  if (!mounted || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <div className="text-xl text-gray-500">{"\u0110ang t\u1ea3i..."}</div>
      </div>
    );
  }

  const q = questions[current];
  const isCorrect = selected === q?.correct;
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-600">{player}</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{"\u0110i\u1ec3m:"}</span>
            <span className="font-bold text-purple-600 text-lg">{score}</span>
          </div>
        </div>

        <div className="bg-white rounded-full h-3 mb-4 overflow-hidden shadow-inner">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-gray-500">{`C\u00e2u ${current + 1}/${questions.length}`}</span>
          {streak >= 2 && (
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-bold">
              {`${streak} li\u00ean ti\u1ebfp!`}
            </span>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <div className={`relative w-20 h-20 ${!showResult && timeLeft <= 5 ? "animate-pulse" : ""}`}>
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="35" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="35" fill="none"
                stroke={timeLeft <= 5 ? "#ef4444" : timeLeft <= 10 ? "#f59e0b" : "#8b5cf6"}
                strokeWidth="6"
                strokeDasharray={`${(timeLeft / 30) * 220} 220`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center font-bold text-2xl ${
              timeLeft <= 5 ? "text-red-500" : timeLeft <= 10 ? "text-amber-500" : "text-purple-600"
            }`}>
              {timeLeft}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 leading-relaxed">{q?.question}</h2>
        </div>

        <div className="space-y-3 mb-6">
          {q?.options.map((option, index) => {
            let style = "bg-white border-2 border-gray-200";
            if (showResult) {
              if (index === q.correct) style = "bg-green-50 border-2 border-green-400";
              else if (index === selected) style = "bg-red-50 border-2 border-red-400";
              else style = "bg-gray-50 border-2 border-gray-200 opacity-50";
            }

            return (
              <button
                type="button"
                key={index}
                onClick={() => handleSelect(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl text-left cursor-pointer ${style}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                    showResult && index === q.correct ? "bg-green-500 text-white"
                    : showResult && index === selected ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {showResult && index === q.correct ? "O" : showResult && index === selected ? "X" : String.fromCharCode(65 + index)}
                  </div>
                  <span className={`text-lg ${showResult && index === q.correct ? "font-bold text-green-700" : "text-gray-700"}`}>
                    {option.replace(/^[A-D]\.\s*/, "")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className={`rounded-2xl p-5 mb-4 ${isCorrect ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
            <div className={`font-bold text-lg mb-1 ${isCorrect ? "text-green-600" : "text-amber-600"}`}>
              {isCorrect ? "Ch\u00ednh x\u00e1c!" : selected === -1 ? "H\u1ebft gi\u1edd!" : "Ch\u01b0a \u0111\u00fang!"}
            </div>
            <p className="text-gray-700">{q?.explanation}</p>
          </div>
        )}

        {showResult && (
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-2xl font-bold text-lg text-white bg-purple-600 cursor-pointer"
          >
            {current < questions.length - 1 ? "C\u00e2u ti\u1ebfp theo \u2192" : "Xem k\u1ebft qu\u1ea3 \u{1F3C6}"}
          </button>
        )}
      </div>

      <footer className="text-center py-8 text-sm text-gray-500">
        © Quiz AI.Built by Nguyen Thi Hoang Ngan.
      </footer>
    </main>
  );
}
