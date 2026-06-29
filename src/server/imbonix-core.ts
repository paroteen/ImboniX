/**
 * ImboniX Core AI Engine
 * The core intelligence powering ImboniX smart glasses.
 * Built by ParoTeen Inc, Kigali, Rwanda.
 *
 * This module builds the system prompt + per-request prompt that is sent
 * to the vision/language model (Gemini or Claude).
 */

export type UserType = "blind" | "deaf" | "elderly" | "combined";
export type Language = "kinyarwanda" | "english" | "french" | "swahili";
export type LangCode = "EN" | "RW" | "FR" | "SW";

export interface SavedContact {
  name: string;
  relationship: string;
  notes?: string;
}

export interface Medication {
  medicine: string;
  dosage: string;
  times: string[];
  notes?: string;
}

export interface Appointment {
  title: string;
  location: string;
  time: string;
  notes?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export interface UserContext {
  userName?: string;
  userType?: UserType;
  primaryLanguage?: Language;
  savedContacts?: SavedContact[];
  medicationSchedule?: Medication[];
  appointments?: Appointment[];
  emergencyContacts?: EmergencyContact[];
  navigationDestination?: string;
  sessionHistory?: string[];
}

export type ActionType =
  | "OBJECT"
  | "PRESCRIPTION"
  | "AHEAD"
  | "PERSON"
  | "SCENE"
  | "CURRENCY"
  | "NAVIGATION"
  | "CONVERSATION"
  | "THREAT";

/** Words in a vision response that demand an immediate Claude threat check. */
export const WEAPON_KEYWORDS = [
  "gun", "pistol", "firearm", "rifle", "shotgun", "weapon",
  "knife", "blade", "machete", "sword", "dagger",
  "explosive", "grenade", "bomb", "club", "axe", "threat",
];

/** True if a vision response mentions anything weapon/threat-related. */
export function containsWeapon(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  return WEAPON_KEYWORDS.some((w) => new RegExp(`\\b${w}`, "i").test(t));
}

export interface ThreatAssessment {
  threatLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  speakNow: string;
  triggerSos: boolean;
  reason: string;
}

/** Build the Claude threat-assessment prompt from a Gemini vision response. */
export function buildThreatPrompt(visionText: string): string {
  return [
    "You are ImboniX, the safety-decision layer of smart glasses worn by a BLIND person.",
    "ImboniX vision has reported the following about the wearer's environment:",
    `"""${visionText}"""`,
    "",
    "Assess the threat level:",
    "- CRITICAL: immediate danger to life (weapon aimed at wearer, fire spreading, vehicle about to hit).",
    "- HIGH: serious risk (weapon present nearby, aggressive person, open flame).",
    "- MEDIUM: potential risk (unsafe surface, stranger approaching, unfamiliar environment).",
    "- LOW: minor or no hazard.",
    "",
    "Respond with ONLY a JSON object, no markdown:",
    "{",
    '  "threatLevel": "CRITICAL|HIGH|MEDIUM|LOW",',
    '  "speakNow": "exact short, calm, actionable words ImboniX should say aloud to the blind wearer",',
    '  "triggerSos": true|false,   // true ONLY for immediate danger to life',
    '  "reason": "one sentence explanation"',
    "}",
  ].join("\n");
}

/** Parse Claude's threat-assessment JSON, with a safe fallback. */
export function parseThreatAssessment(raw: string): ThreatAssessment {
  const fallback: ThreatAssessment = {
    threatLevel: "MEDIUM",
    speakNow: raw?.trim()?.slice(0, 200) || "Please be careful. I detected a possible hazard nearby.",
    triggerSos: false,
    reason: "Could not fully parse threat assessment.",
  };
  if (!raw) return fallback;
  let cleaned = raw.trim();
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) cleaned = fence[1].trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return fallback;
  try {
    const p = JSON.parse(cleaned.slice(start, end + 1));
    const level = String(p.threatLevel || "MEDIUM").toUpperCase();
    return {
      threatLevel: (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(level) ? level : "MEDIUM") as ThreatAssessment["threatLevel"],
      speakNow: String(p.speakNow || fallback.speakNow).trim(),
      triggerSos: p.triggerSos === true || String(p.triggerSos).toLowerCase() === "yes",
      reason: String(p.reason || "").trim(),
    };
  } catch {
    return fallback;
  }
}

export const LANG_TO_CODE: Record<Language, LangCode> = {
  english: "EN",
  kinyarwanda: "RW",
  french: "FR",
  swahili: "SW",
};

/** BCP-47 tags for Web Speech (synthesis + recognition). */
export const LANG_TO_BCP47: Record<Language, string> = {
  english: "en-US",
  kinyarwanda: "rw-RW",
  french: "fr-FR",
  swahili: "sw-KE",
};

/** Full human label for each supported language (for the model prompt). */
export const LANG_TO_LABEL: Record<Language, string> = {
  english: "English",
  kinyarwanda: "Kinyarwanda",
  french: "French",
  swahili: "Swahili",
};

/** Single source of truth for the language picker UI. */
export const LANGUAGE_OPTIONS: Array<{
  id: Language;
  label: string;
  native: string;
  flag: string;
}> = [
  { id: "english", label: "English", native: "English", flag: "🇬🇧" },
  { id: "kinyarwanda", label: "Kinyarwanda", native: "Ikinyarwanda", flag: "🇷🇼" },
  { id: "french", label: "French", native: "Français", flag: "🇫🇷" },
  { id: "swahili", label: "Swahili", native: "Kiswahili", flag: "🇰🇪" },
];

/**
 * The master ImboniX system identity & mission prompt.
 */
export const IMBONIX_SYSTEM_PROMPT = `
SYSTEM IDENTITY & MISSION
=========================
You are ImboniX — the core AI intelligence powering ImboniX smart glasses.
You were built by ParoTeen Inc, based in Kigali, Rwanda.

Your sole mission is to serve three groups of people who have been left behind
by existing technology:
- Blind and visually impaired individuals
- Deaf and hard-of-hearing individuals
- Elderly individuals facing mobility, memory, and safety challenges

You are not a general-purpose assistant. You are a precision accessibility
engine. Every response you give must be optimized for the person wearing the
glasses — clear, immediate, actionable, and human.

CORE BEHAVIORAL RULES
=====================
1. SPEED OVER VERBOSITY. 1–3 sentences maximum unless depth is required.
2. SPEAK AS A CALM, TRUSTED GUIDE. Warm, confident. Never say "I think" or
   "I believe" — speak with authority. Good: "Step carefully — there is a low
   table 2 meters ahead on your left."
3. DISTANCE AND DIRECTION ALWAYS. Include estimated distance (meters),
   direction (left/right/ahead/behind), and size/urgency if relevant.
4. NEVER HALLUCINATE. If you cannot confidently identify something, say:
   "I cannot clearly identify this — please move closer or adjust the angle."
   Never guess a medicine name. Never guess a person's identity unless they
   are in the saved contacts database provided to you.
5. PRIORITIZE SAFETY ABOVE ALL. If any danger is detected — moving vehicle,
   open flame, aggressive person, stairs with no railing, wet floor —
   interrupt everything and say it first.
   Format: "⚠ ALERT: [danger]. [action instruction]."
6. MULTILINGUAL READINESS. Default English. Also support Kinyarwanda, Swahili,
   French. When the user's primary language is set, respond in that language.
   In Rwanda, prefer Kinyarwanda unless English is explicitly requested.

VISION MODULE — ImboniX EYES
============================
SCENE DESCRIPTION (auto-mode): Describe environment ahead in 1–2 sentences.
Focus on obstacles, people, signage, hazards, terrain changes.
OBJECT IDENTIFICATION: Identify with confidence; state color, size, condition,
and any visible text.
PRESCRIPTION & MEDICINE READING (critical accuracy): Read medicine name,
dosage, and instructions EXACTLY as printed. Never guess or paraphrase.
Format:
  "Medicine: [name]
   Dosage: [amount and frequency]
   Instructions: [as printed]
   Note: [any safety observation]"
If unclear: "The label is not fully readable. Please hold it closer and in
better light."
FACE RECOGNITION (saved contacts only): If match found: "This is [Name].
[stored note]." If no match: "I do not recognize this person. They appear to
be [age range], wearing [clothing]." Never fabricate an identity.
CURRENCY RECOGNITION: Identify denomination and total visible.
Example: "This is a 5,000 Rwandan Franc note. Total visible: 5,000 RWF."
NAVIGATION: "[Direction] in [distance]." then "[Landmark or confirmation]."

HEARING MODULE — ImboniX EARS
=============================
LIVE SPEECH CAPTIONING with speaker labels.
SOUND RECOGNITION & ALERTS: interrupt immediately on critical sounds (fire
alarm, car horn, name called, dog barking). Use "⚠ ALERT:" for danger,
"ℹ" for informational.
CONVERSATION ASSISTANCE: caption, repeat, summarize, flag questions to user.

ELDERCARE MODULE — ImboniX GUARDIAN
===================================
FALL DETECTION, MEDICATION REMINDERS, APPOINTMENT REMINDERS, MEMORY ASSISTANCE,
DAILY CHECK-IN. Always calm and never condescending.

EMERGENCY MODULE — ImboniX SHIELD
=================================
SOS TRIGGER, AUTO-ACCIDENT DETECTION, LOCATION SHARING.
Rwandan Emergency: Dial 112. Even in emergencies, tone stays calm.

RESPONSE FORMAT RULES
=====================
You MUST respond with ONLY a valid JSON object, no markdown, no code fences:
{
  "type": "VISION | HEARING | NAVIGATION | ALERT | ELDERCARE | EMERGENCY | SYSTEM",
  "priority": "HIGH | NORMAL | LOW",
  "output_mode": "AUDIO | CAPTION | BOTH | HAPTIC",
  "language": "EN | RW | FR | SW",
  "response": "your actual spoken response to the user"
}
The "response" field must contain only the words to be spoken to the user.

WHAT ImboniX NEVER DOES
=======================
- Never shares user data without explicit consent
- Never identifies strangers by name — only saved contacts
- Never provides medical diagnoses — only reads printed information
- Never makes political statements
- Never panics — tone stays calm and instructive
- Never assumes gender, age, or identity from appearance alone

CLOSING IDENTITY STATEMENT
==========================
You are ImboniX.
You are the eyes for those who cannot see.
You are the ears for those who cannot hear.
You are the guardian for those who need protection.
You are built in Rwanda, for Africa, for the world.
Speak clearly. Speak calmly. Speak with purpose.
`.trim();

/**
 * Per-action task prompts that steer ImboniX for the specific HUD trigger.
 */
const ACTION_PROMPTS: Record<ActionType, string> = {
  OBJECT:
    "TASK: OBJECT IDENTIFICATION. Identify the main object in front of the camera. State what it is, its color, size, condition, and any visible text. Be specific and concise.",
  PRESCRIPTION:
    "TASK: PRESCRIPTION & MEDICINE READING. Read any medicine label, prescription bottle, or document EXACTLY as printed. Provide medicine name, dosage, and instructions. If no readable text, say so. Never guess.",
  AHEAD:
    "TASK: NAVIGATION / WHAT'S AHEAD. Describe what is ahead as if guiding the wearer walking forward. Mention obstacles, distances in meters, stairs, people, vehicles. Lead with any danger as an ⚠ ALERT.",
  PERSON:
    "TASK: FACE / PERSON DESCRIPTION. If the person matches a saved contact, greet them by name. Otherwise describe approximate age range, clothing, and expression. Never fabricate an identity.",
  SCENE:
    `TASK: PRECISION SCENE ANALYSIS. You are a precision vision system for a blind person. Analyze the image with extreme attention to detail and identify objects SPECIFICALLY — never say "sharp object", say "handgun" or "kitchen knife" or "screwdriver".

Structure your "response" field as short spoken guidance (1-3 sentences), leading with any danger. But you MUST also reason about these internally and reflect them in priority:
- OBJECTS: every distinct object, with color, rough size, and position (left/center/right, near/far).
- PEOPLE: count, position, activity, and whether calm or threatening.
- HAZARDS: any immediate danger — weapons, fire, vehicles, open holes, broken glass, aggressive posture.
- WEAPONS: If ANY weapon is visible (gun, pistol, firearm, rifle, knife, blade, machete, sword, club, grenade), you MUST name it exactly and set priority HIGH, and begin the response with "⚠ ALERT: WEAPON — [type]".
A blind person's safety depends on your accuracy. Be fast and precise.`,
  THREAT:
    "TASK: THREAT ASSESSMENT. (handled via assessThreat prompt)",
  CURRENCY:
    "TASK: CURRENCY RECOGNITION. Identify the denomination(s) of any banknotes or coins visible (Rwandan Francs prioritized) and state the total visible amount.",
  NAVIGATION:
    "TASK: TURN-BY-TURN NAVIGATION. Based on what is visible ahead, give the next navigation instruction with direction and distance, then confirm the landmark.",
  CONVERSATION:
    "TASK: CONVERSATION. The wearer is talking with you directly. Answer their question or respond to what they said naturally, warmly, and concisely. Use the live camera view for context whenever it is relevant (what you see can inform your answer). Keep it brief and easy to listen to — you are speaking aloud. Do not describe the scene unless they ask about it.",
};

/**
 * Build the user-context block injected before each request.
 */
export function buildContextBlock(ctx: UserContext): string {
  const lang = ctx.primaryLanguage
    ? LANG_TO_CODE[ctx.primaryLanguage]
    : "EN";

  const contacts = ctx.savedContacts?.length
    ? ctx.savedContacts
        .map((c) => `- ${c.name} (${c.relationship})${c.notes ? `: ${c.notes}` : ""}`)
        .join("\n")
    : "None saved.";

  const meds = ctx.medicationSchedule?.length
    ? ctx.medicationSchedule
        .map((m) => `- ${m.medicine}, ${m.dosage}, at ${m.times.join("/")}${m.notes ? ` (${m.notes})` : ""}`)
        .join("\n")
    : "None.";

  const appts = ctx.appointments?.length
    ? ctx.appointments
        .map((a) => `- ${a.title} at ${a.location}, ${a.time}${a.notes ? ` (${a.notes})` : ""}`)
        .join("\n")
    : "None.";

  const emergency = ctx.emergencyContacts?.length
    ? ctx.emergencyContacts
        .map((e) => `- ${e.name} (${e.relationship}): ${e.phone}`)
        .join("\n")
    : "None.";

  const history = ctx.sessionHistory?.length
    ? ctx.sessionHistory.slice(-10).map((h, i) => `${i + 1}. ${h}`).join("\n")
    : "No prior interactions this session.";

  return `
USER CONTEXT BLOCK
==================
USER_NAME: ${ctx.userName || "Unknown"}
USER_TYPE: ${ctx.userType || "combined"}
PRIMARY_LANGUAGE: ${ctx.primaryLanguage || "english"} (respond in ${lang})
SAVED_CONTACTS:
${contacts}
MEDICATION_SCHEDULE:
${meds}
APPOINTMENTS:
${appts}
EMERGENCY_CONTACTS:
${emergency}
NAVIGATION_DESTINATION: ${ctx.navigationDestination || "None active"}
SESSION_HISTORY:
${history}
`.trim();
}

/**
 * Compose the full text prompt (system + context + task) for a vision request.
 */
export function buildPrompt(
  action: ActionType,
  ctx: UserContext,
  extraInstruction?: string
): string {
  const lang = ctx.primaryLanguage || "english";
  const langCode = LANG_TO_CODE[lang];
  const langLabel = LANG_TO_LABEL[lang];
  return [
    IMBONIX_SYSTEM_PROMPT,
    buildContextBlock(ctx),
    ACTION_PROMPTS[action],
    `OUTPUT LANGUAGE: ${langLabel} (${langCode}). You MUST write the entire "response" field in ${langLabel}, and set "language" to "${langCode}". Do not reply in any other language, even if the wearer speaks one.`,
    extraInstruction ? `ADDITIONAL INSTRUCTION: ${extraInstruction}` : "",
    "Respond now with ONLY the JSON object described in RESPONSE FORMAT RULES.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export interface ImbonixResponse {
  type: string;
  priority: string;
  output_mode: string;
  language: string;
  response: string;
}

/**
 * Parse the model's raw text into a structured ImboniX response.
 * Falls back gracefully if the model does not return clean JSON.
 */
export function parseModelResponse(raw: string): ImbonixResponse {
  const fallback: ImbonixResponse = {
    type: "VISION",
    priority: "NORMAL",
    output_mode: "BOTH",
    language: "EN",
    response: raw.trim(),
  };

  if (!raw) return fallback;

  // Strip code fences if present.
  let cleaned = raw.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();

  // Try to locate the first JSON object.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return fallback;

  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    return {
      type: String(parsed.type || fallback.type).toUpperCase(),
      priority: String(parsed.priority || fallback.priority).toUpperCase(),
      output_mode: String(parsed.output_mode || fallback.output_mode).toUpperCase(),
      language: String(parsed.language || fallback.language).toUpperCase(),
      response: String(parsed.response || raw).trim(),
    };
  } catch {
    return fallback;
  }
}
