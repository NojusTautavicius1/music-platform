"use client";

import { useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useDndSensors } from "@/hooks/useDndSensors";
import { reorderPlaylists } from "@/app/actions/playlist";
import { cn } from "@/lib/utils";

type Playlist = {
  id: string;
  name: string;
  coverUrl: string | null;
};

function PlaylistItem({
  playlist,
  overlay = false,
}: {
  playlist: Playlist;
  overlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: overlay ? "__overlay__" : playlist.id, disabled: overlay });

  const style: React.CSSProperties = overlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      className={cn(
        "flex items-center gap-2 px-1 py-1 rounded-lg hover:bg-white/5 transition-colors group",
        isDragging && "opacity-30",
        overlay && "opacity-90 bg-[#18181F] shadow-xl ring-1 ring-white/10 rounded-lg"
      )}
    >
      {/* Drag handle */}
      <button
        {...(overlay ? {} : listeners)}
        className="text-zinc-700 hover:text-zinc-400 transition-colors shrink-0 touch-none cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <GripVertical size={14} />
      </button>

      <Link
        href={`/library/playlist/${playlist.id}`}
        className="flex items-center gap-2 flex-1 min-w-0"
        tabIndex={overlay ? -1 : undefined}
      >
        {playlist.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playlist.coverUrl}
            alt={playlist.name}
            className="w-7 h-7 rounded object-cover shrink-0"
          />
        ) : (
          <div className="w-7 h-7 rounded bg-white/10 shrink-0" />
        )}
        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
          {playlist.name}
        </p>
      </Link>
    </div>
  );
}

export function SidebarPlaylistList({ playlists: initial }: { playlists: Playlist[] }) {
  const [playlists, setPlaylists] = useState(initial);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useDndSensors();

  function handleDragStart(e: DragStartEvent) {
    setActiveDragId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = playlists.findIndex((p) => p.id === active.id);
    const to = playlists.findIndex((p) => p.id === over.id);
    if (from < 0 || to < 0) return;
    const next = [...playlists];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPlaylists(next);
    reorderPlaylists(next.map((p) => p.id)).then((res) => {
      if (!res.ok) setPlaylists(playlists); // rollback
    });
  }

  if (playlists.length === 0) {
    return <p className="px-3 py-2 text-xs text-zinc-600">No playlists yet</p>;
  }

  const activePlaylist = activeDragId ? playlists.find((p) => p.id === activeDragId) : null;

  return (
    <DndContext
      id="sidebar-playlist-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={playlists.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-0.5">
          {playlists.map((playlist) => (
            <PlaylistItem key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activePlaylist ? <PlaylistItem playlist={activePlaylist} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
