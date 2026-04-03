import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import { StoredUserReport, StudyReport } from "@/types/report";

type SaveUserReportInput = {
  uid: string;
  fileName: string;
  sourceExcerpt: string;
  sourceText: string;
  sourceLength: number;
  report: StudyReport;
};

const OPTION_KEYS = ["A", "B", "C", "D"];

function normalizeStringList(value: unknown, expectedLength: number, fallbackPrefix: string) {
  const list = Array.isArray(value)
    ? value
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean)
        .slice(0, expectedLength)
    : [];

  while (list.length < expectedLength) {
    list.push(`${fallbackPrefix} ${list.length + 1}`);
  }

  return list;
}

function normalizeOptions(value: unknown) {
  const fallbackOptions = [
    "Option A pending model output.",
    "Option B pending model output.",
    "Option C pending model output.",
    "Option D pending model output."
  ];

  if (Array.isArray(value)) {
    const arrayOptions = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
      .slice(0, 4);

    if (arrayOptions.length) {
      while (arrayOptions.length < 4) {
        arrayOptions.push(fallbackOptions[arrayOptions.length]);
      }

      return arrayOptions;
    }
  }

  if (value && typeof value === "object") {
    const objectOptions = Object.values(value)
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean)
      .slice(0, 4);

    if (objectOptions.length) {
      while (objectOptions.length < 4) {
        objectOptions.push(fallbackOptions[objectOptions.length]);
      }

      return objectOptions;
    }
  }

  return fallbackOptions;
}

function resolveCorrectAnswerIndex(correctAnswer: unknown, options: string[]) {
  if (typeof correctAnswer === "number" && correctAnswer >= 0 && correctAnswer < options.length) {
    return correctAnswer;
  }

  if (typeof correctAnswer === "string") {
    const trimmed = correctAnswer.trim();
    const keyIndex = OPTION_KEYS.indexOf(trimmed.toUpperCase());
    const prefixedKeyIndex = OPTION_KEYS.indexOf(trimmed.charAt(0).toUpperCase());

    if (keyIndex >= 0 && keyIndex < options.length) {
      return keyIndex;
    }

    if (prefixedKeyIndex >= 0 && prefixedKeyIndex < options.length) {
      return prefixedKeyIndex;
    }

    const directMatch = options.findIndex(
      (option) => option.toLowerCase() === trimmed.toLowerCase()
    );

    if (directMatch >= 0) {
      return directMatch;
    }
  }

  return 0;
}

function normalizeStudyUnit(candidate: unknown, index: number) {
  const unit = candidate && typeof candidate === "object" ? candidate : {};
  const sourceMcqs =
    "mcqs" in unit && Array.isArray(unit.mcqs)
      ? unit.mcqs
      : "questions" in unit && Array.isArray(unit.questions)
        ? unit.questions
        : [];
  const optionsList = Array.from({ length: 5 }, (_, questionIndex) => sourceMcqs[questionIndex]);

  return {
    unitNumber:
      "unitNumber" in unit && typeof unit.unitNumber === "number" ? unit.unitNumber : index + 1,
    unitTitle:
      "unitTitle" in unit && typeof unit.unitTitle === "string" && unit.unitTitle.trim()
        ? unit.unitTitle.trim()
        : `Unit ${index + 1}`,
    summary: normalizeStringList(
      "summary" in unit ? unit.summary : [],
      5,
      "Summary insight"
    ),
    highWeightageTopics: normalizeStringList(
      "highWeightageTopics" in unit ? unit.highWeightageTopics : [],
      3,
      "High-weightage topic"
    ),
    mcqs: optionsList.slice(0, 5).map((question, questionIndex) => {
      const questionObject = question && typeof question === "object" ? question : {};
      const options = normalizeOptions(
        "options" in questionObject ? questionObject.options : undefined
      );
      const correctAnswerIndex = resolveCorrectAnswerIndex(
        "correctAnswer" in questionObject ? questionObject.correctAnswer : undefined,
        options
      );

      return {
        question:
          "question" in questionObject &&
          typeof questionObject.question === "string" &&
          questionObject.question.trim()
            ? questionObject.question.trim()
            : `Question ${questionIndex + 1}`,
        options,
        correctAnswer: options[correctAnswerIndex],
        correctAnswerIndex,
        explanation:
          "explanation" in questionObject &&
          typeof questionObject.explanation === "string" &&
          questionObject.explanation.trim()
            ? questionObject.explanation.trim()
            : "Review this concept from the syllabus summary before attempting again."
      };
    })
  };
}

export function normalizeStudyReport(value: unknown, fileName: string): StudyReport {
  const payload = value && typeof value === "object" ? value : {};
  const sourceUnits =
    "units" in payload && Array.isArray(payload.units)
      ? payload.units
      : "studyUnits" in payload && Array.isArray(payload.studyUnits)
        ? payload.studyUnits
        : [];

  const units = Array.from({ length: 4 }, (_, index) =>
    normalizeStudyUnit(sourceUnits[index], index)
  );

  return {
    courseTitle:
      "courseTitle" in payload &&
      typeof payload.courseTitle === "string" &&
      payload.courseTitle.trim()
        ? payload.courseTitle.trim()
        : fileName.replace(/\.pdf$/i, ""),
    overview:
      "overview" in payload && typeof payload.overview === "string" && payload.overview.trim()
        ? payload.overview.trim()
        : "Structured syllabus insights generated from the uploaded LPU PDF.",
    units
  };
}

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }

  return null;
}

function getTimestampMillis(value: unknown) {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }

  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().getTime();
  }

  return 0;
}

function isFirestoreMissingIndexError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? error.code : undefined;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";

  return code === 9 || message.includes("FAILED_PRECONDITION");
}

async function getSortedUserReportDocs(uid: string) {
  try {
    const snapshot = await getAdminDb()
      .collection("userReports")
      .where("uid", "==", uid)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs;
  } catch (error) {
    if (!isFirestoreMissingIndexError(error)) {
      throw error;
    }

    const fallbackSnapshot = await getAdminDb()
      .collection("userReports")
      .where("uid", "==", uid)
      .get();

    return fallbackSnapshot.docs.sort((left, right) => {
      return getTimestampMillis(right.data().createdAt) - getTimestampMillis(left.data().createdAt);
    });
  }
}

export async function saveUserReport(input: SaveUserReportInput) {
  const reportRef = getAdminDb().collection("userReports").doc();

  await reportRef.set({
    uid: input.uid,
    fileName: input.fileName,
    sourceExcerpt: input.sourceExcerpt,
    sourceText: input.sourceText,
    sourceLength: input.sourceLength,
    report: input.report,
    createdAt: FieldValue.serverTimestamp()
  });

  return reportRef.id;
}

function mapStoredUserReport(id: string, value: FirebaseFirestore.DocumentData): StoredUserReport {
  return {
    id,
    uid: value.uid,
    fileName: value.fileName,
    sourceExcerpt: value.sourceExcerpt ?? "",
    sourceLength: value.sourceLength ?? 0,
    hasSourceText: typeof value.sourceText === "string" && value.sourceText.trim().length > 0,
    createdAt: serializeTimestamp(value.createdAt),
    report: normalizeStudyReport(value.report, value.fileName ?? "LPU report")
  };
}

export async function getUserReportChatContext(uid: string, reportId: string) {
  const snapshot = await getAdminDb().collection("userReports").doc(reportId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (!data || data.uid !== uid) {
    return null;
  }

  const sourceText =
    typeof data.sourceText === "string" && data.sourceText.trim() ? data.sourceText.trim() : null;

  return {
    reportId: snapshot.id,
    fileName: data.fileName ?? "LPU report",
    sourceText,
    report: normalizeStudyReport(data.report, data.fileName ?? "LPU report")
  };
}

export async function getUserReport(uid: string, reportId: string) {
  const snapshot = await getAdminDb().collection("userReports").doc(reportId).get();

  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data();

  if (!data || data.uid !== uid) {
    return null;
  }

  return mapStoredUserReport(snapshot.id, data);
}

export async function getLatestUserReport(uid: string) {
  const docs = await getSortedUserReportDocs(uid);

  if (!docs.length) {
    return null;
  }

  const latestDoc = docs[0];
  return mapStoredUserReport(latestDoc.id, latestDoc.data());
}

export async function getUserReports(uid: string) {
  const docs = await getSortedUserReportDocs(uid);

  return docs.map((doc) => mapStoredUserReport(doc.id, doc.data()));
}
