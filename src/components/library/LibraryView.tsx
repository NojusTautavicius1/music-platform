"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  LayoutGrid,
  List,
  ChevronDown,
  Music2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { EmptyState } from "@/components/shared/EmptyState";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPlaylist } from "@/app/actions/playlist";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LibraryPlaylist = {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { songs: number };
};

type SortMode = "recent" | "alpha";
type FilterMode = "all" | "playlists";
type ViewMode = "grid" | "list";

// ─── Form schema ──────────────────────────────────────────────────────────────

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().max(200, "Max 200 characters"),
  isPublic: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Create Playlist Dialog ───────────────────────────────────────────────────

function CreatePlaylistDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", isPublic: false },
  });

  const isPublic = watch("isPublic");

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function onSubmit(values: FormValues) {
    const result = await createPlaylist(values);
    if (result.ok) {
      onOpenChange(false);
      toast.success("Playlist created");
      router.push(`/library/playlist/${result.id}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#18181F] border-white/10 text-zinc-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-100">
            Create playlist
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="pl-name">
              Name <span className="text-[#EC4899]">*</span>
            </label>
            <Input
              id="pl-name"
              placeholder="My awesome playlist"
              className="bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-[#8B5CF6]/50"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-[#EC4899]">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300" htmlFor="pl-desc">
              Description
            </label>
            <Textarea
              id="pl-desc"
              placeholder="Optional description…"
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-[#EC4899]">{errors.description.message}</p>
            )}
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-300">Make public</p>
              <p className="text-xs text-zinc-500">Anyone can see this playlist</p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-linear-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onClick,
  disabled,
  disabledTitle,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  disabledTitle?: string;
}) {
  const chip = (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-3 py-1 rounded-full text-sm font-medium transition-colors",
        active
          ? "bg-white text-[#0A0A0F]"
          : "bg-white/10 text-zinc-300 hover:bg-white/15",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );

  if (disabled && disabledTitle) {
    return <div title={disabledTitle}>{chip}</div>;
  }
  return chip;
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { playlists: LibraryPlaylist[] };

export function LibraryView({ playlists }: Props) {
  const [sort, setSort] = useState<SortMode>("recent");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [dialogOpen, setDialogOpen] = useState(false);

  const sortLabel = sort === "recent" ? "Recently added" : "Alphabetical";

  const sorted = useMemo(() => {
    const arr = [...playlists];
    if (sort === "alpha") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return arr;
  }, [playlists, sort]);

  // filter is effectively always 'playlists' since albums/artists are disabled
  const displayed = filter === "all" || filter === "playlists" ? sorted : [];

  return (
    <div className="pb-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="px-8 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-zinc-100">Your Library</h1>
          <button
            onClick={() => setDialogOpen(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Create playlist"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-sm text-zinc-300 hover:text-zinc-100 transition-colors">
                  {sortLabel}
                  <ChevronDown size={14} />
                </button>
              }
            />
            <DropdownMenuContent
              side="bottom"
              align="end"
              className="w-44 bg-[#18181F] border-white/10 text-zinc-100"
            >
              <DropdownMenuItem
                className="cursor-pointer focus:bg-white/10 focus:text-white"
                onClick={() => setSort("recent")}
              >
                Recently added
                {sort === "recent" && (
                  <span className="ml-auto text-[#8B5CF6]">✓</span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer focus:bg-white/10 focus:text-white"
                onClick={() => setSort("alpha")}
              >
                Alphabetical
                {sort === "alpha" && (
                  <span className="ml-auto text-[#8B5CF6]">✓</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div className="flex items-center rounded-full bg-white/5 p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                view === "grid"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "p-1.5 rounded-full transition-colors",
                view === "list"
                  ? "bg-white/15 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Filter chips ────────────────────────────────────────────── */}
      <div className="px-8 pt-4 flex items-center gap-2">
        <FilterChip
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        <FilterChip
          label="Playlists"
          active={filter === "playlists"}
          onClick={() => setFilter("playlists")}
        />
        <FilterChip
          label="Albums"
          disabled
          disabledTitle="Coming soon"
        />
        <FilterChip
          label="Artists"
          disabled
          disabledTitle="Coming soon"
        />
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {displayed.length === 0 ? (
        <EmptyState
          icon={<Music2 size={56} />}
          title="Your library is quiet"
          description="Create your first playlist to start curating"
          action={
            <button
              onClick={() => setDialogOpen(true)}
              className="px-5 py-2.5 rounded-full bg-linear-to-r from-[#8B5CF6] to-[#EC4899] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Create Playlist
            </button>
          }
        />
      ) : view === "grid" ? (
        <div className="px-8 pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayed.map((p) => (
            <PlaylistCard
              key={p.id}
              id={p.id}
              title={p.name}
              subtitle={
                p._count.songs === 0
                  ? "Empty playlist"
                  : `${p._count.songs} song${p._count.songs === 1 ? "" : "s"}`
              }
              coverUrl={p.coverUrl}
              size="md"
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="px-8 pt-6 space-y-1">
          {displayed.map((p) => (
            <a
              key={p.id}
              href={`/library/playlist/${p.id}`}
              className="flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="relative w-12 h-12 rounded shrink-0 overflow-hidden">
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverUrl}
                    alt={p.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate group-hover:text-white">
                  {p.name}
                </p>
                <p className="text-xs text-zinc-500">
                  Playlist ·{" "}
                  {p._count.songs === 0
                    ? "Empty"
                    : `${p._count.songs} song${p._count.songs === 1 ? "" : "s"}`}
                </p>
              </div>
              {p.isPublic && (
                <span className="ml-auto text-xs text-zinc-600 shrink-0">
                  Public
                </span>
              )}
            </a>
          ))}
        </div>
      )}

      {/* ── Dialog ──────────────────────────────────────────────────── */}
      <CreatePlaylistDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
