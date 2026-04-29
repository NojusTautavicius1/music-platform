import { useParams } from "react-router";
import { Play, Heart, MoreHorizontal, Clock } from "lucide-react";
import { useState } from "react";

const songs = [
  { id: "1", title: "Midnight Echoes", artist: "Luna Rivers", album: "Drift", duration: "5:12", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=48&h=48&fit=crop", addedAt: "3 days ago" },
  { id: "2", title: "Neon Waves", artist: "Aurora Waves", album: "Neon Dreams", duration: "4:38", cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=48&h=48&fit=crop", addedAt: "5 days ago" },
  { id: "3", title: "Velvet Skies", artist: "Indigo Nights", album: "Velvet Sky", duration: "3:45", cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=48&h=48&fit=crop", addedAt: "1 week ago" },
  { id: "4", title: "Circuit Dreams", artist: "Circuit Breakers", album: "Voltage", duration: "4:22", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=48&h=48&fit=crop", addedAt: "1 week ago" },
  { id: "5", title: "Solitude", artist: "Ember Lake", album: "Solitude", duration: "5:47", cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=48&h=48&fit=crop", addedAt: "2 weeks ago" },
  { id: "6", title: "Lost in Translation", artist: "Maya Storm", album: "Reflections", duration: "4:15", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=48&h=48&fit=crop", addedAt: "2 weeks ago" },
  { id: "7", title: "Cosmic Flow", artist: "Nova Beats", album: "Pulse", duration: "3:58", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=48&h=48&fit=crop", addedAt: "3 weeks ago" },
  { id: "8", title: "City Lights", artist: "The Midnight", album: "Echoes", duration: "4:44", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=48&h=48&fit=crop", addedAt: "3 weeks ago" },
  { id: "9", title: "After Hours", artist: "Luna Rivers", album: "Drift", duration: "5:33", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=48&h=48&fit=crop", addedAt: "1 month ago" },
  { id: "10", title: "Breathe", artist: "Ember Lake", album: "Solitude", duration: "4:02", cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=48&h=48&fit=crop", addedAt: "1 month ago" },
];

function Equalizer() {
  return (
    <div className="flex items-center gap-0.5 h-4">
      <div className="w-0.5 bg-gradient-to-t from-[#8B5CF6] to-[#EC4899] animate-pulse" style={{ height: '40%', animationDelay: '0ms', animationDuration: '800ms' }} />
      <div className="w-0.5 bg-gradient-to-t from-[#8B5CF6] to-[#EC4899] animate-pulse" style={{ height: '80%', animationDelay: '200ms', animationDuration: '800ms' }} />
      <div className="w-0.5 bg-gradient-to-t from-[#8B5CF6] to-[#EC4899] animate-pulse" style={{ height: '60%', animationDelay: '400ms', animationDuration: '800ms' }} />
      <div className="w-0.5 bg-gradient-to-t from-[#8B5CF6] to-[#EC4899] animate-pulse" style={{ height: '90%', animationDelay: '600ms', animationDuration: '800ms' }} />
    </div>
  );
}

export function PlaylistDetail() {
  const { id } = useParams();
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState("1");
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set(["1", "3", "5"]));

  const toggleLike = (songId: string) => {
    setLikedSongs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(songId)) {
        newSet.delete(songId);
      } else {
        newSet.add(songId);
      }
      return newSet;
    });
  };

  return (
    <div>
      {/* Header with gradient background */}
      <div className="relative bg-gradient-to-b from-[#8B5CF6]/30 via-[#EC4899]/20 to-transparent p-8 pb-6">
        <div className="flex items-end gap-6">
          <img
            src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=232&h=232&fit=crop"
            alt="Late Night Drives"
            className="w-58 h-58 rounded-lg shadow-2xl"
          />
          <div className="flex-1 pb-2">
            <p className="text-sm font-semibold text-white/80 mb-2">PUBLIC PLAYLIST</p>
            <h1 className="text-7xl font-bold mb-6">Late Night Drives</h1>
            <p className="text-gray-300 mb-4 max-w-2xl">
              Your perfect soundtrack for cruising through city lights. Smooth beats, atmospheric synths, and dreamy vocals.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-6 h-6 bg-[#8B5CF6] rounded-full flex items-center justify-center text-xs font-semibold">
                JD
              </div>
              <span className="font-semibold">Justas Dabrila</span>
              <span className="text-gray-400">• 42 songs, 3 hr 24 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-8 py-6 flex items-center gap-6 bg-gradient-to-b from-transparent to-[#0A0A0F]">
        <button className="w-14 h-14 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-xl">
          <Play size={24} fill="white" className="ml-1" />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <Heart size={32} />
        </button>
        <button className="text-gray-400 hover:text-white transition-colors">
          <MoreHorizontal size={32} />
        </button>
      </div>

      {/* Song table */}
      <div className="px-8 pb-8">
        <div className="mb-4">
          <div className="grid grid-cols-[16px_6fr_4fr_3fr_1fr] gap-4 px-4 py-2 text-sm text-gray-400 border-b border-white/5">
            <div className="text-center">#</div>
            <div>Title</div>
            <div>Album</div>
            <div>Date added</div>
            <div className="flex justify-end">
              <Clock size={16} />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {songs.map((song, index) => {
            const isPlaying = song.id === playingId;
            const isHovered = song.id === hoveredRow;
            const isLiked = likedSongs.has(song.id);

            return (
              <div
                key={song.id}
                className={`grid grid-cols-[16px_6fr_4fr_3fr_1fr] gap-4 px-4 py-3 rounded-lg group transition-colors cursor-pointer ${
                  isPlaying ? 'bg-white/5' : 'hover:bg-white/5'
                }`}
                onMouseEnter={() => setHoveredRow(song.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => setPlayingId(song.id)}
              >
                <div className="flex items-center justify-center text-gray-400">
                  {isPlaying ? (
                    <Equalizer />
                  ) : isHovered ? (
                    <Play size={14} fill="white" className="ml-0.5" />
                  ) : (
                    <span className="text-sm">{index + 1}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <img src={song.cover} alt="" className="w-12 h-12 rounded" />
                  <div>
                    <div className={`font-medium ${isPlaying ? 'text-[#8B5CF6]' : 'text-white'}`}>
                      {song.title}
                    </div>
                    <div className="text-sm text-gray-400">{song.artist}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  {song.album}
                </div>
                <div className="flex items-center text-gray-400 text-sm">
                  {song.addedAt}
                </div>
                <div className="flex items-center justify-end gap-4 text-gray-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLike(song.id);
                    }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                      isLiked ? 'opacity-100 text-[#8B5CF6]' : ''
                    }`}
                  >
                    <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                  </button>
                  <span className="text-sm">{song.duration}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
