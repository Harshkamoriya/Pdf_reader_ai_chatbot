

"use client";

import { FaceDetection } from "@mediapipe/face_detection";
import { Camera } from "@mediapipe/camera_utils";

export function useAdvancedProctoring(roundSessionId: string | null) {
  let lastFaceSeenAt = Date.now();

  function send(eventType: string, metadata = {}) {
    fetch("/api/proctoring/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roundSessionId,
        eventType,
        metadata,
      }),
    });
  }

  async function start(videoEl: HTMLVideoElement) {
    const faceDetection = new FaceDetection({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });

    faceDetection.setOptions({
      model: "short",
      minDetectionConfidence: 0.6,
    });

    faceDetection.onResults(results => {
      const faceCount = results.detections?.length ?? 0;

      // No face
      if (faceCount === 0) {
        if (Date.now() - lastFaceSeenAt > 3000) {
          send("FACE_NOT_DETECTED");
        }
      } else {
        lastFaceSeenAt = Date.now();
      }

      // Multiple faces
      if (faceCount > 1) {
        send("MULTIPLE_FACES", { faceCount });
      }
    });

    const camera = new Camera(videoEl, {
      onFrame: async () => {
        await faceDetection.send({ image: videoEl });
      },
      width: 640,
      height: 480,
    });

    camera.start();
  }

  return { start };
}
