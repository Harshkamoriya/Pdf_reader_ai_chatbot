// /app/(wherever)/page.tsx (client component)
"use client";

import { Button } from "@/app/components/ui/button";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface TranscriptEntry {
  type: string;
  message?: string;
  reply?: string;
  sentiment?: {
    sentiment: string;
    toneSummary: string;
    confidenceScore: number;
  };
  timestamp?: string;
}

interface SessionData {
  id: string;
  jobRole: string;
  status: string;
  transcript: TranscriptEntry[];
}

interface FinalReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  verdict: string;
}

const InterviewPage = () => {
  const { sessionId } = useParams();
  const [reply, setReply] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  // Audio / STT refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [isAITurn, setIsAITurn] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const speechTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechValue = useRef<string>("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [finalReport, setFinalReport] = useState<FinalReport | null>(null);

  useEffect(() => {
    // Fetch session when page mounts
    fetchTranscript();
    // Cleanup on unmount
    return () => {
      stopRealtimeSTT();
      speechSynthesis.cancel();
      if (speechTimer.current) clearTimeout(speechTimer.current);
    };
  }, []);

  useEffect(() => {
    // Autoscroll when transcript changes
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Fetch session / transcript
  const fetchTranscript = async () => {
    try {
      const res = await fetch(`/api/interviews/${sessionId}`);
      const data = await res.json();
      if (data.error) {
        console.error(data.error);
        return;
      }
      setSessionData(data.session);
      setTranscript(Array.isArray(data.session.transcript) ? data.session.transcript : []);
    } catch (err) {
      console.error("❌ fetchTranscript error", err);
    }
  };

  // Called when we want AI message to be spoken and then start STT afterwards
  const handleAIMessagePlayThenListen = (aiMessage: string | null) => {
    if (!aiMessage) {
      // No message - just start listening
      startRealtimeSTT();
      return;
    }
    // Append AI message into local transcript
    const entry: TranscriptEntry = { type: "ai", message: aiMessage, timestamp: new Date().toISOString() };
    setTranscript((p) => [...p, entry]);
    // Speak then start STT after TTS finishes
    speak(aiMessage, () => {
      startRealtimeSTT();
    });
  };

  // TTS utility: speak text and call callback on end
  const speak = (ttsText: string, onEnd?: () => void) => {
    if (!ttsText) {
      onEnd?.();
      return;
    }
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utter.onerror = (e) => {
      console.error("TTS error", e);
      setSpeaking(false);
      onEnd?.();
    };
    speechSynthesis.cancel(); // Prevent overlaps
    speechSynthesis.speak(utter);
  };

  // Start the interview: call backend start endpoint to get aiMessage -> play it -> start STT after TTS
  const startInterviewFlow = async () => {
    if (isStarted) {
      // Toggle stop
      stopRealtimeSTT();
      setIsStarted(false);
      return;
    }
    setIsStarted(true);

    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: true }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      // Append server transcript if provided
      if (Array.isArray(data.transcript)) {
        setTranscript(data.transcript);
      }
      // AI speaks then we start STT
      const aiMessage = data.aiMessage ?? null;
      handleAIMessagePlayThenListen(aiMessage);
    } catch (err) {
      console.error("❌ startInterviewFlow error", err);
    }
  };

  // Realtime STT using AssemblyAI websocket
  const startRealtimeSTT = async () => {
    // Don't open multiple sockets
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) return;
    try {
      const tokenRes = await fetch("/api/getToken");
      const tokenData = await tokenRes.json();
      const token = tokenData.token;
      if (!token) throw new Error("No token from /api/getToken");

      const ws = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${token}`);
      socketRef.current = ws;

      ws.onopen = async () => {
        console.log("WebSocket open -> obtaining mic");
        // Get mic, create AudioContext
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          // Float32 -> 16bit PCM
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
          }
        };

        audioContextRef.current = audioContext;
        processorRef.current = processor;
        sourceRef.current = source;
        setIsRecording(true);
      };

      ws.onmessage = (msg) => {
        // AssemblyAI sends partial transcripts
        try {
          const payload = JSON.parse(msg.data);
          const text = payload.text ?? payload.transcript;
          if (!text) return;
          // Update live reply field and set/reset silence timer
          setReply(text);
          lastSpeechValue.current = text;
          if (speechTimer.current) clearTimeout(speechTimer.current);
          speechTimer.current = setTimeout(() => {
            // 5s silence -> send reply
            if (lastSpeechValue.current.trim()) {
              stopRealtimeSTT(); // Stop while we send and AI speaks
              handleSendReply(lastSpeechValue.current);
              lastSpeechValue.current = "";
              setReply("");
            }
          }, 5000);
        } catch (err) {
          console.error("ws onmessage parse error", err, msg.data);
        }
      };

      ws.onerror = (e) => {
        console.error("WebSocket error", e);
      };

      ws.onclose = () => {
        console.log("WS closed");
        stopRealtimeSTT();
      };
    } catch (err) {
      console.error("startRealtimeSTT error", err);
    }
  };

  const stopRealtimeSTT = () => {
    try {
      socketRef.current?.close();
      socketRef.current = null;
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
    } catch (err) {
      console.warn("Error while stopping audio nodes", err);
    } finally {
      processorRef.current = null;
      sourceRef.current = null;
      audioContextRef.current = null;
      setIsRecording(false);
    }
  };

  // Fetch final report when status is ENDED
  useEffect(() => {
    const fetchFinalReport = async () => {
      if (sessionData?.status === "ENDED" && !finalReport) {
        try {
          const res = await fetch(`/api/interviews/${sessionId}/report`);
          const data = await res.json();
          if (data.finalReport) {
            setFinalReport(data.finalReport);
          } else {
            console.error("No final report in response:", data);
          }
        } catch (err) {
          console.error("Failed to fetch final report", err);
        }
      }
    };

    fetchFinalReport();
  }, [sessionData?.status, finalReport, sessionId]);

  // When candidate reply is ready to be sent (auto or manual)
  const handleSendReply = async (content: string) => {
    if (!content.trim()) return;
    // Push local reply immediately for snappy UI
    const localReplyEntry: TranscriptEntry = { type: "reply", reply: content, timestamp: new Date().toISOString() };
    setTranscript((p) => [...p, localReplyEntry]);

    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: content }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      if (data.ended) {
        toast.success("Interview completed 🎉");
        // Append final AI message if any and stop
        if (data.aiMessage) {
          setTranscript((p) => [...p, { type: "ai", message: data.aiMessage, timestamp: new Date().toISOString() }]);
          speak(data.aiMessage);
        }
        setIsStarted(false);
        return;
      }

      // AI message returned — append and speak; after TTS ends, start STT again
      const aiMessage = data.aiMessage ?? null;
      if (aiMessage) {
        setTranscript((p) => [...p, { type: "ai", message: aiMessage, timestamp: new Date().toISOString() }]);
        speak(aiMessage, () => {
          // Resume listening after TTS
          startRealtimeSTT();
        });
      } else {
        // No AI message — resume listening
        startRealtimeSTT();
      }
    } catch (err) {
      console.error("handleSendReply error", err);
      toast.error("Failed to send reply");
    }
  };

  const endInterview = async () => {
    try {
      stopRealtimeSTT();
      speechSynthesis.cancel();

      const res = await fetch(`/api/interviews/${sessionId}/end`, {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Interview ended!");
        setIsStarted(false);
        setSessionData((prev) => (prev ? { ...prev, status: "ENDED" } : prev));
        if (data.finalReport) {
          setFinalReport(data.finalReport);
        }
      } else {
        toast.error(data.error || "Failed to end interview");
      }
      console.log("Final Report:", data.finalReport);
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error("Failed to end interview");
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    return timestamp ? format(new Date(timestamp), "HH:mm") : format(new Date(), "HH:mm");
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row font-sans bg-gradient-to-br from-gray-100 to-gray-400 p-4 sm:p-6 lg:px-32" style={{ height: "calc(100vh - 80px)" }}>
      {/* Left Video */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-200/50 rounded-xl p-4">
        <div className="w-full aspect-video bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center text-white text-xl font-semibold">
          <img src="/elon.jpg" alt="AI" className="w-40 h-40 border-blue-400 border-2 object-cover rounded-full mb-4" />
          AI Interviewer
        </div>
      </div>

      {/* Right Chat */}
      <div className="flex-1 flex flex-col bg-white lg:shadow-2xl lg:rounded-l-xl lg:ml-6">
        <header className="bg-white shadow-md p-4 sm:p-6 flex justify-between items-center border-b border-gray-200">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            {sessionData?.jobRole ? `${sessionData.jobRole} Interview` : "Interview Session"}
          </h1>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${
              sessionData?.status === "IN_PROGRESS" ? "bg-green-100 text-green-700" : 
              sessionData?.status === "ENDED" ? "bg-green-100 text-green-700" : 
              "bg-gray-100 text-gray-700"
            }`}
          >
            {sessionData?.status === "ENDED" ? "✅ Completed" : sessionData?.status || "Loading..."}
          </span>
        </header>

        {/* Transcript Area - Always show transcript */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <AnimatePresence>
            {transcript.map((entry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${entry.type === "reply" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 sm:p-4 rounded-2xl shadow-md ${
                    entry.type === "reply" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm sm:text-base font-medium">
                    {entry.type === "reply" ? "You" : "AI"}: {entry.message || entry.reply}
                  </p>
                  <p className="text-xs mt-1 opacity-50">{formatTimestamp(entry.timestamp)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Bottom Controls */}
        <div className="bg-white p-4 sm:p-6 border-t border-gray-200 shadow-md">
          {sessionData?.status === "ENDED" ? (
            finalReport ? (
              <p className="text-center text-gray-600 text-sm sm:text-base">
                Interview completed successfully! 🎉 Scroll down to view your performance report.
              </p>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 text-sm sm:text-base mb-4">
                  Generating your performance report...
                </p>
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )
          ) : (
            <div className="flex flex-col gap-3">
              {isStarted ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={endInterview}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-medium shadow-lg"
                >
                  🛑 End Interview & Generate Report
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startInterviewFlow}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-medium shadow-lg"
                >
                  🚀 Start Interview
                </motion.button>
              )}
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 border-2 border-blue-300 rounded-xl bg-blue-50/60 text-sm font-mono"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 font-medium">🔴 Live Listening: "{reply}"</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>


      </div>
      
    </div>
        {sessionData?.status === "ENDED" && finalReport && (
      <div className="w-full px-4 sm:px-8 lg:px-32 py-8 bg-gradient-to-br from-gray-100 to-gray-200">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 sm:p-8 bg-gradient-to-br from-emerald-50/80 via-blue-50/80 to-indigo-50/80 rounded-xl shadow-xl border border-emerald-200/60 space-y-6 max-w-5xl mx-auto"
        >
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent mb-2">
              🎉 Interview Performance Report
            </h2>
            <p className="text-sm sm:text-base text-gray-600">Your performance analysis is ready</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-white/20">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">📊</span>
                </div>
                <p className="text-lg sm:text-xl font-semibold text-gray-700">Overall Performance</p>
              </div>
              <p className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600">
                {finalReport.overallScore}
                <span className="text-2xl sm:text-3xl text-gray-500 font-normal">/100</span>
              </p>
              <p className="text-sm sm:text-base text-gray-500 italic mt-4 text-center max-w-2xl mx-auto px-4">
                {finalReport.summary}
              </p>
            </div>
          </div>

          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className={`px-8 py-4 rounded-full text-lg sm:text-xl font-bold shadow-lg ${
                finalReport.verdict === "Hire"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  : finalReport.verdict === "Maybe"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  : "bg-gradient-to-r from-rose-500 to-red-600 text-white"
              }`}
            >
              🎯 {finalReport.verdict} Recommendation
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
              <h3 className="text-lg sm:text-xl font-semibold text-emerald-700 mb-4 flex items-center">
                <span className="text-2xl mr-3">⭐</span>
                Strengths
              </h3>
              <ul className="space-y-3">
                {finalReport.strengths.map((strength, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start p-3 bg-emerald-50/50 rounded-lg border-l-4 border-emerald-400"
                  >
                    <span className="text-emerald-500 mr-3 mt-0.5 text-lg">✔</span>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{strength}</p>
                  </motion.li>
                ))}
              </ul>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20">
              <h3 className="text-lg sm:text-xl font-semibold text-amber-700 mb-4 flex items-center">
                <span className="text-2xl mr-3">💡</span>
                Areas for Improvement
              </h3>
              <ul className="space-y-3">
                {finalReport.improvements.map((improvement, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start p-3 bg-amber-50/50 rounded-lg border-l-4 border-amber-400"
                  >
                    <span className="text-amber-500 mr-3 mt-0.5 text-lg">⚡</span>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{improvement}</p>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    )}


</>

  )
};



export default InterviewPage;