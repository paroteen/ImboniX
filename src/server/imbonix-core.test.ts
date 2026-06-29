/**
 * ImboniX core engine tests + scenario eval harness.
 * Run with:  npx tsx src/server/imbonix-core.test.ts
 *
 * No test framework needed — uses a tiny assert helper so it runs anywhere.
 */

import {
  buildPrompt,
  buildContextBlock,
  parseModelResponse,
  IMBONIX_SYSTEM_PROMPT,
  type UserContext,
} from "./imbonix-core";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

const demoCtx: UserContext = {
  userName: "Mukamana",
  userType: "combined",
  primaryLanguage: "kinyarwanda",
  savedContacts: [{ name: "Abiola", relationship: "sister", notes: "Visits weekly." }],
  medicationSchedule: [{ medicine: "Ibuprofen 400mg", dosage: "1 tablet", times: ["08:00"], notes: "With food." }],
  emergencyContacts: [{ name: "Abiola", phone: "+250788123456", relationship: "sister" }],
  sessionHistory: ["SCENE: You are in a corridor."],
};

console.log("\n[1] Identity — never says INYA, always ImboniX");
check("system prompt mentions ImboniX", IMBONIX_SYSTEM_PROMPT.includes("You are ImboniX"));
check("system prompt does NOT contain INYA", !/\bINYA\b/.test(IMBONIX_SYSTEM_PROMPT));

console.log("\n[2] Context block injection");
const block = buildContextBlock(demoCtx);
check("includes user name", block.includes("Mukamana"));
check("maps kinyarwanda -> RW", block.includes("respond in RW"));
check("lists saved contact Abiola", block.includes("Abiola"));
check("lists medication", block.includes("Ibuprofen 400mg"));

console.log("\n[3] Prompt building per action");
const presc = buildPrompt("PRESCRIPTION", demoCtx);
check("prescription prompt has critical-accuracy task", presc.includes("PRESCRIPTION & MEDICINE READING"));
check("prescription prompt carries RW output language", presc.includes("OUTPUT LANGUAGE: Kinyarwanda (RW)"));
const currency = buildPrompt("CURRENCY", demoCtx);
check("currency prompt mentions Rwandan Francs", currency.includes("Rwandan Francs"));

console.log("\n[4] Model response parsing — clean JSON");
const clean = parseModelResponse(
  '{"type":"ALERT","priority":"HIGH","output_mode":"AUDIO","language":"EN","response":"⚠ ALERT: Step down ahead."}'
);
check("type parsed", clean.type === "ALERT");
check("priority parsed", clean.priority === "HIGH");
check("response parsed", clean.response === "⚠ ALERT: Step down ahead.");

console.log("\n[5] Model response parsing — fenced JSON");
const fenced = parseModelResponse(
  '```json\n{"type":"VISION","priority":"NORMAL","output_mode":"BOTH","language":"RW","response":"Hari umuntu imbere."}\n```'
);
check("fenced type parsed", fenced.type === "VISION");
check("fenced language parsed", fenced.language === "RW");
check("fenced response parsed", fenced.response === "Hari umuntu imbere.");

console.log("\n[6] Model response parsing — graceful fallback (plain text)");
const fallback = parseModelResponse("A blue water bottle is on the table.");
check("fallback type defaults to VISION", fallback.type === "VISION");
check("fallback keeps raw text", fallback.response === "A blue water bottle is on the table.");

console.log("\n[7] Model response parsing — JSON wrapped in chatter");
const noisy = parseModelResponse(
  'Sure! Here you go: {"type":"NAVIGATION","priority":"HIGH","output_mode":"AUDIO","language":"EN","response":"Turn left in 5 meters."} Hope that helps.'
);
check("noisy JSON extracted", noisy.type === "NAVIGATION" && noisy.response === "Turn left in 5 meters.");

console.log(`\n──────────────────────────────`);
console.log(`ImboniX core tests: ${passed} passed, ${failed} failed`);
console.log(`──────────────────────────────\n`);

if (failed > 0) process.exit(1);
