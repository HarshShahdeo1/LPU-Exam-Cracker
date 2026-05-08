import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

import { SessionUser, requireRequestUser } from "@/lib/auth";
import { getAIProviderName, getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { normalizeStudyReport, saveUserReport } from "@/lib/reports";
import { AnalysisFailureStage, safeRecordAnalysisEvent } from "@/lib/system-health";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_CHARS = 20000; // capture more syllabus detail

const SYSTEM_PROMPT =
  "You are an Academic Architect. Your task is to map out the structure of an LPU syllabus. You identify the course identity and the skeletal structure of the units. You do NOT generate study content yet—only the structural roadmap. Return strict JSON.";

function cleanExtractedText(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_CHARS);
}

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
  const requestStartedAt = Date.now();
  const aiProvider = getAIProviderName();
  const aiModel = getOpenAIModel();
  let user: SessionUser | null = null;
  let fileName = "";
  let sourceLength = 0;
  let providerLatencyMs = 0;
  let firebaseWriteMs = 0;
  let failureStage: AnalysisFailureStage = "validation";

  async function fail(status: number, error: string, stage: AnalysisFailureStage) {
    if (user) {
      await safeRecordAnalysisEvent({
        uid: user.uid,
        fileName,
        status: "failure",
        aiProvider,
        aiModel,
        failureStage: stage,
        errorMessage: error,
        providerLatencyMs,
        firebaseWriteMs,
        totalDurationMs: Date.now() - requestStartedAt,
        sourceLength
      });
    }

    return NextResponse.json({ error }, { status });
  }

  try {
    user = await requireRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to analyze a PDF." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return fail(400, "Please upload a PDF file.", "validation");
    }

    fileName = file.name;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return fail(400, "Only PDF uploads are supported.", "validation");
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return fail(413, "PDF is too large. Keep uploads under 10 MB.", "validation");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    failureStage = "pdf_parse";
    const pdfResult = await pdf(buffer);
    const extractedText = cleanExtractedText(pdfResult.text ?? "");
    sourceLength = extractedText.length;

    if (!extractedText) {
      return fail(422, "No readable text was found in this PDF.", "pdf_parse");
    }

    failureStage = "llm";
    const providerStartedAt = Date.now();
    const completion = await getOpenAIClient().chat.completions.create({
      model: aiModel,
      temperature: 0.1,
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Map the skeletal structure of the LPU syllabus below. 

Return a JSON object with this exact structure:
{
  "courseTitle": "Full Course Name",
  "overview": "A high-level pedagogical summary of the course (2-3 sentences).",
  "units": [
    {
      "unitNumber": 1,
      "unitTitle": "Official Unit Title",
      "highWeightageTopics": ["Topic 1", "Topic 2", "Topic 3"]
    }
  ]
}

Analytical Rules:
1. Detect all units present in the syllabus.
2. For each unit, only extract the official title and 3-5 core high-weightage topics.
3. Do NOT generate summaries, MCQs, or key terms yet.
4. Return ONLY the JSON object.

Syllabus Content:
${extractedText}`
        }
      ]
    });
    providerLatencyMs = Date.now() - providerStartedAt;

    const rawContent = completion.choices[0]?.message?.content;

    if (!rawContent) {
      return fail(502, `${aiProvider} did not return a structured response.`, "llm");
    }

    let parsedContent: unknown;
    try {
      parsedContent = extractJSON(rawContent);
    } catch (parseErr) {
      console.error("[analyze] JSON parse failed:", parseErr, "\nRaw:", rawContent.slice(0, 500));
      return fail(
        502,
        "The AI returned incomplete or malformed JSON. Try again — larger syllabuses sometimes exceed the model's output limit.",
        "llm"
      );
    }

    const normalizedReport = normalizeStudyReport(parsedContent, file.name);
    failureStage = "firestore";
    const firebaseStartedAt = Date.now();
    const reportId = await saveUserReport({
      uid: user.uid,
      fileName: file.name,
      sourceExcerpt: extractedText.slice(0, 500),
      sourceText: extractedText,
      sourceLength: extractedText.length,
      report: normalizedReport
    });
    firebaseWriteMs = Date.now() - firebaseStartedAt;

    await safeRecordAnalysisEvent({
      uid: user.uid,
      fileName,
      status: "success",
      aiProvider,
      aiModel,
      providerLatencyMs,
      firebaseWriteMs,
      totalDurationMs: Date.now() - requestStartedAt,
      sourceLength,
      reportId
    });

    return NextResponse.json({
      reportId,
      report: normalizedReport
    });
  } catch (error) {
    if (user) {
      await safeRecordAnalysisEvent({
        uid: user.uid,
        fileName,
        status: "failure",
        aiProvider,
        aiModel,
        failureStage,
        errorMessage:
          error instanceof Error ? error.message : "Unexpected failure while analyzing the PDF.",
        providerLatencyMs,
        firebaseWriteMs,
        totalDurationMs: Date.now() - requestStartedAt,
        sourceLength
      });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected failure while analyzing the PDF."
      },
      { status: 500 }
    );
  }
}
