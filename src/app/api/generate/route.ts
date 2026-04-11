import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

interface GeneratedQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { subject, grade, topic, count = 5 } = await req.json();

    const subjectMap: Record<string, string> = {
      math: "Toán",
      vietnamese: "Tiếng Việt",
      english: "Tiếng Anh",
    };

    const subjectName = subjectMap[subject] || subject;
    const numQuestions = Math.min(Math.max(Number(count), 5), 30);

    const prompt = `Bạn là giáo viên tiểu học tạo đề trắc nghiệm. Tạo ${numQuestions} câu hỏi môn ${subjectName} lớp ${grade}, chủ đề: "${topic}".

YÊU CẦU QUAN TRỌNG:
- Mỗi câu có đúng 4 đáp án A, B, C, D
- "correct" là chỉ số (0=A, 1=B, 2=C, 3=D) của đáp án ĐÚNG
- PHẢI ĐẢM BẢO đáp án đúng là CHÍNH XÁC về mặt kiến thức
- Giải thích phải KHỚP với đáp án đúng đã chọn
- Kiểm tra lại từng câu trước khi trả về: đáp án ở vị trí "correct" có thực sự đúng không?
${subject === "english" ? "- Câu hỏi bằng tiếng Anh, giải thích bằng tiếng Việt" : ""}

Trả về JSON thuần (không markdown, không giải thích thêm):
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "Bạn là giáo viên tiểu học. Trả về JSON thuần, không markdown. Đảm bảo mọi đáp án đều chính xác 100%. Trường correct phải là index (0-3) của đáp án đúng trong mảng options.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: numQuestions <= 10 ? 3000 : 8000,
    });

    const text = completion.choices[0]?.message?.content || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Không thể tạo câu hỏi" }, { status: 500 });
    }

    const questions: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate: correct index must be within options range
    const validated = questions.filter(
      (q) =>
        q.question &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correct === "number" &&
        q.correct >= 0 &&
        q.correct <= 3 &&
        q.explanation,
    );

    if (validated.length === 0) {
      return NextResponse.json({ error: "Không thể tạo câu hỏi" }, { status: 500 });
    }

    return NextResponse.json({ questions: validated });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo câu hỏi" }, { status: 500 });
  }
}
