"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Music, ImagePlus, Upload, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import { uploadSong } from "@/app/actions/uploadSong";

type UploadState = "idle" | "uploading-audio" | "uploading-cover" | "saving" | "done";

export function UploadSongForm() {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("");
  const [state, setState] = useState<UploadState>("idle");

  const { startUpload: uploadAudio } = useUploadThing("songAudio");
  const { startUpload: uploadCover } = useUploadThing("songCover");

  const onDropAudio = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setAudioFile(file);
    // Pre-fill title from filename
    const name = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    if (!title) setTitle(name);
  }, [title]);

  const onDropCover = useCallback((accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setCoverFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreview(url);
  }, []);

  const { getRootProps: getAudioRootProps, getInputProps: getAudioInputProps, isDragActive: isAudioDragActive } = useDropzone({
    onDrop: onDropAudio,
    accept: { "audio/*": [".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a"] },
    maxFiles: 1,
    maxSize: 32 * 1024 * 1024,
  });

  const { getRootProps: getCoverRootProps, getInputProps: getCoverInputProps } = useDropzone({
    onDrop: onDropCover,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxFiles: 1,
    maxSize: 4 * 1024 * 1024,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile || !title.trim() || !artist.trim()) return;

    try {
      // 1. Upload audio
      setState("uploading-audio");
      const audioResult = await uploadAudio([audioFile]);
      if (!audioResult?.[0]?.url) throw new Error("Audio upload failed");
      const audioUrl = audioResult[0].url;

      // 2. Upload cover if provided
      let coverUrl: string | undefined;
      if (coverFile) {
        setState("uploading-cover");
        const coverResult = await uploadCover([coverFile]);
        coverUrl = coverResult?.[0]?.url;
      }

      // 3. Get duration from audio element
      const duration = await getAudioDuration(audioFile);

      // 4. Save to DB
      setState("saving");
      const result = await uploadSong({
        title: title.trim(),
        artist: artist.trim(),
        album: album.trim() || undefined,
        genre: genre.trim() || undefined,
        duration,
        audioUrl,
        coverUrl,
      });

      if (result.error) throw new Error(result.error);

      setState("done");
      toast.success(`"${title}" added to Sonara`);
    } catch (err) {
      setState("idle");
      toast.error(err instanceof Error ? err.message : "Upload failed");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <CheckCircle2 size={48} className="text-green-500" />
        <p className="text-xl font-semibold text-zinc-100">Track uploaded!</p>
        <button
          onClick={() => {
            setState("idle");
            setAudioFile(null);
            setCoverFile(null);
            setCoverPreview(null);
            setTitle("");
            setArtist("");
            setAlbum("");
            setGenre("");
          }}
          className="h-9 px-4 rounded-md bg-zinc-800 text-zinc-100 text-sm font-medium hover:bg-zinc-700 transition-colors"
        >
          Upload another
        </button>
      </div>
    );
  }

  const isLoading = state !== "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Audio dropzone */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Audio file *</label>
        <div
          {...getAudioRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isAudioDragActive ? "border-[#FF5500] bg-orange-500/5" : "border-zinc-700 hover:border-zinc-500"}
            ${audioFile ? "border-green-600/50 bg-green-500/5" : ""}
          `}
        >
          <input {...getAudioInputProps()} />
          {audioFile ? (
            <div className="flex items-center justify-center gap-3">
              <Music size={20} className="text-green-500" />
              <span className="text-sm text-zinc-200 font-medium">{audioFile.name}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload size={24} className="mx-auto text-zinc-500" />
              <p className="text-sm text-zinc-400">Drop audio file here or <span className="text-[#FF5500]">browse</span></p>
              <p className="text-xs text-zinc-600">MP3, FLAC, WAV, OGG — max 32MB</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Metadata */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Track title"
              required
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Artist *</label>
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              required
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Album</label>
            <input
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Album name (optional)"
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Genre</label>
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g. Electronic, Jazz"
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF5500]/40"
            />
          </div>
        </div>

        {/* Cover dropzone */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Cover image</label>
          <div
            {...getCoverRootProps()}
            className="relative border-2 border-dashed border-zinc-700 rounded-xl cursor-pointer hover:border-zinc-500 transition-colors overflow-hidden aspect-square"
          >
            <input {...getCoverInputProps()} />
            {coverPreview ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <p className="text-sm text-white font-medium">Change cover</p>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <ImagePlus size={24} className="text-zinc-500" />
                <p className="text-xs text-zinc-500 text-center px-4">Drop cover art or browse<br />JPG, PNG — max 4MB</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading || !audioFile || !title.trim() || !artist.trim()}
        className="flex items-center gap-2 h-10 px-6 rounded-lg bg-gradient-to-r from-[#FF5500] to-[#EC4899] text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            {state === "uploading-audio" && "Uploading audio…"}
            {state === "uploading-cover" && "Uploading cover…"}
            {state === "saving" && "Saving…"}
          </>
        ) : (
          <>
            <Upload size={16} />
            Upload track
          </>
        )}
      </button>
    </form>
  );
}

function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    audio.src = url;
  });
}
