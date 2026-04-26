"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  type ExerciseSet,
  type Question,
  parseExcelToQuestions,
  downloadTemplate,
} from "@/lib/exercises";

interface LbEntry {
  player: string;
  score: number;
  correctCount: number;
  total: number;
  subject: string;
  grade: string;
  topic?: string;
  isTeacher?: boolean;
  date?: string;
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [classPassword, setClassPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);

  // Exercise state
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([]);
  const [editingSet, setEditingSet] = useState<ExerciseSet | null>(null);
  const [newSetName, setNewSetName] = useState("");
  const [newSetSubject, setNewSetSubject] = useState("");
  const [newSetGrade, setNewSetGrade] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Leaderboard state
  const [lb, setLb] = useState<LbEntry[]>([]);
  const [lbTypeFilter, setLbTypeFilter] = useState("all");
  const [lbSubjectFilter, setLbSubjectFilter] = useState("all");
  const [lbGradeFilter, setLbGradeFilter] = useState("all");
  const [lbNameFilter, setLbNameFilter] = useState("");

  // Change PIN state
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");

  // Loading states
  const [loginLoading, setLoginLoading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [importing, setImporting] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [changingPin, setChangingPin] = useState(false);

  const subjectMap: Record<string, string> = { math: "Toán", vietnamese: "Tiếng Việt", english: "Tiếng Anh", teacher: "Bài tập GV" };

  useEffect(() => {
    setMounted(true);
    setSiteUrl(window.location.origin);
  }, []);

  const loadData = () => {
    fetch("/api/exercises").then((r) => r.json()).then(setExerciseSets).catch(() => { });
    fetch("/api/leaderboard").then((r) => r.json()).then(setLb).catch(() => { });
    fetch("/api/settings").then((r) => r.json()).then((d) => setClassPassword(d.classPassword || "")).catch(() => { });
  };

  const handleAdminLogin = async () => {
    setLoginLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-pin", pin: adminPin }),
      });
      const data = await res.json();
      if (data.valid) {
        setAdminLoggedIn(true);
        loadData();
      } else {
        alert("Sai mã PIN!");
      }
    } catch {
      alert("Lỗi kết nối!");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSetPassword = async () => {
    if (!newPassword.trim()) {
      alert("Vui lòng nhập mật khẩu!");
      return;
    }
    setSavingPassword(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-password", password: newPassword.trim() }),
      });
      setClassPassword(newPassword.trim());
      setNewPassword("");
      alert("Đã cập nhật mật khẩu!");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRemovePassword = async () => {
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove-password" }),
    });
    setClassPassword("");
    alert("\u0110\u00e3 x\u00f3a m\u1eadt kh\u1ea9u!");
  };

  const handleChangePin = async () => {
    if (!/^\d{4}$/.test(newPinInput)) {
      alert("PIN mới phải là 4 chữ số!");
      return;
    }
    setChangingPin(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-pin", currentPin: currentPinInput, newPin: newPinInput }),
      });
      if (res.ok) {
        alert("Đã đổi PIN!");
        setShowPinModal(false);
        setCurrentPinInput("");
        setNewPinInput("");
      } else {
        alert("Sai PIN hiện tại!");
      }
    } finally {
      setChangingPin(false);
    }
  };

  const handleClearLeaderboard = async () => {
    if (confirm("X\u00f3a to\u00e0n b\u1ed9 b\u1ea3ng x\u1ebfp h\u1ea1ng?")) {
      await fetch("/api/leaderboard", { method: "DELETE" });
      setLb([]);
      alert("\u0110\u00e3 x\u00f3a!");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!newSetSubject) {
      alert("Vui lòng chọn môn học!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (!newSetGrade) {
      alert("Vui lòng chọn lớp!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImporting(true);
    try {
      const questions = await parseExcelToQuestions(file);
      if (questions.length === 0) {
        alert("Không tìm thấy câu hỏi hợp lệ. Vui lòng kiểm tra lại file Excel.");
        return;
      }

      const name = newSetName.trim() || file.name.replace(/\.(xlsx|xls)$/i, "");
      const newSet = {
        id: crypto.randomUUID(),
        name,
        subject: newSetSubject,
        grade: newSetGrade,
        createdAt: new Date().toISOString(),
        questions,
      };

      await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSet),
      });

      const res = await fetch("/api/exercises");
      setExerciseSets(await res.json());
      setNewSetName("");
      setNewSetSubject("");
      setNewSetGrade("");
      alert(`Đã import ${questions.length} câu hỏi!`);
    } catch {
      alert("Lỗi khi đọc file Excel!");
    } finally {
      setImporting(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteSet = async (id: string) => {
    if (confirm("X\u00f3a b\u00e0i t\u1eadp n\u00e0y?")) {
      await fetch(`/api/exercises?id=${id}`, { method: "DELETE" });
      const res = await fetch("/api/exercises");
      setExerciseSets(await res.json());
      if (editingSet?.id === id) setEditingSet(null);
    }
  };

  const handleEditQuestion = (qIndex: number, field: keyof Question, value: string | number | string[]) => {
    if (!editingSet) return;
    const updated = {
      ...editingSet, questions: editingSet.questions.map((q, i) => {
        if (i !== qIndex) return q;
        return { ...q, [field]: value };
      })
    };
    setEditingSet(updated);
  };

  const handleEditOption = (qIndex: number, optIndex: number, value: string) => {
    if (!editingSet) return;
    const updated = {
      ...editingSet, questions: editingSet.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const newOptions = [...q.options];
        newOptions[optIndex] = value;
        return { ...q, options: newOptions };
      })
    };
    setEditingSet(updated);
  };

  const handleAddQuestion = () => {
    if (!editingSet) return;
    setEditingSet({
      ...editingSet,
      questions: [...editingSet.questions, {
        question: "",
        options: ["A. ", "B. ", "C. ", "D. "],
        correct: 0,
        explanation: "",
      }],
    });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!editingSet) return;
    setEditingSet({
      ...editingSet,
      questions: editingSet.questions.filter((_, i) => i !== qIndex),
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSet) return;
    const valid = editingSet.questions.filter(q => q.question.trim() && q.options.every(o => o.trim()));
    if (valid.length === 0) {
      alert("Cần ít nhất 1 câu hỏi hợp lệ!");
      return;
    }
    setSavingEdit(true);
    try {
      const toSave = { ...editingSet, questions: valid };
      await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSave),
      });
      const res = await fetch("/api/exercises");
      setExerciseSets(await res.json());
      setEditingSet(null);
      alert("Đã lưu!");
    } finally {
      setSavingEdit(false);
    }
  };

  // Leaderboard filter
  const filteredLb = lb.filter((e) => {
    const isTeacherEntry = e.isTeacher || e.subject === "teacher";
    const matchType =
      lbTypeFilter === "all" ||
      (lbTypeFilter === "teacher" ? isTeacherEntry : !isTeacherEntry);
    const matchSubject = lbSubjectFilter === "all" || e.subject === lbSubjectFilter;
    const matchGrade = lbGradeFilter === "all" || e.grade === lbGradeFilter;
    const matchName = !lbNameFilter.trim() || e.player.toLowerCase().includes(lbNameFilter.trim().toLowerCase());
    return matchType && matchSubject && matchGrade && matchName;
  });

  if (!mounted) return null;

  if (!adminLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Giáo viên</h1>
          <p className="text-gray-400 text-sm mb-6">Nhập mã PIN để truy cập</p>
          <input
            type="password"
            value={adminPin}
            onChange={(e) => setAdminPin(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            placeholder="Mã PIN"
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-lg text-center tracking-widest mb-4"
            maxLength={4}
          />
          <button
            type="button"
            onClick={handleAdminLogin}
            disabled={loginLoading}
            className="w-full py-3 rounded-xl font-bold text-white bg-purple-600 cursor-pointer disabled:opacity-50"
          >
            {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center pt-4 pb-2">
          <h1 className="text-3xl font-extrabold text-purple-600">Giáo viên</h1>
          <a href="/" className="text-sm text-purple-400 underline">{"\u2190 V\u1ec1 trang ch\u1ee7"}</a>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <h2 className="text-lg font-bold text-gray-700 mb-4">{"M\u00e3 QR cho h\u1ecdc sinh"}</h2>
          <div className="inline-block bg-white p-4 rounded-2xl border-2 border-gray-100 mb-4">
            <QRCodeSVG value={siteUrl} size={200} />
          </div>
          <p className="text-sm text-gray-500 mb-3">{siteUrl}</p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-purple-600 cursor-pointer"
            >
              {"Ph\u00f3ng to QR"}
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(siteUrl);
                alert("\u0110\u00e3 copy link!");
              }}
              className="px-5 py-2 rounded-xl text-sm font-bold text-purple-600 bg-purple-50 cursor-pointer"
            >
              {"Copy link"}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">{"M\u1eadt kh\u1ea9u l\u1edbp h\u1ecdc"}</h2>
          {classPassword ? (
            <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
              <p className="text-sm text-gray-500">{"M\u1eadt kh\u1ea9u hi\u1ec7n t\u1ea1i:"}</p>
              <p className="text-2xl font-bold text-green-600 tracking-widest">{classPassword}</p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-orange-50 rounded-xl border border-orange-200">
              <p className="text-sm text-orange-600">{"Ch\u01b0a \u0111\u1eb7t m\u1eadt kh\u1ea9u - ai c\u0169ng v\u00e0o \u0111\u01b0\u1ee3c"}</p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={"Nh\u1eadp m\u1eadt kh\u1ea9u m\u1edbi..."}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none"
            />
            <button
              type="button"
              onClick={handleSetPassword}
              disabled={savingPassword}
              className="px-5 py-3 rounded-xl font-bold text-white bg-purple-600 cursor-pointer disabled:opacity-50"
            >
              {savingPassword ? "..." : "Đặt"}
            </button>
          </div>
          {classPassword && (
            <button
              type="button"
              onClick={handleRemovePassword}
              className="mt-3 text-sm text-red-400 underline cursor-pointer"
            >
              {"X\u00f3a m\u1eadt kh\u1ea9u"}
            </button>
          )}
        </div>

        {/* Exercise Management */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">{"B\u00e0i t\u1eadp t\u1eeb gi\u00e1o vi\u00ean"}</h2>

          {/* Import */}
          <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-sm font-semibold text-purple-700 mb-3">{"Import t\u1eeb file Excel"}</p>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              placeholder="Tên bài tập (VD: Toán Chương 3)..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm mb-2"
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <select
                value={newSetSubject}
                onChange={(e) => setNewSetSubject(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
              >
                <option value="">— Chọn môn —</option>
                <option value="math">Toán</option>
                <option value="vietnamese">Tiếng Việt</option>
                <option value="english">Tiếng Anh</option>
              </select>
              <select
                value={newSetGrade}
                onChange={(e) => setNewSetGrade(e.target.value)}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
              >
                <option value="">— Chọn lớp —</option>
                <option value="1">Lớp 1</option>
                <option value="2">Lớp 2</option>
                <option value="3">Lớp 3</option>
                <option value="4">Lớp 4</option>
                <option value="5">Lớp 5</option>
              </select>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-purple-600 cursor-pointer disabled:opacity-50"
              >
                {importing ? "Đang import..." : "Chọn file Excel"}
              </button>
              <button
                type="button"
                onClick={downloadTemplate}
                className="py-2 px-3 rounded-lg font-bold text-sm text-purple-600 bg-white border border-purple-300 cursor-pointer"
              >
                {"T\u1ea3i m\u1eabu"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {"C\u1ed9t: question, option_a, option_b, option_c, option_d, correct (A/B/C/D), explanation"}
            </p>
          </div>

          {/* Exercise list */}
          {exerciseSets.length === 0 ? (
            <p className="text-gray-400 text-center py-4">{"Ch\u01b0a c\u00f3 b\u00e0i t\u1eadp n\u00e0o"}</p>
          ) : (
            <div className="space-y-3">
              {exerciseSets.map((set) => (
                <div key={set.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-700">{set.name}</p>
                      <p className="text-xs text-gray-400">
                        {subjectMap[set.subject || ""] || ""}{set.grade ? ` · Lớp ${set.grade}` : ""}{set.subject || set.grade ? " · " : ""}{set.questions.length} câu · {new Date(set.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingSet(editingSet?.id === set.id ? null : { ...set, questions: set.questions.map(q => ({ ...q, options: [...q.options] })) })}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-purple-600 bg-purple-100 cursor-pointer"
                      >
                        {editingSet?.id === set.id ? "\u0110\u00f3ng" : "S\u1eeda"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSet(set.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-red-500 bg-red-50 cursor-pointer"
                      >
                        {"X\u00f3a"}
                      </button>
                    </div>
                  </div>

                  {/* Inline editor */}
                  {editingSet?.id === set.id && (
                    <div className="mt-4 space-y-4">
                      <input
                        type="text"
                        value={editingSet.name}
                        onChange={(e) => setEditingSet({ ...editingSet, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm font-bold"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={editingSet.subject || ""}
                          onChange={(e) => setEditingSet({ ...editingSet, subject: e.target.value || undefined })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
                        >
                          <option value="">— Chọn môn —</option>
                          <option value="math">Toán</option>
                          <option value="vietnamese">Tiếng Việt</option>
                          <option value="english">Tiếng Anh</option>
                        </select>
                        <select
                          value={editingSet.grade || ""}
                          onChange={(e) => setEditingSet({ ...editingSet, grade: e.target.value || undefined })}
                          className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white"
                        >
                          <option value="">— Chọn lớp —</option>
                          <option value="1">Lớp 1</option>
                          <option value="2">Lớp 2</option>
                          <option value="3">Lớp 3</option>
                          <option value="4">Lớp 4</option>
                          <option value="5">Lớp 5</option>
                        </select>
                      </div>

                      {editingSet.questions.map((q, qi) => (
                        <div key={qi} className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500">{`C\u00e2u ${qi + 1}`}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(qi)}
                              className="text-xs text-red-400 cursor-pointer"
                            >
                              {"X\u00f3a c\u00e2u"}
                            </button>
                          </div>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => handleEditQuestion(qi, "question", e.target.value)}
                            placeholder={"C\u00e2u h\u1ecfi..."}
                            className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm outline-none focus:border-purple-400"
                          />
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qi}`}
                                checked={q.correct === oi}
                                onChange={() => handleEditQuestion(qi, "correct", oi)}
                                className="accent-purple-600"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleEditOption(qi, oi, e.target.value)}
                                className="flex-1 px-2 py-1 rounded border border-gray-200 text-sm outline-none focus:border-purple-400"
                              />
                            </div>
                          ))}
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) => handleEditQuestion(qi, "explanation", e.target.value)}
                            placeholder={"Gi\u1ea3i th\u00edch..."}
                            className="w-full px-3 py-1.5 rounded border border-gray-200 text-sm outline-none focus:border-purple-400"
                          />
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="flex-1 py-2 rounded-lg text-sm font-bold text-purple-600 bg-purple-50 border border-purple-200 cursor-pointer"
                        >
                          {"+ Th\u00eam c\u00e2u h\u1ecfi"}
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={savingEdit}
                          className="flex-1 py-2 rounded-lg text-sm font-bold text-white bg-purple-600 cursor-pointer disabled:opacity-50"
                        >
                          {savingEdit ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-700">{"\u{1F3C6} B\u1ea3ng x\u1ebfp h\u1ea1ng"}</h2>
            {lb.length > 0 && (
              <button
                type="button"
                onClick={handleClearLeaderboard}
                className="text-sm text-red-400 underline cursor-pointer"
              >
                {"X\u00f3a t\u1ea5t c\u1ea3"}
              </button>
            )}
          </div>
          {lb.length > 0 && (
            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={lbNameFilter}
                onChange={(e) => setLbNameFilter(e.target.value)}
                placeholder="Tìm tên học sinh..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
              />
              <select
                value={lbTypeFilter}
                onChange={(e) => setLbTypeFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white font-medium text-gray-700"
              >
                <option value="all">Tất cả loại</option>
                <option value="ai">Bài tập từ AI</option>
                <option value="teacher">Bài tập từ giáo viên</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={lbSubjectFilter}
                  onChange={(e) => setLbSubjectFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white font-medium text-gray-700"
                >
                  <option value="all">Tất cả môn</option>
                  <option value="math">Toán</option>
                  <option value="vietnamese">Tiếng Việt</option>
                  <option value="english">Tiếng Anh</option>
                </select>
                <select
                  value={lbGradeFilter}
                  onChange={(e) => setLbGradeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm bg-white font-medium text-gray-700"
                >
                  <option value="all">Tất cả lớp</option>
                  <option value="1">Lớp 1</option>
                  <option value="2">Lớp 2</option>
                  <option value="3">Lớp 3</option>
                  <option value="4">Lớp 4</option>
                  <option value="5">Lớp 5</option>
                </select>
              </div>
            </div>
          )}
          {filteredLb.length === 0 ? (
            <p className="text-gray-400 text-center py-8">{"Ch\u01b0a c\u00f3 k\u1ebft qu\u1ea3 n\u00e0o"}</p>
          ) : (
            <div className="space-y-2">
              {filteredLb.slice(0, 30).map((entry, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? "bg-yellow-50 border border-yellow-200"
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
                      <span className="text-xs text-gray-400 ml-2">
                        {(entry.isTeacher || entry.subject === "teacher") ? "GV · " : ""}
                        {subjectMap[entry.subject] || entry.subject}{entry.grade ? ` L${entry.grade}` : ""}
                      </span>
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

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-4">Cài đặt</h2>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="w-full py-3 rounded-xl font-bold text-purple-600 bg-purple-50 cursor-pointer mb-3"
          >
            Đổi mã PIN quản trị
          </button>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPinModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-700 mb-4 text-center">Đổi mã PIN</h2>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="PIN hiện tại"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-center tracking-widest"
                maxLength={4}
                inputMode="numeric"
              />
              <input
                type="password"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                placeholder="PIN mới (4 số)"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 outline-none text-center tracking-widest"
                maxLength={4}
                inputMode="numeric"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowPinModal(false); setCurrentPinInput(""); setNewPinInput(""); }}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleChangePin}
                  disabled={changingPin}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-purple-600 cursor-pointer disabled:opacity-50"
                >
                  {changingPin ? "Đang đổi..." : "Đổi PIN"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowQrModal(false)}>
          <div className="bg-white rounded-3xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-purple-600 mb-4">Quiz AI</h2>
            <QRCodeSVG value={siteUrl} size={300} />
            <p className="text-gray-500 mt-4 text-lg">{"Qu\u00e9t \u0111\u1ec3 v\u00e0o ch\u01a1i!"}</p>
            {classPassword && (
              <p className="text-gray-400 mt-2">{`M\u1eadt kh\u1ea9u: ${classPassword}`}</p>
            )}
            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-gray-500 bg-gray-100 cursor-pointer"
            >
              {"\u0110\u00f3ng"}
            </button>
          </div>
        </div>
      )}

      <footer className="text-center py-8 text-sm text-gray-500">
        © Quiz AI.Built by Nguyen Thi Hoang Ngan.
      </footer>
    </main>
  );
}
