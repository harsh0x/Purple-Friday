"use client";

import React, { useState, useRef, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  UploadCloud,
  X,
  CheckCircle2,
  FileText,
  Phone,
  Mail,
  User,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface LetOurTeamDesignModalProps {
  productName: string;
  productSlug?: string;
  triggerButton?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export function LetOurTeamDesignModal({
  productName,
  productSlug = "product",
  triggerButton,
  isOpen,
  onClose,
}: LetOurTeamDesignModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled) {
      if (!val && onClose) onClose();
    } else {
      setInternalOpen(val);
    }
  };
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Voice Note Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [audioUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 20 * 1024 * 1024) {
        toast.error("File size exceeds 20MB limit.");
        return;
      }
      setFile(selected);
    }
  };

  // Start voice recording (max 60 seconds)
  const startRecording = async () => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      toast.info("Voice recording is not supported in this browser. Please type your notes below.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "";
      if (errorMsg.includes("Permission") || errorMsg.includes("denied") || errorMsg.includes("NotAllowedError")) {
        toast.info("Microphone permission was not granted. You can type your instructions in the notes box below.");
      } else {
        toast.info("Could not start audio recorder. You can type your instructions in the notes box below.");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSeconds(0);
    setIsPlayingAudio(false);
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current || !audioUrl) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.error("Please fill in your name, email, and phone.");
      return;
    }

    try {
      let uploadedFileUrl = "";
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "design-brief");
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.upload?.url) {
          uploadedFileUrl = uploadData.upload.url;
        }
      }

      // If voice note exists, append note description
      const finalNotes = audioBlob
        ? `${notes}\n[Voice Note Attached: ${recordingSeconds}s duration]`.trim()
        : notes;

      await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug,
          productName,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          notes: finalNotes,
          briefFileUrl: uploadedFileUrl,
        }),
      });

      setSubmitted(true);
      toast.success("Design brief submitted! A prepress specialist will contact you on WhatsApp within 2 hours.");
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setFile(null);
        setNotes("");
        deleteRecording();
      }, 2500);
    } catch {
      toast.error("Network error while submitting brief. Please try again.");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {triggerButton ? (
          triggerButton
        ) : (
          <button
            type="button"
            className="text-xs font-mono font-bold text-violet hover:underline flex items-center justify-center gap-1.5 mx-auto"
          >
            <span>Have a design? Let our team design it for you →</span>
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-ink/70 z-50 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:max-w-lg bg-white border-2 border-ink p-6 shadow-stamp-lg focus:outline-none max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b-2 border-ink mb-5">
            <div>
              <span className="font-mono text-[10px] uppercase font-bold text-violet">
                Complimentary Studio Service
              </span>
              <Dialog.Title className="font-display text-xl font-bold text-ink">
                Let Our Team Design It
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                aria-label="Close dialog"
                className="p-1 rounded-full border border-ink hover:bg-paper"
              >
                <X className="h-5 w-5 text-ink" />
              </button>
            </Dialog.Close>
          </div>

          {submitted ? (
            <div className="py-8 text-center space-y-3">
              <div className="h-14 w-14 mx-auto rounded-full bg-emerald-100 border-2 border-emerald-600 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="font-display text-xl font-bold text-ink">
                Artwork Brief Received!
              </h4>
              <p className="text-sm font-sans text-ink/75 max-w-sm mx-auto">
                Our prepress design team is reviewing your files for <strong>{productName}</strong>. You will receive an exact 3D proof via WhatsApp within 2 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs font-sans text-ink/75 leading-relaxed">
                Drop your raw logo, sketches, or brand guide. Our in-house designers vectorize and format it onto <strong>{productName}</strong> at no extra cost.
              </p>

              {/* File Dropzone */}
              <div className="border-2 border-dashed border-ink/40 bg-paper p-5 text-center relative hover:border-violet transition-colors">
                <input
                  type="file"
                  id={`file-upload-${productSlug}`}
                  accept=".png,.jpg,.jpeg,.svg,.pdf,.ai,.eps,.psd"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="h-7 w-7 mx-auto text-violet mb-2" />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-ink">
                    <FileText className="h-4 w-4 text-violet" />
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <span className="text-ink/50">({(file.size / 1024).toFixed(0)} KB)</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-mono text-xs font-bold text-ink block">
                      Drag & drop your logo / artwork file
                    </span>
                    <span className="font-sans text-[11px] text-ink/60">
                      Supports AI, PDF, EPS, SVG, PNG, JPG (up to 20MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none focus:ring-2 focus:ring-violet"
                  />
                </div>
              </div>

              {/* Email & Phone Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input
                      type="email"
                      required
                      placeholder="priya@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none focus:ring-2 focus:ring-violet"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs font-bold text-ink uppercase mb-1">
                    WhatsApp Phone
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none focus:ring-2 focus:ring-violet"
                    />
                  </div>
                </div>
              </div>

              {/* Design Notes & Optional Voice Note Recorder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-mono text-xs font-bold text-ink uppercase">
                    Design Instructions / Notes
                  </label>
                  {!isRecording && !audioUrl && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-violet hover:underline"
                    >
                      <Mic className="h-3.5 w-3.5" />
                      <span>Record Voice Note (max 60s)</span>
                    </button>
                  )}
                </div>

                {/* Active Recording Bar */}
                {isRecording && (
                  <div className="p-3 border-2 border-rose-500 bg-rose-50 rounded-xs flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-600 animate-ping" />
                      <span className="font-mono text-xs font-bold text-rose-700">
                        Recording audio instructions... ({60 - recordingSeconds}s remaining)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="inline-flex items-center gap-1 bg-rose-600 text-white font-mono text-xs px-2.5 py-1 rounded shadow-sm hover:bg-rose-700"
                    >
                      <Square className="h-3 w-3 fill-white" />
                      <span>Stop</span>
                    </button>
                  </div>
                )}

                {/* Recorded Audio Preview */}
                {audioUrl && !isRecording && (
                  <div className="p-3 border-2 border-violet bg-lilac/20 rounded-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={togglePlayAudio}
                        className="h-8 w-8 rounded-full bg-violet text-white flex items-center justify-center hover:bg-violet-hover"
                      >
                        {isPlayingAudio ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4 ml-0.5" />
                        )}
                      </button>
                      <div>
                        <span className="font-mono text-xs font-bold text-ink block">
                          Voice Note Recorded ({recordingSeconds}s)
                        </span>
                        <span className="font-sans text-[11px] text-ink/60">
                          Click to play and preview before sending
                        </span>
                      </div>
                      <audio
                        ref={audioPlayerRef}
                        src={audioUrl}
                        onEnded={() => setIsPlayingAudio(false)}
                        className="hidden"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={deleteRecording}
                      className="p-1 text-ink/50 hover:text-rose-600 transition-colors"
                      aria-label="Delete voice note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="e.g. Center logo on chest, leave 2-inch margins, use exact Pantone 2685 C violet..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border-2 border-ink bg-white font-sans text-xs text-ink focus:outline-none focus:ring-2 focus:ring-violet resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full border-2 border-ink bg-violet text-white font-mono text-sm font-bold uppercase tracking-wider py-3 shadow-stamp hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-stamp-active transition-all"
                >
                  Submit Brief for Free 3D Proof
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
