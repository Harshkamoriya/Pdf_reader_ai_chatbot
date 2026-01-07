"use client";

export function useProctoring(roundSessionId: string) {
  function send(eventType: string, metadata = {}) {
    fetch("/api/proctoring/event", {
      method: "POST",
      body: JSON.stringify({
        roundSessionId,
        eventType,
        metadata,
      }),
    });
  }

  // TAB SWITCH
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      send("TAB_SWITCH");
    }
  });

  // WINDOW BLUR
  window.addEventListener("blur", () => {
    send("WINDOW_BLUR");
  });

  // FULLSCREEN EXIT
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) {
      send("FULLSCREEN_EXIT");
    }
  });

  // COPY / PASTE
  document.addEventListener("copy", () => send("COPY_PASTE"));
  document.addEventListener("paste", () => send("COPY_PASTE"));

  // RIGHT CLICK
  document.addEventListener("contextmenu", e => {
    e.preventDefault();
    send("RIGHT_CLICK");
  });
}
