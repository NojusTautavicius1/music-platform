import { Link } from "react-router";
import { Plus, Grid3x3, List, ChevronDown, Play } from "lucide-react";
import { useState } from "react";

const libraryItems = [
  { id: "1", title: "Late Night Drives", type: "Playlist", songs: 42, cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop" },
  { id: "2", title: "Focus Flow", type: "Playlist", songs: 38, cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=200&h=200&fit=crop" },
  { id: "3", title: "Saturday Energy", type: "Playlist", songs: 55, cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop" },
  { id: "4", title: "Indie Discoveries", type: "Playlist", songs: 67, cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" },
  { id: "5", title: "Lo-Fi Study Session", type: "Playlist", songs: 29, cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=200&h=200&fit=crop" },
  { id: "6", title: "Jazz Nights", type: "Album", songs: 12, cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=200&h=200&fit=crop" },
  { id: "7", title: "Electronic Essentials", type: "Playlist", songs: 48, cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=200&h=200&fit=crop" },
  { id: "8", title: "Urban Rhythm", type: "Playlist", songs: 34, cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop" },
  { id: "9", title: "Acoustic Mornings", type: "Album", songs: 10, cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=200&h=200&fit=crop" },
  { id: "10", title: "Night Drive", type: "Playlist", songs: 41, cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop" },
  { id: "11", title: "Workout Power", type: "Playlist", songs: 52, cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&h=200&fit=crop" },
  { id: "12", title: "Chill Vibes", type: "Playlist", songs: 36, cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=200&h=200&fit=crop" },
  { id: "13", title: "Neon Dreams", type: "Album", songs: 14, cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=200&h=200&fit=crop" },
  { id: "14", title: "Echoes", type: "Album", songs: 11, cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&h=200&fit=crop" },
  { id: "15", title: "Solitude", type: "Playlist", songs: 25, cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=200&h=200&fit=crop" },
];

export function Library() {
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredItems = filter === "All"
    ? libraryItems
    : libraryItems.filter(item => item.type === filter);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold">Your Library</h1>
          <button className="w-10 h-10 bg-[#18181F] rounded-full flex items-center justify-center hover:bg-[#25252E] transition-colors">
            <Plus size={20} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#18181F] rounded-lg hover:bg-[#25252E] transition-colors">
            <span className="text-sm">Recents</span>
            <ChevronDown size={16} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("grid")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "grid" ? "bg-[#25252E] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "list" ? "bg-[#25252E] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8">
        {["All", "Playlists", "Albums", "Artists"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f === "All" ? "All" : f.slice(0, -1))}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              filter === (f === "All" ? "All" : f.slice(0, -1))
                ? "bg-white text-black"
                : "bg-[#18181F] text-white hover:bg-[#25252E]"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Grid view */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              to={`/playlist/${item.id}`}
              className="group bg-[#18181F] rounded-xl p-4 hover:bg-[#25252E] transition-all cursor-pointer"
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div className="relative mb-4">
                <img
                  src={item.cover}
                  alt={item.title}
                  className="w-full aspect-square object-cover rounded-lg shadow-lg"
                />
                <button
                  className={`absolute right-2 bottom-2 w-12 h-12 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
                    hoveredId === item.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                  }`}
                >
                  <Play size={20} fill="white" className="ml-0.5" />
                </button>
              </div>
              <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
              <p className="text-sm text-gray-400">{item.type} • {item.songs} songs</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <Link
              key={item.id}
              to={`/playlist/${item.id}`}
              className="group flex items-center gap-4 p-3 rounded-lg hover:bg-[#18181F] transition-colors cursor-pointer"
            >
              <img src={item.cover} alt={item.title} className="w-14 h-14 rounded-lg" />
              <div className="flex-1">
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.type} • {item.songs} songs</p>
              </div>
              <button className="w-10 h-10 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play size={18} fill="white" className="ml-0.5" />
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
