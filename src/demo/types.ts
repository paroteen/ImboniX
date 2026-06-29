/**
 * ImboniX demo — shared types for the assist modules, setup config,
 * emergency system, and runtime state.
 */
// Language support lives in the backend prompt engine (single source of truth).
// Re-exported here so demo UI/config can reference it without a deep import.
import type { Language } from "../server/imbonix-core";

export type ModuleId = "vision" | "hearing" | "eldercare";
export type CameraSource = "local" | "phone";

export type { Language };
export { LANGUAGE_OPTIONS, LANG_TO_BCP47, LANG_TO_LABEL } from "../server/imbonix-core";

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  photo?: string; // base64 data url
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string; // includes country code, e.g. +250...
  relationship: "Family" | "Doctor" | "Caregiver" | "Friend";
  priority?: 1 | 2 | 3;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // "HH:MM"
  notes?: string;
}

export interface Appointment {
  id: string;
  title: string;
  location: string;
  datetime: string;
  notifyBefore: "30min" | "1hr" | "2hrs";
}

/** Per-module feature toggles. */
export interface VisionProfile {
  objectDetection: boolean;
  hazardAlerts: boolean;
  faceRecognition: boolean;
  prescriptionReading: boolean;
  navigationEnabled: boolean;
  navigationDestination: string;
  navigationType: "indoor" | "outdoor";
}

export interface HearingProfile {
  liveCaptions: boolean;
  soundRecognition: boolean;
  speakerId: boolean;
  conversationSummary: boolean;
  vibrationAlerts: boolean;
}

export interface EldercareProfile {
  fallDetection: boolean;
  medicationReminders: boolean;
  appointmentReminders: boolean;
  dailyCheckIn: boolean;
  checkInHours: 2 | 4 | 6 | 8;
  memoryAssistance: boolean;
}

/** Emergency setup shared shape (single-contact modules) */
export interface EmergencySetup {
  userName: string;
  contactName: string;
  contactPhone: string;
  relationship: "Family" | "Doctor" | "Caregiver" | "Friend";
  emergencyWord: string;
  showSosButton: boolean;
}

export interface AfricasTalkingConfig {
  apiKey: string;
  username: string;
  sandbox: boolean;
}

export interface ImbonixConfig {
  /** Language ImboniX speaks, listens, and converses in. */
  language: Language;
  contacts: Contact[];
  medications: Medication[];
  appointments: Appointment[];
  emergency: EmergencySetup;
  eldercareContacts: EmergencyContact[]; // up to 3, ElderCare
  autoEscalation: boolean;
  vision: VisionProfile;
  hearing: HearingProfile;
  eldercare: EldercareProfile;
  africasTalking: AfricasTalkingConfig;
  // AI engine
  aiProvider: "gemini" | "claude" | "openai" | "auto";
  geminiKey: string;
  claudeKey: string;
  openaiKey: string;
}

export interface ImbonixLogEntry {
  time: string;
  speaker: "ImboniX";
  kind: "INFO" | "ALERT" | "EMERGENCY";
  text: string;
  icon?: string;
}

export const RELATIONSHIPS = ["Family", "Doctor", "Caregiver", "Friend"] as const;
