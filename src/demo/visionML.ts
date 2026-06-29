/**
 * ImboniX client-side vision ML — TensorFlow.js COCO-SSD for real-time
 * object detection running entirely in the browser. Zero latency, works offline.
 * Provides bounding boxes + labels that overlay the camera feed.
 */
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

export interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

let model: cocoSsd.ObjectDetection | null = null;
let loading = false;

export async function loadVisionModel(): Promise<boolean> {
  if (model) return true;
  if (loading) {
    // Wait for existing load
    while (loading) await new Promise((r) => setTimeout(r, 50));
    return !!model;
  }
  loading = true;
  try {
    console.log("[ImboniX Vision] Loading TensorFlow.js + COCO-SSD...");
    await tf.ready();
    model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
    console.log("[ImboniX Vision] COCO-SSD loaded successfully");
    return true;
  } catch (e) {
    console.error("[ImboniX Vision] Failed to load model:", e);
    return false;
  } finally {
    loading = false;
  }
}

export async function detectObjects(
  video: HTMLVideoElement
): Promise<Detection[]> {
  if (!model || !video || video.readyState < 2) return [];
  try {
    const predictions = await model.detect(video);
    return predictions.map((p) => ({
      class: p.class,
      score: p.score,
      bbox: p.bbox as [number, number, number, number],
    }));
  } catch (e) {
    console.warn("[ImboniX Vision] Detection error:", e);
    return [];
  }
}

export function isModelReady(): boolean {
  return !!model;
}