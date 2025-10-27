"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { format } from "date-fns";
// @ts-ignore
import RecordRTC, { StereoAudioRecorder } from "recordrtc";
import { Button } from "@/app/components/ui/button";
import axios from "axios";

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

  const [message , setMessage] = useState("")

    const [socket, setSocket] = useState<WebSocket | null>(null);
  

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

  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const [isSending, setIsSending] = useState(false);

  const [isAITurn, setIsAITurn] = useState(true);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [isAudioActivated, setIsAudioActivated] = useState(false);

  const pendingSpeakRef = useRef<string | null>(null);

   const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  

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

  // Load voices
  // useEffect(() => {
  //   if ("speechSynthesis" in window) {
  //     const synth = window.speechSynthesis;
  //     const updateVoices = () => {
  //       const loadedVoices = synth.getVoices();
  //       console.log("useEffect: Loaded voices", loadedVoices);
  //       setVoices(loadedVoices);
  //       if (loadedVoices.length > 0 && pendingSpeakRef.current) {
  //         console.log("useEffect: Retrying pending TTS", pendingSpeakRef.current);
  //         speak(pendingSpeakRef.current);
  //         pendingSpeakRef.current = null;
  //       }
  //     };
  //     updateVoices();
  //     synth.addEventListener("voiceschanged", updateVoices);
  //     return () => synth.removeEventListener("voiceschanged", updateVoices);
  //   } else {
  //     console.error("useEffect: SpeechSynthesis not supported in this browser");
  //     toast.error("Text-to-Speech is not supported in this browser.");
  //   }
  // }, []);

  // --- Load Voices and Handle Pending Speech ---
useEffect(() => {
  if (!("speechSynthesis" in window)) {
    console.error("SpeechSynthesis not supported in this browser");
    toast.error("Text-to-Speech is not supported in this browser.");
    return;
  }

  const synth = window.speechSynthesis;

  const updateVoices = () => {
    const loaded = synth.getVoices();
    if (loaded.length > 0) {
      console.log("Voices loaded:", loaded.map((v) => v.name));
      setVoices(loaded);

      // If something was pending to speak, retry
      if (pendingSpeakRef.current) {
        console.log("Retrying pending speech:", pendingSpeakRef.current);
        speak(pendingSpeakRef.current);
        pendingSpeakRef.current = null;
      }
    }
  };

  // Sometimes voices are not immediately available — force reload
  if (synth.getVoices().length === 0) {
    // On Safari/Chrome, calling getVoices triggers async loading
    synth.onvoiceschanged = updateVoices;
    synth.getVoices();
  } else {
    updateVoices();
  }

  // Listen for updates (Chrome usually fires this once)
  synth.addEventListener("voiceschanged", updateVoices);

  return () => synth.removeEventListener("voiceschanged", updateVoices);
}, []);


// // --- Fixed Text-to-Speech function ---
// const speak = async (text: string) => {
//   console.log("speak(): Attempting to speak", { text });

//   if (!text || isTTSMuted || !("speechSynthesis" in window)) {
//     console.log("speak(): Aborted — TTS muted or unsupported");
//     return;
//   }

//   if (isRecording) {
//     console.log("speak(): Aborted — user is recording");
//     return;
//   }

//   if (!isAudioActivated) {
//     console.warn("speak(): Audio not activated yet — retrying after activation");
//     try {
//       await activateAudioContext();
//     } catch {
//       toast.error("Click 'Start Interview' again to enable audio.");
//       pendingSpeakRef.current = text;
//       return;
//     }
//   }

//   // Ensure voices are available
//   if (voices.length === 0) {
//     console.log("speak(): Voices not loaded yet, storing pending text");
//     pendingSpeakRef.current = text;
//     // Trigger voices load again (some browsers need multiple calls)
//     window.speechSynthesis.getVoices();
//     return;
//   }

//   // Cancel any previous utterances
//   const synth = window.speechSynthesis;
//   synth.cancel();

//   const utterance = new SpeechSynthesisUtterance(text);
//   utterance.lang = "en-US";
//   utterance.rate = 1.0;
//   utterance.volume = 1.0;

//   // Select a stable English voice
//   const preferredVoice =
//     voices.find((v) =>
//       v.name.match(/(Google US English|Microsoft|en-US)/)
//     ) || voices[0];

//   if (preferredVoice) {
//     utterance.voice = preferredVoice;
//     console.log("speak(): Using voice:", preferredVoice.name);
//   }

//   utterance.onstart = () => {
//     console.log("speak(): TTS started");
//     setIsAISpeaking(true);
//   };
//   utterance.onend = () => {
//     console.log("speak(): TTS ended");
//     setIsAISpeaking(false);
//   };
//   utterance.onerror = (event) => {
//     console.error("speak(): Error", event);
//     setIsAISpeaking(false);
//     if (event.error === "not-allowed") {
//       toast.error("TTS blocked by browser. Click 'Start Interview' again to allow sound.");
//       setIsAudioActivated(false);
//     }
//   };

//   synth.speak(utterance);
// };


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

  // Activate audio context workaround
  // const activateAudioContext = async () => {
  //   if (isAudioActivated) {
  //     console.log("activateAudioContext: Audio context already activated");
  //     return;
  //   }
  //   try {
  //     const silentAudio = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
  //     const audio = new Audio(silentAudio);
  //     await audio.play();
  //     console.log("activateAudioContext: Audio context activated successfully");
  //     setIsAudioActivated(true);
  //   } catch (error) {
  //     console.error("activateAudioContext: Error activating audio context", error);
  //     toast.error("Failed to activate audio for TTS. Please click 'Start Interview' again.");
  //     throw error;
  //   }
  // };

  const activateAudioContext = async () => {
  if (isAudioActivated) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    setIsAudioActivated(true);
    console.log("activateAudioContext(): Audio context activated");
  } catch (err) {
    console.error("activateAudioContext(): Failed", err);
    toast.error("Please click 'Start Interview' to enable audio.");
    throw err;
  }
};

  // Text-to-Speech Function
  const speak = async (text: string) => {
    console.log("speak: Attempting to speak", { text, isTTSMuted, isRecording, isAudioActivated, voicesLoaded: voices.length });
    if (!text || isTTSMuted || !("speechSynthesis" in window) || isRecording || !isAudioActivated) {
      console.log("speak: Aborting TTS", {
        hasText: !!text,
        isMuted: isTTSMuted,
        speechSynthesisSupported: "speechSynthesis" in window,
        isRecording,
        isAudioActivated,
      });
      if (text && voices.length === 0 && !pendingSpeakRef.current) {
        console.log("speak: Voices not loaded, storing pending text", text);
        pendingSpeakRef.current = text;
      }
      return;
    }

    if (voices.length === 0) {
      console.log("speak: Voices not loaded yet, storing pending text", text);
      pendingSpeakRef.current = text;
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.0;
    utterance.volume = 1.0;
    console.log("speak: Available voices", voices);
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Google") ||
        voice.name.includes("Microsoft") ||
        voice.lang.includes("en")
    ) || voices[0];
    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log("speak: Selected voice", preferredVoice.name);
    } else {
      console.log("speak: No preferred voice found, using default");
    }
    utterance.onstart = () => {
      console.log("speak: TTS started for", text);
      setIsAISpeaking(true);
    };
    utterance.onend = () => {
      console.log("speak: TTS ended for", text);
      setIsAISpeaking(false);
    };
    utterance.onerror = (event) => {
      console.error("speak: TTS error", event);
      setIsAISpeaking(false);
      if (event.error === "not-allowed") {
        toast.error("TTS blocked. Please interact with the page (e.g., click 'Start Interview').");
        setIsAudioActivated(false);
      }
    };
    synth.speak(utterance);
  };

  // Speak new AI messages automatically
  useEffect(() => {
    if (transcript.length === 0) return;
    const lastEntry = transcript[transcript.length - 1];
    console.log("useEffect: Checking transcript update", { lastEntryType: lastEntry.type, message: lastEntry.message });
    if (lastEntry.type === "reply") {
      setIsAITurn(true);
      // Ensure recording is stopped before AI speaks
      if (isRecording) {
        console.log("useEffect: Stopping recording before AI turn");
        setIsRecording(false);
        stopRecording();
      }
    } else if (lastEntry.message && isAITurn) {
      setIsAITurn(false);
      speak(lastEntry.message).catch((error) => console.error("Error in speak:", error));
    }
  }, [transcript, voices, isAudioActivated]);

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
      socketRef.current = null;
    }
    if (doneTimeoutRef.current) {
      console.log("stopRecording: Clearing done timeout");
      clearTimeout(doneTimeoutRef.current);
      doneTimeoutRef.current = null;
    }
    setIsRecording(false); // Ensure state is updated
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

const startSession = async()=>{
  console.log("inside start session");
  try {
          const res = await fetch(`/api/getToken`);
          const data = await res.json();
          const {token}  =data;
          console.log("token is " , token);
          
          if(!token){
            alert("failed to get token")
            return;
          }
          console.log("connecting websocket...")

          const ws = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${token}`);
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
      setMessage((prev) => `${res.text}`);
    }

    if (res.message_type === "FinalTranscript" && res.text) {
      console.log("✅ Final transcript:", res.text);
      setMessage((prev) => prev + " " + res.text);
      
    }
    setMessage(res.transcript)

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




  }

   catch (error) {
          console.error("❌ Error initializing STT:", error);

  }
}


useEffect(()=>{
  
})



  // Start session
  // const startSession = async () => {
  //   console.log("startSession: Starting interview session");
  //   setIsLoading(true);
  //   try {
  //     const res = await fetch(`/api/interviews/${sessionId}`, {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ start: true }),
  //     });
  //     console.log("startSession: API response status", res.status);
  //     if (!res.ok) throw new Error(await res.text());
  //     await fetchTranscript();

  //     // Fetch token once
  //     const tokenRes = await fetch("/api/getToken");
  //     const { token } = await tokenRes.json();
  //     console.log("startSession: Fetched AssemblyAI token", { token });
  //     if (!token) throw new Error("No token");
  //     setAssemblyToken(token);

  //     // Acquire audio stream once
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  //     console.log("startSession: Audio stream acquired");
  //     audioStreamRef.current = stream;

  //     // Activate audio context on user gesture
  //     await activateAudioContext();

  //     setStarted(true);
  //     console.log("startSession: Session started successfully");
  //   } catch (err: any) {
  //     console.error("startSession: Error starting session", err);
  //     toast.error(err.message || "Failed to start session", { duration: 4000 });
  //     setStarted(false);
  //   } finally {
  //     setIsLoading(false);
  //     console.log("startSession: Loading state reset");
  //   }
  // };

  // Send reply to backend
  const sendReply = async (reply: string) => {
    console.log("sendReply: Sending reply", { reply });
    if (!reply.trim()) {
      console.log("sendReply: Empty reply, aborting");
      return;
    }
    setIsSending(true);
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
      setIsSending(false);
      setCommittedTranscript("");
      setCurrentTranscript("");
      console.log("sendReply: Reset loading and transcript states");
    }
  };

  // Toggle recording and STT
  const toggleRecording = async () => {
    console.log(isRecording,"isrecording")
    if (isRecording) {
      console.log("toggleRecording: Stopping recording");
      setIsRecording(false);
      stopRecording();
      return;
    }

    if (isAISpeaking) {
      console.log("toggleRecording: Aborting, AI is speaking");
      toast.error("Cannot start recording while AI is speaking");
      return;
    }

    console.log("toggleRecording: Starting recording");
    if (!assemblyToken) {
      console.error("toggleRecording: No assembly token available");
      toast.error("No token available. Please restart the session.");
      return;
    }
    if (!audioStreamRef.current) {
      console.log(audioStreamRef.current ,"audio stream")
      console.error("toggleRecording: No audio stream available");
      toast.error("No audio stream. Please restart the session.");
      return;
    }

  //    if (!audioStreamRef.current) {
  //   try {
  //     console.log("toggleRecording: No audio stream, requesting mic access...");
  //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //     audioStreamRef.current = stream;
  //     console.log("toggleRecording: Microphone access granted");
  //   } catch (err) {
  //     console.error("toggleRecording: Microphone permission denied or unavailable", err);
  //     toast.error("Microphone access denied. Please allow mic and try again.");
  //     return;
  //   }
  // }

    try {
      setIsRecording(true);
      const socket = new WebSocket(
        `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&encoding=pcm_s16le&token=${assemblyToken}`
      );
      socketRef.current = socket;

      socket.onopen = async () => {
        console.log("toggleRecording: WebSocket opened");
        if (!isRecording) {
          console.log("toggleRecording: Recording stopped before WebSocket opened, closing socket");
          socket.close();
          return;
}
        recorderRef.current = new RecordRTC(audioStreamRef.current, {
          type: "audio",
          mimeType: "audio/webm;codecs=pcm_s16le",
          recorderType: StereoAudioRecorder,
          timeSlice: 250,
          desiredSampRate: 16000,
          numberOfAudioChannels: 1,
          bufferSize: 4096,
          ondataavailable: async (blob: Blob) => {
            if (!isRecording || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
              console.log("toggleRecording: Skipping audio data, recording stopped or socket closed");
              return;
            }
            console.log("toggleRecording: Audio data available");
            const buffer = await blob.arrayBuffer();
            socketRef.current.send(buffer);
            console.log("toggleRecording: Sent audio buffer to WebSocket");
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
          setCurrentTranscript(newTranscript);
          if (doneTimeoutRef.current) clearTimeout(doneTimeoutRef.current);
          doneTimeoutRef.current = setTimeout(() => {
            if (isSending) {
              console.log("toggleRecording: Skipping sendReply, already sending");
              return;
            }
            const fullReply = (committedTranscript + " " + newTranscript).trim();
            if (fullReply) {
              console.log("toggleRecording: Sending full reply after pause", fullReply);
              sendReply(fullReply);
            }
          }, 5000);
          if (msg.end_of_turn) {
            setCommittedTranscript((prev) => prev + (msg.turn_is_formatted ? msg.transcript : msg.transcript + ".") + " ");
            setCurrentTranscript("");
          }
          return;
        }

        if (msg.type === "Termination") {
          console.log("toggleRecording: WebSocket termination received");
          setIsRecording(false);
          stopRecording();
        }
      };

      socket.onerror = (err) => {
        console.error("toggleRecording: WebSocket error", err);
        toast.error("WebSocket connection error. Please try again.");
        setIsRecording(false);
        stopRecording();
      };
      socket.onclose = () => {
        console.log("toggleRecording: WebSocket closed");
        setIsRecording(false);
        stopRecording();
        toast.error("Transcription connection closed. Restart recording if needed.");
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

  return (
    <div
      className="flex flex-col lg:flex-row font-sans bg-gradient-to-br from-gray-100 to-red-800 p-4 sm:p-6 lg:px-32"
      style={{ height: "calc(100vh - 80px)" }}
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
            <button
              onClick={() => setIsTTSMuted(!isTTSMuted)}
              className="text-gray-600 hover:text-gray-800 transition-colors"
              title={isTTSMuted ? "Unmute AI Speech" : "Mute AI Speech"}
            >
              {isTTSMuted ? "🔇" : "🔊"}
            </button>
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
                  isLoading || isAISpeaking || sessionData?.status === "ENDED" ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={toggleRecording}
                disabled={isLoading || isAISpeaking || sessionData?.status === "ENDED"}
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
        {/* <Button onClick={()=>{setIsAudioActivated(true);
        setAssemblyToken('AQICAHgniYaElTsUjrvXxctupi0J2iqJuH8-jsA2X_IMiWgmywE1kc4AiFU2xUI4WB7IXowLAAADwjCCA74GCSqGSIb3DQEHBqCCA68wggOrAgEAMIIDpAYJKoZIhvcNAQcBMB4GCWCGSAFlAwQBLjARBAyFOmp_7KoqotriPzgCARCAggN15DbpqT3ywhcW8XQJGQyqZDCrl9oyj5PPPXwJOMb5lYE66aKqs7XUndrnrKFU5sLzuXgmLok-WxtPxBWlbciltLcJcttQShLXRnVbOSyUgj-GHSY3ytCAnURP8nuUrjnxwMyBlXb1CwDsk7ihbDg9DSXLX62oaCPz8S8fKg55Cex4PqmW_8MyVkJVUePPyrFYERRtLUtui1sOma43t853h89qAoGDlhZFhcHnJQb0ry8ym5_a4dNtlcCwUsA80ukHNuqO8aU3pD-azbVjJkY6-0b7lEB82AI7-qbQmOBCqpwyfGn0ToxXTSu0c1jC7pLwKxBkAbLKqMFSvMtGlUxDMAbc2aTx_QmjSOPYV1UxOljrqWEr2XtW5zPlStY3hrGs974MiIK5AOvp7eEXSO-C-0A3nXIr_lQFTkkeUiiYzsWEhEVYCHgcNtEz0bFLlIrAPuooMDVkW3kPHejpxUModS7BVLoswYNl5GYqA3J4uAZMBWE0apFYIOaDsP5oXpOl7KP8IFqJCZjVXp8yW4uBb3sFRB6tC3PNA8BU8QPEY-6ssHJgyBi_D3iL4DXnaB6us5gG376rM1iPjgl-BlNOxMCUyKgyhFnwpXQFPk7qtrOuP6DlW2TKp8N-282iwI4eX3B3FC-5v5yQmnaqgLI-rVBW2lA-eB9uP0UIS-zCLeRyzSqeZIO192KGgYTChQAiZMY7yM9Vv3g6yA7XNkYI0P1_DiuuyI4rQI79sr9QzG4pVtS160SBbte25M6Y-vIzTO8UUdgEL9vGkuTXwe9eQkdhsj_e1bXL97y6A7H4dN-kSTIKNQLeV2jY8qbf6S7z3Go4ghazRdMu8FUCEdL-sP6YLLAbpO8xWc3xE93ogz8Ya6o2ZsIBdDd2wM_khYyA23dWavwBGLwMtlpqNfTS5FLDOnx69Jhg0jcJnRAY33J4eSXql-OleV7xac9dKKuNZjHQftjJqXsGfsdmZ2K63TyUL4xkSH21yej4nW2MvGM5ETQhfpFkFA-LdOKWXbuEGkBbDJ8hmSp5MGBbKEuOIlBd-AXsWSrj0-v26_1P75cCF0BgxqYcQrC4OuvUqUNpPQe9ORwNeE-3-LlOrhy356W07g7botDjBeqTgYG7Gv_bWHsxqyQMyN0FpiQR-YeljeYIFQErmER384GjfVNhuyJEphc_')
          console.log(setIsAudioActivated,"setisaudioactivated")
        }}>set isactivated </Button> */}
      </div>
    </div>
  );
}