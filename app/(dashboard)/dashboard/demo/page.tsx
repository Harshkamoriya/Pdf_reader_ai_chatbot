"use client";

import React, { useEffect, useRef, useState } from "react";

export default function RTCAndSpeechDemo() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [ttsText, setTtsText] = useState("Hello! This is the TTS demo.");
  const [speaking, setSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // ------------------- STT (AssemblyAI) -------------------
  const startRealtimeSTT = async () => {
    console.log("🟢 Starting STT initialization...");

    try {
      const tokenRes = await fetch("/api/getToken");
      const data = await tokenRes.json();
      const { token } = data;

      console.log("🔑 Token fetch response:", data);

      if (!token) {
        alert("Failed to get AssemblyAI token");
        return;
      }

      console.log("🌐 Connecting WebSocket...");
      const ws = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${token}`      );
      setSocket(ws);

      ws.onopen = async () => {
        console.log("✅ Connected to AssemblyAI real-time endpoint");

        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log("🎙️ Microphone access granted");

          const audioContext = new AudioContext({ sampleRate: 16000 });
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);

          source.connect(processor);
          processor.connect(audioContext.destination);

          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);

            // Convert Float32 to 16-bit PCM
            const floatTo16BitPCM = (input: Float32Array) => {
              const buffer = new ArrayBuffer(input.length * 2);
              const view = new DataView(buffer);
              let offset = 0;
              for (let i = 0; i < input.length; i++, offset += 2) {
                const s = Math.max(-1, Math.min(1, input[i]));
                view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
              }
              return buffer;
            };

            const audioBuffer = floatTo16BitPCM(inputData);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(audioBuffer);
              console.log("📤 Sent audio chunk:", audioBuffer.byteLength, "bytes");
            }
          };

          audioContextRef.current = audioContext;
          processorRef.current = processor;
          sourceRef.current = source;
          setIsRecording(true);
          console.log("🎧 STT recording started");
        } catch (err) {
          console.error("❌ Error accessing microphone:", err);
        }
      };

     ws.onmessage = (msg) => {
  try {
    const res = JSON.parse(msg.data);
    console.log("📩 Received message:", res);

    // Handle partial + final transcript messages
    if (res.message_type === "PartialTranscript" && res.text) {
      console.log("📝 Partial transcript:", res.text);
      setTranscript((prev) => `${res.text}`);
    }

    if (res.message_type === "FinalTranscript" && res.text) {
      console.log("✅ Final transcript:", res.text);
      setTranscript((prev) => prev + " " + res.text);
      
    }
    setTranscript(res.transcript)

  } catch (err) {
    console.error("⚠️ Error parsing message:", err, msg.data);
  }
};


      ws.onerror = (err) => {
        console.error("❌ WebSocket error:", err);
      };

      ws.onclose = (event) => {
        console.warn("🔴 WebSocket closed:", event);
        stopRealtimeSTT();
      };
    } catch (err) {
      console.error("❌ Error initializing STT:", err);
    }
  };

  const stopRealtimeSTT = () => {
    console.log("🟡 Stopping STT...");
    socket?.close();
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();

    setSocket(null);
    setIsRecording(false);
    console.log("🛑 STT stopped successfully");
  };

  // ------------------- TTS (Browser) -------------------
  const speak = () => {
    console.log("🗣️ Speaking text:", ttsText);
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.onstart = () => {
      console.log("▶️ Speech started");
      setSpeaking(true);
    };
    utter.onend = () => {
      console.log("⏹️ Speech ended");
      setSpeaking(false);
    };
    speechSynthesis.speak(utter);
  };

  const stopSpeaking = () => {
    console.log("🛑 Stopping speech");
    speechSynthesis.cancel();
    setSpeaking(false);
  };

  // ------------------- UI -------------------
  return (
    <div className="p-6 max-w-3xl mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-4">AssemblyAI STT + TTS Demo</h1>

      {/* STT Section */}
      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold">1) Real-time Speech-to-Text (AssemblyAI)</h2>
        <div className="flex gap-2 mt-3">
          {!isRecording ? (
            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={startRealtimeSTT}
            >
              Start STT
            </button>
          ) : (
            <button
              className="px-3 py-1 bg-red-600 text-white rounded"
              onClick={stopRealtimeSTT}
            >
              Stop STT
            </button>
          )}
        </div>
          

      </section>
      <div className="w-full h-30  mb-2 border-2">

            <p> {transcript}</p>
          </div>

      {/* TTS Section */}
      <section className="mb-6 p-4 border rounded">
        <h2 className="font-semibold">2) Text-to-Speech (Browser SpeechSynthesis)</h2>
        <textarea
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          rows={4}
          className="w-full mt-3 p-2 border rounded"
        />
        <div className="flex gap-2 mt-3">
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={speak}
          >
            Speak
          </button>
          <button
            className="px-3 py-1 bg-gray-600 text-white rounded"
            onClick={stopSpeaking}
            disabled={!speaking}
          >
            Stop
          </button>
        </div>
      </section>


      <footer className="text-xs text-gray-500 mt-4">
        Note: AssemblyAI STT requires a valid API key & HTTPS context.
      </footer>
    </div>
  );
}
