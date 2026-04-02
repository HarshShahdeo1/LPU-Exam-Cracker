import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

import { requireRequestUser } from "@/lib/auth";
import { getOpenAIClient, getOpenAIModel } from "@/lib/openai";
import { normalizeStudyReport, saveUserReport } from "@/lib/reports";

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
  try {
    const user = await requireRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: "You must be signed in to analyze a PDF." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json({ error: "Only PDF uploads are supported." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large. Keep uploads under 10 MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfResult = await pdf(buffer);
    const extractedText = cleanExtractedText(pdfResult.text ?? "");

    if (!extractedText) {
      return NextResponse.json(
        { error: "No readable text was found in this PDF." },
        { status: 422 }
      );
    }

    const completion = await getOpenAIClient().chat.completions.create({
      model: getOpenAIModel(),
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

    const modelContent = completion.choices[0]?.message?.content;

    if (!modelContent) {
      return NextResponse.json(
        { error: "OpenAI did not return a structured response." },
        { status: 502 }
      );
    }

    const normalizedReport = normalizeStudyReport(JSON.parse(modelContent), file.name);
    const reportId = await saveUserReport({
      uid: user.uid,
      fileName: file.name,
      sourceExcerpt: extractedText.slice(0, 500),
      sourceLength: extractedText.length,
      report: normalizedReport
    });

    return NextResponse.json({
      reportId,
      report: normalizedReport
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected failure while analyzing the PDF."
      },
      { status: 500 }
    );
  }
}
