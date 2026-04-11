import * as XLSX from "xlsx";

export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface ExerciseSet {
  id: string;
  name: string;
  createdAt: string;
  questions: Question[];
}

const correctMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

function ensurePrefix(text: string, letter: string): string {
  const trimmed = String(text).trim();
  const regex = new RegExp(`^${letter}\\.\\s*`, "i");
  if (regex.test(trimmed)) return trimmed;
  return `${letter}. ${trimmed}`;
}

export async function parseExcelToQuestions(file: File): Promise<Question[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const questions: Question[] = [];

  for (const row of rows) {
    const question = String(row["question"] || row["cau_hoi"] || "").trim();
    const optA = String(row["option_a"] || row["dap_an_a"] || row["A"] || "").trim();
    const optB = String(row["option_b"] || row["dap_an_b"] || row["B"] || "").trim();
    const optC = String(row["option_c"] || row["dap_an_c"] || row["C"] || "").trim();
    const optD = String(row["option_d"] || row["dap_an_d"] || row["D"] || "").trim();
    const correct = String(row["correct"] || row["dap_an"] || "").trim().toLowerCase();
    const explanation = String(row["explanation"] || row["giai_thich"] || "").trim();

    if (!question || !optA || !optB || !optC || !optD) continue;
    if (correctMap[correct] === undefined) continue;

    questions.push({
      question,
      options: [
        ensurePrefix(optA, "A"),
        ensurePrefix(optB, "B"),
        ensurePrefix(optC, "C"),
        ensurePrefix(optD, "D"),
      ],
      correct: correctMap[correct],
      explanation: explanation || "",
    });
  }

  return questions;
}

export function downloadTemplate(): void {
  const data = [
    ["question", "option_a", "option_b", "option_c", "option_d", "correct", "explanation"],
    ["2 + 3 = ?", "4", "5", "6", "7", "B", "Vi 2 cong 3 bang 5"],
    ["Thu do Viet Nam la gi?", "Ha Noi", "TP HCM", "Da Nang", "Hue", "A", "Ha Noi la thu do"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  XLSX.writeFile(wb, "quiz-template.xlsx");
}
