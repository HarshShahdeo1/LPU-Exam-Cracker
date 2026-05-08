import { NextRequest, NextResponse } from "next/server";

import { requireRequestUser } from "@/lib/auth";
import { getAIProviderName, getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { getUserReportChatContext } from "@/lib/reports";

export const runtime = "nodejs";
export const maxDuration = 60;

// Limit how much syllabus text we send — keeps output from being cut off
const MAX_SYLLABUS_CHARS = 8000;

const SYSTEM_PROMPT =
  "You are an LPU Elite Academic Content Creator. Your task is to generate a deep-dive study guide for ONE specific unit of a syllabus. You provide a comprehensive summary, detailed subtopics, key terms, formulae, exam tips, and challenging MCQs. Your output must be pedagogical, accurate, and formatted as strict JSON.";

/**
 * Robustly extract the first complete JSON object from a string.
 * Handles cases where the model wraps JSON in markdown fences or adds trailing text.
 */
function extractJSON(text: string): unknown {
  // 1. Strip ```json ... ``` fences
  const cleaned = text.replace(/^```[\w]*\s*/m, "").replace(/\s*```\s*$/m, "").trim();

  // 2. Try direct parse first
  try {
    return JSON.parse(cleaned);
  } catch {
    // 3. Find first { ... } block
    const start = cleaned.indexOf("{");
    const end   = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fall through to truncation repair
      }
    }

    // 4. Try to repair truncated JSON by closing unclosed braces/brackets
    const partial = start !== -1 ? cleaned.slice(start) : cleaned;
    const repaired = repairTruncatedJSON(partial);
    return JSON.parse(repaired);
  }
}

/**
 * Attempt to repair truncated JSON by counting and closing open brackets/braces.
 */
function repairTruncatedJSON(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escape   = false;

  for (const ch of text) {
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === "\"") { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{" || ch === "[") stack.push(ch === "{" ? "}" : "]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  // Close remaining open structures
  return text + stack.reverse().join("");
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      reportId?: string;
      unitNumber?: number;
      unitTitle?: string;
      summary?: string[];
    } | null;

    const reportId   = typeof body?.reportId   === "string" ? body.reportId.trim()  : "";
    const unitNumber = typeof body?.unitNumber  === "number" ? body.unitNumber       : null;
    const unitTitle  = typeof body?.unitTitle   === "string" ? body.unitTitle.trim() : "";
    const summary    = Array.isArray(body?.summary) ? body.summary : [];

    if (!reportId || !unitNumber || !unitTitle) {
      return NextResponse.json({ error: "Missing reportId, unitNumber, or unitTitle." }, { status: 400 });
    }

    const context = await getUserReportChatContext(user.uid, reportId);

    if (!context) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    if (!context.sourceText) {
      return NextResponse.json(
        { error: "This report has no syllabus text. Re-upload the PDF to enable deep summaries." },
        { status: 409 }
      );
    }

    // Trim syllabus text to avoid token overflow
    const syllabusSlice = context.sourceText.slice(0, MAX_SYLLABUS_CHARS);

    const completion = await getOpenAIClient().chat.completions.create({
      model: getOpenAIModel(),
      temperature: 0.2,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Course: ${context.report.courseTitle}
Unit ${unitNumber}: ${unitTitle}

Syllabus context for this unit:
${syllabusSlice}

Generate a comprehensive study packet for this unit. Return a JSON object:
{
  "summary": ["Point 1 (Core concept)", "Point 2 (Key method)", "Point 3", "Point 4", "Point 5"],
  "subtopics": [
    { "title": "Subtopic Name", "explanation": "2-3 sentence detailed academic explanation." }
  ],
  "keyTerms": [
    { "term": "Term", "definition": "Academic definition." }
  ],
  "formulae": [
    { "name": "Formula name", "expression": "LATEX_OR_TEXT", "note": "Application note." }
  ],
  "examTips": ["Actionable exam tip"],
  "mcqs": [
    {
      "question": "Deep conceptual question?",
      "options": ["A", "B", "C", "D"],
      "correctAnswerIndex": 0,
      "explanation": "Why this is correct."
    }
  ]
}

Analytical Rules:
1. Generate exactly 5 summary points.
2. 5-8 detailed subtopics.
3. 5-8 key terms.
4. All relevant formulae (or [] if none).
5. 3 exam tips.
6. 5 high-quality MCQs.
7. Return ONLY the JSON object.`
        }
      ]
    });

    const raw = completion.choices[0]?.message?.content?.trim();

    if (!raw) {
      return NextResponse.json(
        { error: `${getAIProviderName()} returned no content.` },
        { status: 502 }
      );
    }

    let parsed: unknown;
    try {
      parsed = extractJSON(raw);
    } catch (parseErr) {
      console.error("[unit-detail] JSON parse failed:", parseErr, "\nRaw:", raw.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned incomplete JSON. Please try again — the model may have been too brief." },
        { status: 502 }
      );
    }

    return NextResponse.json({ detail: parsed, provider: getAIProviderName() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error generating unit detail." },
      { status: 500 }
    );
  }
}
