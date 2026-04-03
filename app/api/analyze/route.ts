import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

import { SessionUser, requireRequestUser } from "@/lib/auth";
import { getAIProviderName, getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { normalizeStudyReport, saveUserReport } from "@/lib/reports";
import { AnalysisFailureStage, safeRecordAnalysisEvent } from "@/lib/system-health";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SOURCE_CHARS = 30000;

const SYSTEM_PROMPT =
  "You are an LPU Academic Expert. Identify Units 1-4. For each unit, provide a 5-point summary, 3 high-weightage topics for the ETE, and 5 MCQs with options and correct answers. Return the data ONLY as a structured JSON object.";

function cleanExtractedText(value: string) {
  return value.replace(/\u0000/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_CHARS);
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
      temperature: 0.2,
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: `Analyze the following LPU syllabus and return JSON using this shape:
{
  "courseTitle": "string",
  "overview": "string",
  "units": [
    {
      "unitNumber": 1,
      "unitTitle": "string",
      "summary": ["string", "string", "string", "string", "string"],
      "highWeightageTopics": ["string", "string", "string"],
      "mcqs": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  ]
}

Rules:
- Include exactly 4 units.
- Include exactly 5 summary bullets per unit.
- Include exactly 3 high-weightage topics per unit.
- Include exactly 5 MCQs per unit.
- Do not wrap the JSON in markdown.

Syllabus text:
${extractedText}`
        }
      ]
    });
    providerLatencyMs = Date.now() - providerStartedAt;

    const modelContent = completion.choices[0]?.message?.content;

    if (!modelContent) {
      return fail(502, `${aiProvider} did not return a structured response.`, "llm");
    }

    const normalizedReport = normalizeStudyReport(JSON.parse(modelContent), file.name);
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
