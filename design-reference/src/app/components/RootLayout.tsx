import { Outlet, Link, useNavigate, useLocation } from "react-router";
import { Home, Search, Library, Plus, ChevronLeft, ChevronRight, Bell, Heart, Shuffle, SkipBack, SkipForward, Repeat, ListMusic, Bluetooth, Volume2, Maximize2, Play, Pause } from "lucide-react";
import { useState } from "react";

const playlists = [
  { id: "1", name: "Late Night Drives", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=80&h=80&fit=crop" },
  { id: "2", name: "Focus Flow", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=80&h=80&fit=crop" },
  { id: "3", name: "Saturday Energy", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&h=80&fit=crop" },
  { id: "4", name: "Indie Discoveries", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop" },
  { id: "5", name: "Lo-Fi Study Session", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=80&h=80&fit=crop" },
];

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [progress, setProgress] = useState(42);

  return (
    <div className="h-screen bg-[#0A0A0F] text-white flex flex-col">
      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-60 bg-[#0A0A0F] flex flex-col border-r border-white/5">
          {/* Logo */}
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
              Sonara
            </h1>
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-1">
            <Link
              to="/"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === "/" ? "bg-[#18181F] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Home size={24} />
              <span className="font-medium">Home</span>
            </Link>
            <Link
              to="/search"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === "/search" ? "bg-[#18181F] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Search size={24} />
              <span className="font-medium">Search</span>
            </Link>
            <Link
              to="/library"
              className={`flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors ${
                location.pathname === "/library" ? "bg-[#18181F] text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              <Library size={24} />
              <span className="font-medium">Your Library</span>
            </Link>
          </nav>

          {/* Create Playlist */}
          <div className="px-3 mt-6">
            <button className="flex items-center gap-4 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white transition-colors w-full">
              <div className="w-6 h-6 bg-[#18181F] rounded flex items-center justify-center">
                <Plus size={16} />
              </div>
              <span className="font-medium">Create Playlist</span>
            </button>
          </div>

          {/* Playlists */}
          <div className="flex-1 overflow-y-auto px-3 mt-4 space-y-2">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <img src={playlist.cover} alt="" className="w-12 h-12 rounded object-cover" />
                <span className="text-sm font-medium truncate">{playlist.name}</span>
              </Link>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="h-16 bg-[#0A0A0F]/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="w-8 h-8 bg-[#18181F] rounded-full flex items-center justify-center hover:bg-[#25252E] transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => navigate(1)}
                className="w-8 h-8 bg-[#18181F] rounded-full flex items-center justify-center hover:bg-[#25252E] transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex-1 max-w-md mx-8">
              <input
                type="text"
                placeholder="What do you want to listen to?"
                className="w-full h-10 px-4 bg-[#18181F] rounded-full text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/10"
                onClick={() => {
                  if (location.pathname !== "/search") {
                    navigate("/search");
                  }
                }}
              />
            </div>

            <div className="flex items-center gap-4">
              <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#18181F] transition-colors">
                <Bell size={20} />
              </button>
              <button className="w-8 h-8 rounded-full bg-[#8B5CF6] flex items-center justify-center text-sm font-semibold">
                JD
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0A0A0F] to-[#0A0A0F]">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Bottom player bar */}
      <div className="h-[90px] bg-[#18181F] border-t border-white/5 px-4 flex items-center justify-between">
        {/* Current track */}
        <div className="flex items-center gap-4 w-80">
          <img
            src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=56&h=56&fit=crop"
            alt=""
            className="w-14 h-14 rounded-lg"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">Midnight Echoes</div>
            <div className="text-xs text-gray-400 truncate">Luna Rivers</div>
          </div>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Heart size={18} />
          </button>
        </div>

        {/* Player controls */}
        <div className="flex-1 max-w-2xl px-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Shuffle size={18} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <SkipForward size={20} />
            </button>
            <button className="text-gray-400 hover:text-white transition-colors">
              <Repeat size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-10 text-right">2:14</span>
            <div className="flex-1 h-1 bg-[#25252E] rounded-full relative group cursor-pointer">
              <div
                className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-xs text-gray-400 w-10">5:12</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 w-80 justify-end">
          <button
            onClick={() => navigate("/now-playing")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ListMusic size={20} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Bluetooth size={20} />
          </button>
          <div className="flex items-center gap-2">
            <button className="text-gray-400 hover:text-white transition-colors">
              <Volume2 size={20} />
            </button>
            <div className="w-24 h-1 bg-[#25252E] rounded-full relative group cursor-pointer">
              <div
                className="h-full bg-white rounded-full relative"
                style={{ width: `${volume}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate("/now-playing")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
