"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
// @ts-ignore
import RecordRTC, { StereoAudioRecorder } from "recordrtc";

interface TranscriptEntry {
  type: string;
  message?: string;
  reply?: string;
  sentiment?: { sentiment: string; toneSummary: string; confidenceScore: number };
  timestamp?: string;
}

interface SessionData {
  id: string;
  jobRole: string;
  status: string;
  transcript: TranscriptEntry[];
}

export default function InterviewSessionPage() {
  const { sessionId } = useParams();
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [committedTranscript, setCommittedTranscript] = useState("");
  const [isTTSMuted, setIsTTSMuted] = useState(false);
  const [assemblyToken, setAssemblyToken] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<any>(null);
  const doneTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Fetch session on mount
  useEffect(() => {
    console.log("useEffect: Fetching transcript on mount");
    fetchTranscript();
  }, []);

  useEffect(() => {
    console.log("useEffect: Updating started state", { sessionStatus: sessionData?.status });
    if (sessionData?.status === "IN_PROGRESS") {
      setStarted(true);
    } else {
      setStarted(false);
    }
  }, [sessionData]);

  // Auto-scroll to bottom
  useEffect(() => {
    console.log("useEffect: Auto-scrolling to bottom of transcript");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("useEffect: Cleaning up on unmount");
      if (isRecording) {
        stopRecording();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if ("speechSynthesis" in window) {
        console.log("useEffect: Cancelling any ongoing TTS");
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech Function
  const speak = (text: string) => {
    console.log("speak: Attempting to speak", { text, isTTSMuted, isRecording });
    if (!text || isTTSMuted || !("speechSynthesis" in window) || isRecording) {
      console.log("speak: Aborting TTS", {
        hasText: !!text,
        isMuted: isTTSMuted,
        speechSynthesisSupported: "speechSynthesis" in window,
        isRecording,
      });
      return;
    }
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    const voices = synth.getVoices();
    console.log("speak: Available voices", voices);
    if (voices.length > 0) {
      utterance.voice = voices.find((voice) => voice.lang.includes("en")) || voices[0];
    }
    utterance.onstart = () => console.log("speak: TTS started for", text);
    utterance.onend = () => console.log("speak: TTS ended for", text);
    utterance.onerror = (event) => console.error("speak: TTS error", event);
    synth.speak(utterance);
  };

  // Speak new AI messages automatically
  useEffect(() => {
    if (transcript.length === 0) {
      console.log("useEffect: No transcript entries to speak");
      return;
    }

    const lastEntry = transcript[transcript.length - 1];
    console.log("useEffect: Checking last transcript entry", lastEntry);

    if (lastEntry.type !== "reply" && lastEntry.message) {
      console.log("useEffect: Triggering TTS for AI message", lastEntry.message);
      speak(lastEntry.message);
    }
  }, [transcript]);

  const stopRecording = () => {
    console.log("stopRecording: Stopping recording");
    if (recorderRef.current) {
      console.log("stopRecording: Stopping RecordRTC");
      recorderRef.current.stopRecording();
      recorderRef.current = null;
    }
    if (socketRef.current) {
      console.log("stopRecording: Sending Terminate to WebSocket");
      socketRef.current.send(JSON.stringify({ type: "Terminate" }));
      socketRef.current.close();
    }
    socketRef.current = null;
    if (doneTimeoutRef.current) {
      console.log("stopRecording: Clearing done timeout");
      clearTimeout(doneTimeoutRef.current);
    }
    console.log("stopRecording: Completed");
  };

  // Fetch session transcript and metadata
  const fetchTranscript = async () => {
    console.log("fetchTranscript: Fetching session data for sessionId", sessionId);
    try {
      const res = await fetch(`/api/interviews/${sessionId}`);
      const data: SessionData = await res.json();
      console.log("fetchTranscript: Received session data", data);
      setSessionData(data);
      setTranscript(data.transcript || []);
    } catch (err: any) {
      console.error("fetchTranscript: Error fetching session", err);
      toast.error("Failed to fetch session", { duration: 4000 });
    }
  };

  // Start session
  const startSession = async () => {
    console.log("startSession: Starting interview session");
    setIsLoading(true);
    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: true }),
      });
      console.log("startSession: API response status", res.status);
      if (!res.ok) throw new Error(await res.text());
      await fetchTranscript();

      // Fetch token once
      const tokenRes = await fetch("/api/getToken");
      const { token } = await tokenRes.json();
      console.log("startSession: Fetched AssemblyAI token", { token });
      if (!token) throw new Error("No token");
      setAssemblyToken(token);

      // Acquire audio stream once
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      console.log("startSession: Audio stream acquired");
      audioStreamRef.current = stream;

      setStarted(true);
      console.log("startSession: Session started successfully");
    } catch (err: any) {
      console.error("startSession: Error starting session", err);
      toast.error(err.message || "Failed to start session", { duration: 4000 });
      setStarted(false);
    } finally {
      setIsLoading(false);
      console.log("startSession: Loading state reset");
    }
  };

  // Send reply to backend
  const sendReply = async (reply: string) => {
    console.log("sendReply: Sending reply", { reply });
    if (!reply.trim()) {
      console.log("sendReply: Empty reply, aborting");
      return;
    }
    setIsLoading(true);

    // Add final reply to transcript
    const finalEntry: TranscriptEntry = {
      type: "reply",
      reply,
      timestamp: new Date().toISOString(),
    };
    console.log("sendReply: Adding final entry to transcript", finalEntry);
    setTranscript((prev) => [...prev, finalEntry]);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });
      const data = await res.json();
      console.log("sendReply: API response", data);

      if (data.error) {
        console.error("sendReply: API error", data.error);
        toast.error(data.error, { duration: 4000 });
        return;
      }
      if (data.ended) {
        console.log("sendReply: Interview completed");
        toast.success("Interview completed!", {
          duration: 4000,
          icon: "🎉",
        });
      }

      await fetchTranscript();
      console.log("sendReply: Transcript fetched after reply");
    } catch (err: any) {
      console.error("sendReply: Error sending reply", err);
      toast.error(err.message || "Something went wrong", { duration: 4000 });
    } finally {
      setIsLoading(false);
      setCommittedTranscript("");
      setCurrentTranscript("");
      console.log("sendReply: Reset loading and transcript states");
    }
  };

  // Toggle recording and STT
  const toggleRecording = async () => {
    console.log("toggleRecording: Toggling recording state", { isRecording });
    setIsRecording(!isRecording);

    if (isRecording) {
      console.log("toggleRecording: Stopping recording");
      stopRecording();
      return;
    }

    console.log("toggleRecording: Starting recording");
    if (!assemblyToken) {
      console.error("toggleRecording: No assembly token available");
      toast.error("No token available. Please restart the session.");
      setIsRecording(false);
      return;
    }
    if (!audioStreamRef.current) {
      console.error("toggleRecording: No audio stream available");
      toast.error("No audio stream. Please restart the session.");
      setIsRecording(false);
      return;
    }

    try {
      const socket = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${assemblyToken}`
      );
      socketRef.current = socket;

      socket.onopen = async () => {
        console.log("toggleRecording: WebSocket opened");
        recorderRef.current = new RecordRTC(audioStreamRef.current, {
          type: "audio",
          mimeType: "audio/webm;codecs=pcm",
          recorderType: StereoAudioRecorder,
          timeSlice: 250,
          desiredSampRate: 16000,
          numberOfAudioChannels: 1,
          bufferSize: 4096,
          ondataavailable: async (blob: Blob) => {
            console.log("toggleRecording: Audio data available");
            const buffer = await blob.arrayBuffer();
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(buffer);
              console.log("toggleRecording: Sent audio buffer to WebSocket");
            }
          },
        });
        recorderRef.current.startRecording();
        console.log("toggleRecording: Started recording");
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        console.log("toggleRecording: WebSocket message received", msg);

        if (msg.type === "Begin") return;
        if (msg.type === "Turn") {
          const newTranscript = msg.transcript || "";
          console.log("toggleRecording: Received transcript", newTranscript);
          setCurrentTranscript(newTranscript);

          if (doneTimeoutRef.current) {
            console.log("toggleRecording: Clearing previous timeout");
            clearTimeout(doneTimeoutRef.current);
          }
          doneTimeoutRef.current = setTimeout(() => {
            const fullReply = (committedTranscript + " " + newTranscript).trim();
            console.log("toggleRecording: Timeout triggered, sending final reply", fullReply);
            if (fullReply) {
              sendReply(fullReply);
            }
            toggleRecording();
          }, 3000);

          if (msg.end_of_turn) {
            console.log("toggleRecording: End of turn detected, committing transcript");
            setCommittedTranscript((prev) => prev + (msg.turn_is_formatted ? msg.transcript : msg.transcript + ".") + " ");
            setCurrentTranscript("");
          }
          return;
        }

        if (msg.type === "Termination") {
          console.log("toggleRecording: WebSocket termination received");
          stopRecording();
        }
      };

      socket.onerror = (err) => console.error("toggleRecording: WebSocket error", err);
      socket.onclose = () => {
        console.log("toggleRecording: WebSocket closed");
        socketRef.current = null;
      };
    } catch (err) {
      console.error("toggleRecording: Error starting transcription", err);
      toast.error("Failed to start transcription");
      setIsRecording(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp?: string) => {
    console.log("formatTimestamp: Formatting timestamp", timestamp);
    return timestamp ? format(new Date(timestamp), "HH:mm") : format(new Date(), "HH:mm");
  };

  return (<div className="flex flex-col lg:flex-row font-sans bg-gradient-to-br from-gray-100 to-red-800 p-4 sm:p-6 lg:px-32"
     style={{ height: "calc(100vh - 80px)" }} // subtract header height
>
  {/* Left: Video Section */}
  <div className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-200/50 backdrop-blur-sm rounded-xl lg:rounded-2xl p-4">
    <div className="w-full aspect-video bg-gray-900 rounded-xl shadow-lg flex flex-col items-center justify-center text-white text-xl sm:text-2xl font-semibold lg:rounded-2xl">
      <img
        src="/elon.jpg"
        alt="Elon"
        className="w-40 h-40 border-blue-400 border-2 object-cover rounded-full mb-4"
      />
      AI Interviewer
    </div>
  </div>

  {/* Right: Chat and Controls */}
  <div className="flex-1 flex flex-col bg-white lg:shadow-2xl lg:rounded-l-xl lg:ml-6">
    {/* Header */}
    <header className="bg-white shadow-md p-4 sm:p-6 flex justify-between items-center border-b border-gray-200">
      <h1 className="text-lg sm:text-xl font-bold text-gray-800">
        {sessionData?.jobRole ? `${sessionData.jobRole} Interview` : "Interview Session"}
      </h1>
      <div className="flex items-center space-x-4">
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            sessionData?.status === "IN_PROGRESS"
              ? "bg-green-100 text-green-700"
              : sessionData?.status === "ENDED"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {sessionData?.status || "Loading..."}
        </span>
      </div>
    </header>

        {/* Chat Area */}
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
                    entry.type === "reply"
                      ? "bg-blue-500 text-white"
                      : entry.type === "question"
                      ? "bg-gray-200 text-gray-800"
                      : entry.type === "intro"
                      ? "bg-blue-100 text-blue-800"
                      : entry.type === "elaboration"
                      ? "bg-purple-100 text-purple-800"
                      : entry.type === "followup"
                      ? "bg-green-100 text-green-800"
                      : entry.type === "encouragement"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm sm:text-base font-medium">
                    {entry.type === "reply" ? "You" : "AI"}: {entry.message || entry.reply}
                  </p>
                  {entry.sentiment && (
                    <p className="text-xs mt-1 opacity-75">
                      Sentiment: {entry.sentiment.sentiment} ({entry.sentiment.confidenceScore})
                    </p>
                  )}
                  <p className="text-xs mt-1 opacity-50">{formatTimestamp(entry.timestamp)}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white p-4 sm:p-6 border-t border-gray-200 shadow-md">
          {sessionData?.status === "ENDED" ? (
            <p className="text-center text-gray-600 text-sm sm:text-base">
              Interview has ended. View report for details.
            </p>
          ) : !started ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startSession}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Starting..." : "Start Interview"}
            </motion.button>
          ) : (
            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-300 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={toggleRecording}
                disabled={isLoading}
              >
                {isRecording ? "Stop Speaking" : "Start Speaking"}
              </motion.button>
              {isRecording && (
                <p className="p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm sm:text-base">
                  Live Transcript: {committedTranscript}{currentTranscript}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}