export type BhoomiLanguage = "en" | "hi" | "pa" | "mr";

const supportedLanguages: BhoomiLanguage[] = ["en", "hi", "pa", "mr"];
const marathiSignals = ["काय", "आहे", "या", "प्रकल्पाची", "प्रकल्पाबद्दल", "आणि", "धोके", "समजावून", "सांगा", "माहिती", "किंमती"];
const hindiSignals = ["इस", "परियोजना", "विश्लेषण", "हिंदी", "में", "समझाइए", "क्या", "है", "जोखिम", "बताइए"];

export function isSupportedLanguage(value: unknown): value is BhoomiLanguage {
  return typeof value === "string" && supportedLanguages.includes(value as BhoomiLanguage);
}

export function detectLanguage(question: string): BhoomiLanguage {
  if (/[\u0A00-\u0A7F]/.test(question)) return "pa";
  if (/[\u0900-\u097F]/.test(question)) {
    const marathiScore = marathiSignals.reduce((score, signal) => score + (question.includes(signal) ? 1 : 0), 0);
    const hindiScore = hindiSignals.reduce((score, signal) => score + (question.includes(signal) ? 1 : 0), 0);
    // Both languages use Devanagari. Prefer Marathi only when Marathi-specific markers
    // outnumber Hindi markers; generic or uncertain Devanagari defaults to Hindi.
    return marathiScore > hindiScore ? "mr" : "hi";
  }
  return "en";
}

export function resolveLanguage(language: unknown, question?: string): BhoomiLanguage {
  if (language === undefined || language === null) return question?.trim() ? detectLanguage(question) : "en";
  if (!isSupportedLanguage(language)) throw new Error("Invalid language. Supported values are: en, hi, pa, mr.");
  return language;
}

export function languageInstruction(language: BhoomiLanguage): string {
  const names: Record<BhoomiLanguage, string> = { en: "English", hi: "Hindi", pa: "Punjabi", mr: "Marathi" };
  return `Respond entirely in ${names[language]} (${language}). Keep project IDs, registry names, numeric values, and technical field names unchanged where necessary, while explaining the analysis naturally in ${names[language]}.`;
}
