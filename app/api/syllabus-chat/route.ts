import { NextRequest, NextResponse } from "next/server";

import { requireRequestUser } from "@/lib/auth";
import { getOpenAIClient, getOpenAIModel, getAIProviderName } from "@/lib/openai";
import { getUserReportChatContext } from "@/lib/reports";
import { StudyReport } from "@/types/report";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_QUESTION_CHARS = 400;

const SYSTEM_PROMPT = `You are "Ask Your Syllabus", an LPU exam-prep assistant.

Use only the provided syllabus text and structured study report.
Rules:
- Answer clearly and concisely in an exam-oriented style.
- If the question asks for a short-answer, 2-mark, or 5-mark prompt, generate it using only topics grounded in the supplied syllabus.
- If the user asks which topic is most difficult or most important, make a reasonable inference from the syllabus and explicitly say it is an inference.
- If the answer is not supported by the syllabus context, say that the syllabus does not provide enough detail.
- Do not invent books, chapters, marks distribution, or facts that are not present in the context.`;

function buildStudyOutline(report: StudyReport) {
  return report.units
    .map((unit) => {
      return [
        `Unit ${unit.unitNumber}: ${unit.unitTitle}`,
        `Summary: ${unit.summary.join(" | ")}`,
        `High-weightage: ${unit.highWeightageTopics.join(" | ")}`
      ].join("\n");
    })
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to chat with a syllabus." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          reportId?: string;
          question?: string;
          activeUnitNumber?: number;
          activeUnitTitle?: string;
        }
      | null;

    const reportId = typeof body?.reportId === "string" ? body.reportId.trim() : "";
    const question = typeof body?.question === "string" ? body.question.trim() : "";
    const activeUnitNumber =
      typeof body?.activeUnitNumber === "number" ? body.activeUnitNumber : null;
    const activeUnitTitle =
      typeof body?.activeUnitTitle === "string" ? body.activeUnitTitle.trim() : "";

    if (!reportId) {
      return NextResponse.json({ error: "Missing report ID for syllabus chat." }, { status: 400 });
    }

    if (!question) {
      return NextResponse.json({ error: "Ask a question about the syllabus first." }, { status: 400 });
    }

    if (question.length > MAX_QUESTION_CHARS) {
      return NextResponse.json(
        { error: `Keep the question under ${MAX_QUESTION_CHARS} characters.` },
        { status: 413 }
      );
    }

    const context = await getUserReportChatContext(user.uid, reportId);

    if (!context) {
      return NextResponse.json({ error: "This syllabus report could not be found." }, { status: 404 });
    }

    if (!context.sourceText) {
      return NextResponse.json(
        {
          error:
            "This report was created before full syllabus chat was enabled. Re-run the analysis to unlock Ask Your Syllabus."
        },
        { status: 409 }
      );
    }

    const completion = await getOpenAIClient().chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Course: ${context.report.courseTitle}
File: ${context.fileName}
Focused unit: ${
            activeUnitNumber && activeUnitTitle
              ? `Unit ${activeUnitNumber} - ${activeUnitTitle}`
              : "None selected"
          }

Structured study outline:
${buildStudyOutline(context.report)}

Syllabus text:
${context.sourceText}

User question:
${question}`
        }
      ]
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: `${getAIProviderName()} did not return a syllabus answer.` },
        { status: 502 }
      );
    }

    return NextResponse.json({
      answer,
      provider: getAIProviderName()
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unexpected failure while answering the syllabus question."
      },
      { status: 500 }
    );
  }
}
