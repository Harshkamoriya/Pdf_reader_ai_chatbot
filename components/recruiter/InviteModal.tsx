"use client";

import { useState } from "react";
import { X, Mail, Send, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function InviteModal({ isOpen, onClose, jobId, jobTitle }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setTimeout(() => {
          setSent(false);
          setEmail("");
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-lg">Invite Candidate</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-6 animate-in slide-in-from-bottom-4 duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 size={32} />
              </div>
              <p className="font-bold text-xl">Invite Sent!</p>
              <p className="text-sm text-center text-muted-foreground mt-2 px-4">
                We've sent an invitation link to <strong>{email}</strong> for the <strong>{jobTitle}</strong> position.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4">
                  <Mail size={24} />
                </div>
                <h4 className="font-bold text-xl">Send Test Link</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter the candidate's email address to send them a unique link to the assessment pipeline.
                </p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="candidate@example.com"
                    className="w-full p-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-black/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Send Invitation
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
