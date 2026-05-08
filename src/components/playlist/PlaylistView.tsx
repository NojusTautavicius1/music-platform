"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useOptimistic, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import {
  Play,
  Heart,
  MoreHorizontal,
  Clock,
  Search,
  Pause,
  ListPlus,
  PlusCircle,
  Pencil,
  Trash2,
  ListMusic,
  Link2,
  User,
  Loader2,
  ImageUp,
  Plus,
  ChevronDown,
  ChevronUp,
  Music,
  GripVertical,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { formatDuration, formatPlayCount } from "@/lib/format";
import { useUploadThing } from "@/lib/uploadthing";
import { useDndSensors } from "@/hooks/useDndSensors";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";
import { PlaylistSuggestionsSection } from "@/components/playlist/PlaylistSuggestionsSection";
import { LyricsDialog } from "@/components/lyrics/LyricsDialog";
import { toggleLike } from "@/app/actions/like";
import type { RecommendationSong } from "@/app/actions/recommendations";
import {
  addSongToPlaylist,
  createPlaylistWithSong,
  deletePlaylist,
  removeSongFromPlaylist,
  updatePlaylist,
  searchSongsNotInPlaylist,
  reorderPlaylistSongs,
} from "@/app/actions/playlist";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SongInPlaylist = {
  songId: string;
  position: number;
  addedAt: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
  waveformPeaks?: number[] | null;
  isLiked?: boolean;
  playCount?: number;
  license?: string | null;
  licenseAttribution?: string | null;
};

export type UserPlaylist = {
  id: string;
  name: string;
};

export type SuggestedSong = RecommendationSong;

const editFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().max(200, "Max 200 characters"),
  isPublic: z.boolean(),
  coverUrl: z.string().url().nullable().optional(),
});

type EditFormValues = z.infer<typeof editFormSchema>;

type Props = {
  playlistId: string;
  playlistName: string;
  playlistDescription: string | null;
  playlistCoverUrl: string | null;
  isPublic: boolean;
  isOwner: boolean;
  songs: SongInPlaylist[];
  userPlaylists?: UserPlaylist[];
  suggestedSongs?: SuggestedSong[];
  moreLikeSongs?: SuggestedSong[];
};

// ─── Song Row (desktop table row) ────────────────────────────────────────────

type SongRowProps = {
  song: SongInPlaylist;
  idx: number;
  isActive: boolean;
  isLiked: boolean;
  isOwner: boolean;
  userPlaylists: UserPlaylist[];
  onPlay: () => void;
  onLike: (e?: React.MouseEvent) => void;
  onRemove: () => void;
  onAddToQueue: () => void;
  onGoToArtist: () => void;
  onShare: () => void;
  onViewLyrics: () => void;
  playCount?: number;
  canReorder?: boolean;
  /** overlay=true renders the DragOverlay ghost — no sortable hooks, no interactions */
  overlay?: boolean;
};

function SongRow({
  song,
  idx,
  isActive,
  isLiked,
  isOwner,
  userPlaylists,
  onPlay,
  onLike,
  onRemove,
  onAddToQueue,
  onGoToArtist,
  onShare,
  onViewLyrics,
  playCount,
  canReorder = false,
  overlay = false,
}: SongRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  // useSortable must be called unconditionally; when overlay=true we pass a
  // stable but unused id so the hook doesn't break rules-of-hooks
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: overlay ? "__overlay__" : song.songId,
    disabled: overlay || !isOwner || !canReorder,
  });

  const style: React.CSSProperties = overlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  async function handleAddToPlaylist(playlist: UserPlaylist) {
    const result = await addSongToPlaylist(playlist.id, song.songId);
    if (result.ok) {
      toast.success(`Added to ${result.playlistName}`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleAddToNew() {
    const result = await createPlaylistWithSong(song.songId);
    if (result.ok) {
      toast.success(`Added to ${result.name}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div ref={overlay ? undefined : setNodeRef} style={style} {...(overlay ? {} : attributes)}>
      {/* drop indicator line above this row while dragging over it */}
      {isDragging && (
        <div className="h-0.5 mx-2 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta opacity-80" />
      )}

      {/* ── Mobile card (< md) ───────────────────────────────────── */}
      <div
        onClick={overlay ? undefined : onPlay}
        className={cn(
          "max-md:flex hidden items-center gap-3 h-16 px-1 rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
          isDragging && "opacity-40 scale-[0.99]",
          overlay && "opacity-90 bg-[#18181F] shadow-xl rounded-lg ring-1 ring-white/10"
        )}
      >
        {/* Drag handle — mobile */}
        {isOwner && (
          <button
            {...(overlay ? {} : listeners)}
            className="text-zinc-600 hover:text-zinc-400 shrink-0 touch-none cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={16} />
          </button>
        )}

        {/* Cover */}
        <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden">
          {song.coverUrl ? (
            <Image
              src={song.coverUrl}
              alt={song.title}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
          )}
        </div>

        {/* Title + artist */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            isActive ? "text-brand-orange" : "text-zinc-100"
          )}>
            {song.title}
          </p>
          <p className="text-xs text-zinc-400 truncate italic">{song.artist}</p>
          {(song.license || song.licenseAttribution) && (
            <p className="text-xs text-zinc-600 truncate">
              {[
                song.license ? `License: ${song.license}` : null,
                song.licenseAttribution,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 truncate">
            <Play size={10} className="shrink-0 text-zinc-600" fill="currentColor" />
            <span>{formatPlayCount(playCount ?? song.playCount ?? 0)} plays</span>
          </p>
        </div>

        {/* Duration */}
        <span className="text-sm text-zinc-400 tabular-nums shrink-0">
          {formatDuration(song.duration)}
        </span>
      </div>

      {/* ── Desktop table row (md+) ──────────────────────────────── */}
      <div
        onClick={overlay ? undefined : onPlay}
        className={cn(
          "hidden md:grid grid-cols-[1.5rem_2.5rem_1fr_180px_120px_140px_8rem] items-center h-14 px-2 rounded-lg cursor-pointer group song-row-hover",
          "transition-colors",
          isActive && "bg-white/5 border-l-2 border-brand-orange",
          isDragging && "opacity-40 scale-[0.99]",
          overlay && "opacity-90 bg-[#18181F] shadow-xl ring-1 ring-white/10 rounded-lg"
        )}
      >
        {/* Drag handle — desktop */}
        {isOwner ? (
          <button
            {...(overlay ? {} : listeners)}
            className="flex items-center justify-center text-zinc-700 hover:text-zinc-400 transition-colors shrink-0 touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
            aria-label="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={14} />
          </button>
        ) : (
          <span />
        )}

        {/* # / play icon */}
        <div className="flex items-center justify-center">
          {isActive ? (
            <Pause size={14} fill="#FF5500" className="text-brand-orange" />
          ) : (
            <>
              <span className="text-sm text-zinc-400 group-hover:hidden">
                {idx + 1}
              </span>
              <Play
                size={14}
                fill="white"
                className="text-white hidden group-hover:block"
              />
            </>
          )}
        </div>

        {/* Cover + Title + Artist */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden">
            {song.coverUrl ? (
              <Image
                src={song.coverUrl}
                alt={song.title}
                fill
                sizes="40px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
            )}
          </div>
          <div className="min-w-0">
            <p className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-brand-orange" : "text-zinc-100"
            )}>
              {song.title}
            </p>
            <p className="text-xs text-zinc-400 truncate italic">{song.artist}</p>
            {(song.license || song.licenseAttribution) && (
              <p className="text-xs text-zinc-600 truncate">
                {[
                  song.license ? `License: ${song.license}` : null,
                  song.licenseAttribution,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
        </div>

        {/* Album */}
        <div className="min-w-0 pr-4">
          <p className="text-sm text-zinc-400 line-clamp-1">
            {song.album ?? "—"}
          </p>
        </div>

        <div className="min-w-0 pr-4">
          <p className="flex items-center gap-1 text-sm text-zinc-400 truncate">
            <Play size={12} className="shrink-0 text-zinc-600" fill="currentColor" />
            <span>{formatPlayCount(playCount ?? song.playCount ?? 0)}</span>
          </p>
        </div>

        {/* Date added */}
        <div>
          <p className="text-sm text-zinc-400">
            {formatDistanceToNow(new Date(song.addedAt), { addSuffix: true })}
          </p>
        </div>

        {/* Heart + Duration + Three-dot */}
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={onLike}
            className={cn(
              "transition-opacity shrink-0",
              isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            aria-label={isLiked ? "Unlike song" : "Like song"}
          >
            <Heart
              size={14}
              className={cn(
                isLiked
                  ? "fill-brand-orange text-brand-orange"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            />
          </button>

          <span className="text-sm text-zinc-400 tabular-nums w-9 text-right shrink-0">
            {formatDuration(song.duration)}
          </span>

          <DropdownMenu onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger
              render={
                <button
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    "w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all shrink-0",
                    menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                  aria-label="More options"
                >
                  <MoreHorizontal size={14} />
                </button>
              }
            />
            <DropdownMenuContent
              side="bottom"
              align="end"
              className="w-52 bg-[#18181F] border-white/10 text-zinc-100"
              onClick={(e) => e.stopPropagation()}
            >
              {isOwner && (
                <>
                  <DropdownMenuItem
                    variant="destructive"
                    className="cursor-pointer gap-2"
                    onClick={onRemove}
                  >
                    <Trash2 size={14} />
                    Remove from this playlist
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/10" />
                </>
              )}

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white data-popup-open:bg-white/10">
                  <ListPlus size={14} />
                  Add to playlist
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52 bg-[#18181F] border-white/10 text-zinc-100 max-h-60 overflow-y-auto">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                    onClick={handleAddToNew}
                  >
                    <PlusCircle size={14} />
                    Create new playlist
                  </DropdownMenuItem>

                  {userPlaylists.length > 0 && (
                    <DropdownMenuSeparator className="bg-white/10" />
                  )}

                  {userPlaylists.map((pl) => (
                    <DropdownMenuItem
                      key={pl.id}
                      className="cursor-pointer focus:bg-white/10 focus:text-white truncate"
                      onClick={() => handleAddToPlaylist(pl)}
                    >
                      {pl.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={onAddToQueue}
              >
                <ListMusic size={14} />
                Add to queue
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={() => onLike()}
              >
                <Heart
                  size={14}
                  className={cn(
                    isLiked ? "fill-brand-orange text-brand-orange" : "text-zinc-400"
                  )}
                />
                {isLiked ? "Unlike" : "Like"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={onGoToArtist}
              >
                <User size={14} />
                Go to artist
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={onShare}
              >
                <Link2 size={14} />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                onClick={onViewLyrics}
              >
                <FileText size={14} />
                View lyrics
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Playlist Dialog ───────────────────────────────────────────────────

type EditPlaylistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: {
    id: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
    isPublic: boolean;
  };
};

function EditPlaylistDialog({ open, onOpenChange, playlist }: EditPlaylistDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: playlist.name,
      description: playlist.description ?? "",
      isPublic: playlist.isPublic,
      coverUrl: playlist.coverUrl ?? null,
    },
  });

  const descriptionValue = watch("description") ?? "";
  const coverUrl = watch("coverUrl") ?? playlist.coverUrl ?? null;

  const { startUpload, isUploading } = useUploadThing("playlistCover", {
    onClientUploadComplete: (res: Array<{ url: string }> | undefined) => {
      const url = res?.[0]?.url;
      if (url) {
        setValue("coverUrl", url, { shouldDirty: true });
        setLocalPreview(null);
        toast.success("Cover uploaded");
      }
    },
    onUploadError: (err: Error) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      name: playlist.name,
      description: playlist.description ?? "",
      isPublic: playlist.isPublic,
      coverUrl: playlist.coverUrl ?? null,
    });
    setLocalPreview(null);
  }, [open, playlist, reset]);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    startUpload([file]);
  }

  function handleFileInput(files: FileList | null) {
    const file = files?.[0];
    if (file) handleFile(file);
  }

  async function onSubmit(values: EditFormValues) {
    const result = await updatePlaylist({
      id: playlist.id,
      name: values.name,
      description: values.description,
      isPublic: values.isPublic,
      coverUrl: values.coverUrl ?? null,
    });

    if (result.ok) {
      toast.success("Playlist updated");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
  }

  const previewUrl = localPreview ?? coverUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#18181F] border-white/10 text-zinc-100 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-100">
            Edit playlist details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0">
              <div
                className={cn(
                  "relative w-[180px] h-[180px] rounded-md overflow-hidden shadow-xl",
                  "border border-white/10 bg-white/5 group cursor-pointer",
                  isDragging && "border-brand-orange"
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileInput(e.dataTransfer.files);
                }}
                role="button"
                aria-label="Choose cover photo"
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={playlist.name}
                    fill
                    sizes="180px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium text-white gap-2">
                  <ImageUp size={16} />
                  Choose photo
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-sm text-zinc-200 gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Uploading…
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileInput(e.target.files)}
              />
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-300" htmlFor="edit-name">
                  Name <span className="text-brand-orange">*</span>
                </label>
                <Input
                  id="edit-name"
                  placeholder="Playlist name"
                  className="bg-white/5 border-white/15 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/40"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-brand-orange">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-300" htmlFor="edit-desc">
                    Description
                  </label>
                  <span className="text-xs text-zinc-500">
                    {descriptionValue.length}/200
                  </span>
                </div>
                <Textarea
                  id="edit-desc"
                  rows={4}
                  maxLength={200}
                  placeholder="Add a description"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-brand-orange">{errors.description.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-300">Make public</p>
                  <p className="text-xs text-zinc-500">Anyone can see this playlist</p>
                </div>
                <Switch
                  checked={watch("isPublic")}
                  onCheckedChange={(checked) => setValue("isPublic", checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              {(isSubmitting || isUploading) && (
                <Loader2 size={14} className="animate-spin" />
              )}
              Save changes
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Playlist Dialog ────────────────────────────────────────────────

type DeletePlaylistDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistName: string;
  onConfirm: () => void;
  isDeleting: boolean;
};

function DeletePlaylistDialog({
  open,
  onOpenChange,
  playlistName,
  onConfirm,
  isDeleting,
}: DeletePlaylistDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#18181F] border-white/10 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-100">
            Delete &quot;{playlistName}&quot;?
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-zinc-400">
          This can&apos;t be undone.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 text-red-300 text-sm font-semibold hover:bg-red-500/25 transition-colors disabled:opacity-60"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Suggestion Row ──────────────────────────────────────────────────────────

function SuggestionRow({
  song,
  onAdd,
  isPending,
}: {
  song: SuggestedSong;
  onAdd: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
      <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-brand-orange/30 to-brand-magenta/30 flex items-center justify-center">
            <Music size={14} className="text-zinc-600" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
        <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-zinc-600 tabular-nums shrink-0">
        {formatDuration(song.duration)}
      </span>
      <button
        onClick={onAdd}
        disabled={isPending}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#FF5500]/40 text-xs text-[#FF5500] hover:bg-orange-500/10 hover:border-[#FF5500] transition-colors shrink-0 disabled:opacity-40"
        aria-label={`Add ${song.title}`}
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        Add
      </button>
    </div>
  );
}

// ─── Find More Section ────────────────────────────────────────────────────────

function FindMoreSection({
  playlistId,
  alreadyInSet,
  onAdd,
}: {
  playlistId: string;
  alreadyInSet: Set<string>;
  onAdd: (song: SuggestedSong) => Promise<boolean>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SuggestedSong[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(
    async (q: string, p: number, append: boolean) => {
      setLoading(true);
      const res = await searchSongsNotInPlaylist(playlistId, q, p);
      setLoading(false);
      if (!res.ok) return;
      setResults((prev) => (append ? [...prev, ...res.songs] : res.songs));
      setHasMore(res.hasMore);
    },
    [playlistId]
  );

  useEffect(() => {
    if (!expanded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchResults(query, 1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  function handleQueryChange(val: string) {
    setQuery(val);
    setPage(1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchResults(val, 1, false), 350);
  }

  async function handleAdd(song: SuggestedSong) {
    setPendingIds((p) => new Set([...p, song.id]));
    await onAdd(song);
    setPendingIds((p) => { const n = new Set(p); n.delete(song.id); return n; });
  }

  function handleLoadMore() {
    const next = page + 1;
    setPage(next);
    fetchResults(query, next, true);
  }

  const visible = results.filter((s) => !alreadyInSet.has(s.id));

  return (
    <div className="px-4 md:px-8 pb-10">
      <div className="border-t border-white/5 pt-6">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? "Hide search" : "+ Find more songs"}
        </button>

        {expanded && (
          <div className="mt-4 space-y-3">
            {/* Mini search */}
            <div className="relative max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search all songs…"
                className="w-full h-9 pl-8 pr-3 rounded-full border border-white/15 bg-white/5 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                autoFocus
              />
            </div>

            {/* Results */}
            {loading && results.length === 0 ? (
              <div className="flex items-center gap-2 py-4 text-zinc-600 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Searching…
              </div>
            ) : visible.length === 0 ? (
              <p className="text-sm text-zinc-600 py-4">
                {query ? "No songs found." : "All songs are already in this playlist."}
              </p>
            ) : (
              <div className="space-y-0.5">
                {visible.map((song) => (
                  <SuggestionRow
                    key={song.id}
                    song={song}
                    isPending={pendingIds.has(song.id)}
                    onAdd={() => handleAdd(song)}
                  />
                ))}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-40"
                  >
                    {loading && <Loader2 size={12} className="animate-spin" />}
                    Load more
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PlaylistView ─────────────────────────────────────────────────────────────

export function PlaylistView({
  playlistId,
  playlistName,
  playlistDescription,
  playlistCoverUrl,
  isPublic,
  isOwner,
  songs,
  userPlaylists = [],
  suggestedSongs = [],
}: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaylistLiked, setIsPlaylistLiked] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lyricsDialogSong, setLyricsDialogSong] = useState<{ id: string; title: string; artist: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sortMode, setSortMode] = useState<"custom" | "mostPlayed">("custom");
  const [displaySongs, setDisplaySongs] = useState(songs);
  const pendingRemovals = useRef(
    new Map<string, { song: SongInPlaylist; index: number; timeoutId: number }>()
  );

  const otherPlaylists = useMemo(
    () => userPlaylists.filter((pl) => pl.id !== playlistId),
    [userPlaylists, playlistId]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplaySongs(songs);
    pendingRemovals.current.forEach((entry) =>
      window.clearTimeout(entry.timeoutId)
    );
    pendingRemovals.current.clear();
  }, [songs]);

  const [optimisticallyAdded, setOptimisticallyAdded] = useState<Set<string>>(new Set());

  const alreadyInPlaylist = useMemo(
    () => new Set([...displaySongs.map((s) => s.songId), ...optimisticallyAdded]),
    [displaySongs, optimisticallyAdded]
  );

  async function handleAddFromSuggestion(song: SuggestedSong): Promise<boolean> {
    setOptimisticallyAdded((prev) => new Set([...prev, song.id]));
    const newSong: SongInPlaylist = {
      songId: song.id,
      position: displaySongs.length,
      addedAt: new Date().toISOString(),
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: song.coverUrl,
      audioUrl: song.audioUrl,
      waveformPeaks: song.waveformPeaks,
      isLiked: false,
    };
    setDisplaySongs((prev) => [...prev, newSong]);
    const result = await addSongToPlaylist(playlistId, song.id);
    if (result.ok) {
      toast.success(`Added "${song.title}"`);
      return true;
    } else {
      setOptimisticallyAdded((prev) => { const n = new Set(prev); n.delete(song.id); return n; });
      setDisplaySongs((prev) => prev.filter((s) => s.songId !== song.id));
      toast.error(result.error);
      return false;
    }
  }

  const [confirmedLiked, setConfirmedLiked] = useState<Set<string>>(
    () => new Set(songs.filter((s) => s.isLiked).map((s) => s.songId))
  );

  const [optimisticLiked, applyOptimistic] = useOptimistic(
    confirmedLiked,
    (state: Set<string>, songId: string) => {
      const next = new Set(state);
      if (next.has(songId)) { next.delete(songId); } else { next.add(songId); }
      return next;
    }
  );

  function handleLike(songId: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    startTransition(async () => {
      applyOptimistic(songId);
      const result = await toggleLike(songId);
      if (result.ok) {
        setConfirmedLiked((prev) => {
          const next = new Set(prev);
          if (result.isLiked) { next.add(songId); } else { next.delete(songId); }
          return next;
        });
      } else {
        toast.error("Could not update like");
      }
    });
  }

  const dndSensors = useDndSensors();
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    if (sortMode !== "custom") {
      setActiveDragId(null);
      return;
    }
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = displaySongs.findIndex((s) => s.songId === active.id);
    const to = displaySongs.findIndex((s) => s.songId === over.id);
    if (from < 0 || to < 0) return;
    // Optimistic reorder
    const next = [...displaySongs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDisplaySongs(next);
    // Persist in background
    reorderPlaylistSongs(playlistId, from, to).then((res) => {
      if (!res.ok) {
        setDisplaySongs(displaySongs); // rollback
        toast.error("Could not save order");
      }
    });
  }

  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const sortedSongs = useMemo(() => {
    if (sortMode !== "mostPlayed") return displaySongs;
    return [...displaySongs].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));
  }, [displaySongs, sortMode]);

  const queue: PlayerSong[] = sortedSongs.map((s) => ({
    id: s.songId,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration,
    coverUrl: s.coverUrl,
    audioUrl: s.audioUrl,
    waveformPeaks: s.waveformPeaks,
    playCount: s.playCount,
  }));

  const filtered = sortedSongs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.album ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  function insertAtIndex(list: SongInPlaylist[], index: number, item: SongInPlaylist) {
    const next = [...list];
    const clamped = Math.max(0, Math.min(index, next.length));
    next.splice(clamped, 0, item);
    return next;
  }

  function undoRemove(songId: string) {
    const pending = pendingRemovals.current.get(songId);
    if (!pending) return;
    window.clearTimeout(pending.timeoutId);
    pendingRemovals.current.delete(songId);
    setDisplaySongs((prev) => insertAtIndex(prev, pending.index, pending.song));
    toast.success("Removal undone");
  }

  function handleRemoveSong(song: SongInPlaylist) {
    if (!isOwner) return;
    if (pendingRemovals.current.has(song.songId)) return;

    const index = displaySongs.findIndex((s) => s.songId === song.songId);
    if (index < 0) return;

    setDisplaySongs((prev) => prev.filter((s) => s.songId !== song.songId));

    const timeoutId = window.setTimeout(async () => {
      pendingRemovals.current.delete(song.songId);
      const result = await removeSongFromPlaylist(playlistId, song.songId);
      if (!result.ok) {
        setDisplaySongs((prev) => insertAtIndex(prev, index, song));
        toast.error(result.error);
      }
    }, 5000);

    pendingRemovals.current.set(song.songId, { song, index, timeoutId });

    toast("Removed from playlist", {
      action: {
        label: "Undo",
        onClick: () => undoRemove(song.songId),
      },
    });
  }

  function handleAddToQueue(song: SongInPlaylist) {
    const playerSong: PlayerSong = {
      id: song.songId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: song.coverUrl,
      audioUrl: song.audioUrl,
      waveformPeaks: song.waveformPeaks,
      playCount: song.playCount,
    };
    const { queue: currentQueue, setQueue } = usePlayerStore.getState();
    setQueue([...currentQueue, playerSong]);
    toast.success("Added to queue");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleGoToArtist(_song: SongInPlaylist) {
    toast(`Artist pages are coming soon`);
  }

  async function handleShare() {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function handleDeletePlaylist() {
    if (isDeleting) return;
    setIsDeleting(true);
    const result = await deletePlaylist(playlistId);
    setIsDeleting(false);
    if (result.ok) {
      toast.success("Playlist deleted");
      setDeleteOpen(false);
      router.push("/library");
    } else {
      toast.error(result.error);
    }
  }

  function handlePlaySong(song: SongInPlaylist) {
    const playerSong: PlayerSong = {
      id: song.songId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: song.coverUrl,
      audioUrl: song.audioUrl,
      waveformPeaks: song.waveformPeaks,
      playCount: song.playCount,
    };
    if (currentSong?.id === song.songId) {
      togglePlay();
    } else {
      play(playerSong, queue);
    }
  }

  const isCurrentlyPlaying = (songId: string) =>
    currentSong?.id === songId && isPlaying;

  return (
    <>
      {/* ── Action bar ─────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 py-6 flex items-center gap-4">
        <button
          onClick={() => {
            if (songs.length === 0) return;
            if (currentSong && queue.some((q) => q.id === currentSong.id)) {
              togglePlay();
            } else {
              handlePlaySong(songs[0]);
            }
          }}
          className="h-14 w-14 rounded-full bg-linear-to-br from-brand-orange to-brand-magenta flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0 hover:shadow-[0_0_24px_rgba(255,85,0,0.5)]"
          aria-label="Play playlist"
        >
          {currentSong &&
          queue.some((q) => q.id === currentSong.id) &&
          isPlaying ? (
            <Pause size={22} fill="white" className="text-white" />
          ) : (
            <Play size={22} fill="white" className="text-white ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setIsPlaylistLiked((v) => !v)}
          aria-label="Like playlist"
          className="w-8 h-8 flex items-center justify-center"
        >
          <Heart
            size={22}
            className={cn(
              "transition-colors",
              isPlaylistLiked
                ? "fill-brand-orange text-brand-orange"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          />
        </button>

        {isOwner && (
          <>
            <button
              onClick={() => setEditOpen(true)}
              className="h-9 px-3 rounded-full border border-[#FF5500]/40 text-[#FF5500] hover:bg-orange-500/10 hover:border-[#FF5500] transition-colors flex items-center gap-2"
              aria-label="Edit playlist"
            >
              <Pencil size={16} />
              <span className="text-sm">Edit</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Playlist options"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                }
              />
              <DropdownMenuContent
                side="bottom"
                align="end"
                className="w-44 bg-[#18181F] border-white/10 text-zinc-100"
              >
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer gap-2"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 size={14} />
                  Delete playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <div className="flex-1" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm text-zinc-300 hover:text-zinc-100 transition-colors">
                {sortMode === "custom" ? "Custom order" : "Most played"}
                <ChevronDown size={14} />
              </button>
            }
          />
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="w-48 bg-[#18181F] border-white/10 text-zinc-100"
          >
            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/10 focus:text-white"
              onClick={() => setSortMode("custom")}
            >
              Custom order
              {sortMode === "custom" && <span className="ml-auto text-brand-orange">✓</span>}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/10 focus:text-white"
              onClick={() => setSortMode("mostPlayed")}
            >
              Most played
              {sortMode === "mostPlayed" && <span className="ml-auto text-brand-orange">✓</span>}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search in playlist — hidden on mobile to save space */}
        <div className="relative hidden sm:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in playlist"
            className="pl-8 h-8 max-w-50 bg-white/5 border-white/15 text-zinc-100 placeholder:text-zinc-500 text-sm rounded-full focus-visible:ring-orange-500/40"
          />
        </div>
      </div>

      {/* ── Song list ──────────────────────────────────────────────── */}
      <div className="px-4 md:px-8 pb-8">
        {displaySongs.length === 0 ? (
          isOwner ? (
            <PlaylistSuggestionsSection
              playlistId={playlistId}
              mode="empty"
              initialSongs={suggestedSongs}
              alreadyInPlaylist={alreadyInPlaylist}
              onAddSong={handleAddFromSuggestion}
            />
          ) : (
            <p className="text-zinc-500 text-sm px-4 py-8 text-center">
              This playlist is empty.
            </p>
          )
        ) : (
          <>
            {/* Desktop table header — hidden on mobile */}
            <div className="hidden md:grid grid-cols-[1.5rem_2.5rem_1fr_180px_120px_140px_8rem] items-center px-2 py-2 border-b border-white/10 mb-1 sticky top-0 z-10 bg-[#0A0A0F]">
              <span />
              <span className="text-xs text-zinc-500 text-center">#</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Title</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Album</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Plays</span>
              <span className="text-xs text-zinc-500 uppercase tracking-widest">Date Added</span>
              <span className="flex justify-end text-zinc-500"><Clock size={14} /></span>
            </div>

            {filtered.length === 0 && (
              <p className="text-zinc-500 text-sm px-4 py-8 text-center">
                No songs match your search.
              </p>
            )}

            <DndContext
              sensors={dndSensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filtered.map((s) => s.songId)}
                strategy={verticalListSortingStrategy}
              >
                {filtered.map((song, idx) => (
                  <SongRow
                    key={song.songId}
                    song={song}
                    idx={idx}
                    isActive={isCurrentlyPlaying(song.songId)}
                    isLiked={optimisticLiked.has(song.songId)}
                    isOwner={isOwner}
                    userPlaylists={otherPlaylists}
                    onPlay={() => handlePlaySong(song)}
                    onLike={(e) => handleLike(song.songId, e)}
                    onRemove={() => handleRemoveSong(song)}
                    onAddToQueue={() => handleAddToQueue(song)}
                    onGoToArtist={() => handleGoToArtist(song)}
                    onShare={handleShare}
                    onViewLyrics={() => setLyricsDialogSong({ id: song.songId, title: song.title, artist: song.artist })}
                    playCount={song.playCount}
                    canReorder={sortMode === "custom"}
                  />
                ))}
              </SortableContext>

              <DragOverlay dropAnimation={null}>
                {activeDragId ? (() => {
                  const song = displaySongs.find((s) => s.songId === activeDragId);
                  const idx = displaySongs.findIndex((s) => s.songId === activeDragId);
                  if (!song) return null;
                  return (
                    <SongRow
                      song={song}
                      idx={idx}
                      isActive={false}
                      isLiked={false}
                      isOwner={isOwner}
                      userPlaylists={[]}
                      onPlay={() => {}}
                      onLike={() => {}}
                      onRemove={() => {}}
                      onAddToQueue={() => {}}
                      onGoToArtist={() => {}}
                      onShare={() => {}}
                      onViewLyrics={() => {}}
                      playCount={song.playCount}
                      canReorder={sortMode === "custom"}
                      overlay
                    />
                  );
                })() : null}
              </DragOverlay>
            </DndContext>

          </>
        )}
      </div>

      {/* ── Find More (owners only) ──────────────────────────────────── */}
      {isOwner && displaySongs.length > 0 && (
        <FindMoreSection
          playlistId={playlistId}
          alreadyInSet={alreadyInPlaylist}
          onAdd={handleAddFromSuggestion}
        />
      )}

        <EditPlaylistDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          playlist={{
            id: playlistId,
            name: playlistName,
            description: playlistDescription,
            coverUrl: playlistCoverUrl,
            isPublic,
          }}
        />

        <DeletePlaylistDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          playlistName={playlistName}
          onConfirm={handleDeletePlaylist}
          isDeleting={isDeleting}
        />

        <LyricsDialog
          open={lyricsDialogSong !== null}
          onClose={() => setLyricsDialogSong(null)}
          songId={lyricsDialogSong?.id ?? null}
          songTitle={lyricsDialogSong?.title}
          songArtist={lyricsDialogSong?.artist}
        />

      {isPending && null}
    </>
  );
}
