/**
 * ImboniX UI phrase catalog — fixed, app-generated strings that ImboniX speaks
 * or shows (reminders, check-ins, emergency status). AI-generated descriptions
 * and conversation replies are translated by the model server-side; this file
 * only covers the hard-coded phrases the client itself produces.
 *
 * The current language is held module-side (set from the config store via
 * `setUiLanguage`) so non-React helpers like the Emergency engine can use it.
 *
 * NOTE: French & Swahili strings are reviewed translations. Kinyarwanda is
 * best-effort and should be verified by a native speaker before production.
 */
import type { Language } from "./types";

export type EmergencyReason =
  | "word"
  | "sos"
  | "fall"
  | "inactivity"
  | "weapon"
  | "threat"
  | "sound"
  | "test";

interface Catalog {
  ready: string;
  talkToMe: string;
  medReminder: (name: string, dosage: string) => string;
  checkIn: string;
  goodToHearHere: string;
  goodToHear: string;
  emergencyCancelled: string;
  emergencyActivated: (reason: string, name: string) => string;
  noContacts: string;
  defaultContact: string;
  reason: Record<EmergencyReason, string>;
}

const EN: Catalog = {
  ready: "ImboniX is ready.",
  talkToMe: "Talk to me.",
  medReminder: (name, dosage) => `ImboniX reminder. It is time to take your ${name}, ${dosage}.`,
  checkIn: `ImboniX check-in. Are you okay? Say "I am fine" to confirm, or say "help" if you need assistance.`,
  goodToHearHere: "Good to hear. I am here if you need me.",
  goodToHear: "Good to hear.",
  emergencyCancelled: "Emergency cancelled. You are safe.",
  emergencyActivated: (reason, name) => `ImboniX Emergency activated. ${reason}. Contacting ${name}.`,
  noContacts: "Warning. No emergency contacts are saved. Please set up emergency contacts.",
  defaultContact: "your emergency contact",
  reason: {
    word: "Voice trigger activated",
    sos: "SOS button activated",
    fall: "Fall detected",
    inactivity: "No activity detected",
    weapon: "Weapon detected",
    threat: "Critical threat detected",
    sound: "Critical sound detected",
    test: "Emergency system test",
  },
};

const FR: Catalog = {
  ready: "ImboniX est prêt.",
  talkToMe: "Parlez-moi.",
  medReminder: (name, dosage) => `Rappel ImboniX. Il est l'heure de prendre votre ${name}, ${dosage}.`,
  checkIn: `Vérification ImboniX. Est-ce que ça va ? Dites « je vais bien » pour confirmer, ou dites « au secours » si vous avez besoin d'aide.`,
  goodToHearHere: "Ravi de l'entendre. Je suis là si vous avez besoin de moi.",
  goodToHear: "Ravi de l'entendre.",
  emergencyCancelled: "Urgence annulée. Vous êtes en sécurité.",
  emergencyActivated: (reason, name) => `Urgence ImboniX activée. ${reason}. Contact de ${name} en cours.`,
  noContacts: "Attention. Aucun contact d'urgence n'est enregistré. Veuillez configurer des contacts d'urgence.",
  defaultContact: "votre contact d'urgence",
  reason: {
    word: "Déclencheur vocal activé",
    sos: "Bouton SOS activé",
    fall: "Chute détectée",
    inactivity: "Aucune activité détectée",
    weapon: "Arme détectée",
    threat: "Menace critique détectée",
    sound: "Son critique détecté",
    test: "Test du système d'urgence",
  },
};

const SW: Catalog = {
  ready: "ImboniX iko tayari.",
  talkToMe: "Zungumza nami.",
  medReminder: (name, dosage) => `Kikumbusho cha ImboniX. Ni wakati wa kutumia ${name}, ${dosage}.`,
  checkIn: `Ukaguzi wa ImboniX. Je, uko salama? Sema "niko sawa" kuthibitisha, au sema "msaada" ukihitaji usaidizi.`,
  goodToHearHere: "Vizuri kusikia hivyo. Nipo hapa ukinihitaji.",
  goodToHear: "Vizuri kusikia hivyo.",
  emergencyCancelled: "Dharura imeghairiwa. Uko salama.",
  emergencyActivated: (reason, name) => `Dharura ya ImboniX imewashwa. ${reason}. Inawasiliana na ${name}.`,
  noContacts: "Tahadhari. Hakuna anwani za dharura zilizohifadhiwa. Tafadhali weka anwani za dharura.",
  defaultContact: "anwani yako ya dharura",
  reason: {
    word: "Kichocheo cha sauti kimewashwa",
    sos: "Kitufe cha SOS kimewashwa",
    fall: "Kuanguka kumegunduliwa",
    inactivity: "Hakuna shughuli iliyogunduliwa",
    weapon: "Silaha imegunduliwa",
    threat: "Tishio kubwa limegunduliwa",
    sound: "Sauti ya hatari imegunduliwa",
    test: "Jaribio la mfumo wa dharura",
  },
};

const RW: Catalog = {
  ready: "ImboniX yiteguye.",
  talkToMe: "Mbwira.",
  medReminder: (name, dosage) => `Urwibutso rwa ImboniX. Ni igihe cyo gufata ${name}, ${dosage}.`,
  checkIn: `Igenzura rya ImboniX. Urakomeye? Vuga "ndakomeye" kugira ngo wemeze, cyangwa uvuge "mfasha" niba ukeneye ubufasha.`,
  goodToHearHere: "Ni byiza kubyumva. Ndahari igihe cyose unkeneye.",
  goodToHear: "Ni byiza kubyumva.",
  emergencyCancelled: "Ihutirwa ryavanyweho. Uri amahoro.",
  emergencyActivated: (reason, name) => `Ihutirwa rya ImboniX ryatangiye. ${reason}. Turimo guhamagara ${name}.`,
  noContacts: "Itonde. Nta bantu bo guhamagara mu gihe cy'ihutirwa babitswe. Nyamuneka shyiraho abo guhamagara.",
  defaultContact: "umuntu wo guhamagara mu gihe cy'ihutirwa",
  reason: {
    word: "Ijwi ryatumye bitangira",
    sos: "Buto ya SOS yakanze",
    fall: "Hagaragaye ugwa",
    inactivity: "Nta gikorwa kigaragara",
    weapon: "Hagaragaye intwaro",
    threat: "Hagaragaye akaga gakomeye",
    sound: "Hagaragaye ijwi ry'akaga",
    test: "Igerageza rya sisitemu y'ihutirwa",
  },
};

const CATALOG: Record<Language, Catalog> = {
  english: EN,
  french: FR,
  swahili: SW,
  kinyarwanda: RW,
};

let current: Language = "english";

/** Set the language used for app-generated phrases. */
export function setUiLanguage(lang: Language) {
  current = lang;
}

/** Get the phrase catalog for the current language (falls back to English). */
export function ui(): Catalog {
  return CATALOG[current] || EN;
}
