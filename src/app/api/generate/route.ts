import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

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

    const prompt = `Tạo ${numQuestions} câu hỏi trắc nghiệm môn ${subjectName} lớp ${grade} tiểu học, chủ đề: "${topic}".
Mỗi câu 4 đáp án, 1 đáp án đúng, có giải thích ngắn.
${subject === "english" ? "Câu hỏi tiếng Anh, giải thích tiếng Việt." : ""}
Trả về JSON thuần, không markdown:
[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]`;

    const completion = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: numQuestions <= 10 ? 3000 : 8000,
    });

    const text = completion.choices[0]?.message?.content || "";

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Không thể tạo câu hỏi" }, { status: 500 });
    }

    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Lỗi khi tạo câu hỏi" }, { status: 500 });
  }
}
