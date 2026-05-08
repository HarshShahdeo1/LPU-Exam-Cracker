import { NextRequest, NextResponse } from "next/server";

import { requireRequestUser } from "@/lib/auth";
import { getChatAIClient, getChatAIModel, getChatAIProviderName } from "@/lib/openai";
import { getUserReportChatContext } from "@/lib/reports";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_SYLLABUS_CHARS = 12000;

export async function GET() {
  return NextResponse.json({ provider: getChatAIProviderName() });
}

const SYSTEM_PROMPT =
  "You are a versatile Academic Tutor. Your goal is to help students understand their subjects deeply. " +
  "While you have the student's syllabus for context, you should NOT be limited by it. " +
  "If a student asks a general question, provide a direct and comprehensive answer using your full expert knowledge. " +
  "Do NOT start answers by saying 'the syllabus doesn't mention this' or 'this isn't in the text.' " +
  "Instead, be a helpful teacher: explain the concept clearly first, and then optionally mention how it relates to their specific syllabus units or exam topics. " +
  "Keep your tone encouraging, professional, and insightful. " +
  "CRITICAL RULE: Keep your answers VERY CONCISE. Aim for 4 to 6 sentences maximum. " +
  "Give the core answer quickly. If the topic is complex, give the summary and end by asking 'Would you like me to go deeper into this?' " +
  "If the student just greets you (e.g., 'hi', 'hello'), respond with a short, friendly greeting and ask how you can help today—do NOT write a long paragraph.";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      reportId?: string;
      question?: string;
      activeUnitNumber?: number;
      activeUnitTitle?: string;
      deepStudyContext?: string[];
    } | null;

    const reportId = typeof body?.reportId === "string" ? body.reportId.trim() : "";
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const unitNumber = body?.activeUnitNumber ?? null;
    const unitTitle = body?.activeUnitTitle ?? "";
    const subtopics = body?.deepStudyContext ?? [];

    if (!reportId || !question) {
      return NextResponse.json({ error: "Missing reportId or question." }, { status: 400 });
    }

    const context = await getUserReportChatContext(user.uid, reportId);

    if (!context) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (!context.sourceText) {
      return NextResponse.json(
        { error: "Syllabus text not available for this report." },
        { status: 409 }
      );
    }

    const syllabusSlice = context.sourceText.slice(0, MAX_SYLLABUS_CHARS);
    
    // Format the UI context so the AI knows what the user is looking at
    const uiContext = subtopics.length > 0 
      ? `\nThe student is currently looking at these Deep Study subtopics on their screen:\n${subtopics.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n(If they refer to 'the first one' or 'number 2', they mean these topics).`
      : "";

    const completion = await getChatAIClient().chat.completions.create({
      model: getChatAIModel(),
      temperature: 0.7,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Course: ${context.report.courseTitle}
Active Unit ${unitNumber}: ${unitTitle}
${uiContext}

Syllabus Context:
${syllabusSlice}

Student Question:
${question}`
        }
      ],
      // NVIDIA deepseek models often need this extra_body parameter
      extra_body: {
        chat_template_kwargs: { thinking: false }
      }
    } as any);

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: `${getChatAIProviderName()} returned no answer.` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
      provider: getChatAIProviderName()
    });
  } catch (error) {
    console.error("[syllabus-chat] Error:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unexpected error in syllabus chat.",
        details: error instanceof Error ? (error as any).status : undefined
      },
      { status: 500 }
    );
  }
}
