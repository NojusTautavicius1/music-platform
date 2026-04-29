import { Link } from "react-router";
import { Play } from "lucide-react";
import { useState } from "react";

const madeForYou = [
  { id: "1", title: "Late Night Drives", description: "Your chill night vibes", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=240&h=240&fit=crop" },
  { id: "2", title: "Focus Flow", description: "Deep work beats", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=240&h=240&fit=crop" },
  { id: "3", title: "Saturday Energy", description: "Weekend party mix", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=240&h=240&fit=crop" },
  { id: "4", title: "Indie Discoveries", description: "Fresh indie picks", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=240&h=240&fit=crop" },
  { id: "5", title: "Lo-Fi Study Session", description: "Concentration beats", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=240&h=240&fit=crop" },
  { id: "6", title: "Jazz Nights", description: "Smooth jazz classics", cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=240&h=240&fit=crop" },
];

const recentlyPlayed = [
  { id: "7", title: "Electronic Essentials", artist: "Playlist", cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=180&h=180&fit=crop" },
  { id: "8", title: "Urban Rhythm", artist: "Playlist", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=180&h=180&fit=crop" },
  { id: "9", title: "Acoustic Mornings", artist: "Playlist", cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=180&h=180&fit=crop" },
  { id: "10", title: "Night Drive", artist: "Synthwave Radio", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=180&h=180&fit=crop" },
  { id: "11", title: "Workout Power", artist: "Playlist", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=180&h=180&fit=crop" },
  { id: "12", title: "Chill Vibes", artist: "Daily Mix", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=180&h=180&fit=crop" },
];

const newReleases = [
  { id: "13", title: "Neon Dreams", artist: "Aurora Waves", cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=180&h=180&fit=crop" },
  { id: "14", title: "Echoes", artist: "The Midnight", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=180&h=180&fit=crop" },
  { id: "15", title: "Solitude", artist: "Ember Lake", cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=180&h=180&fit=crop" },
  { id: "16", title: "Voltage", artist: "Circuit Breakers", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=180&h=180&fit=crop" },
  { id: "17", title: "Drift", artist: "Luna Rivers", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=180&h=180&fit=crop" },
  { id: "18", title: "Reflections", artist: "Maya Storm", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=180&h=180&fit=crop" },
  { id: "19", title: "Pulse", artist: "Nova Beats", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=180&h=180&fit=crop" },
  { id: "20", title: "Velvet Sky", artist: "Indigo Nights", cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=180&h=180&fit=crop" },
];

const genres = ["Electronic", "Indie", "Jazz", "Hip-Hop", "R&B", "Lo-Fi"];

function PlaylistCard({ playlist, large = false }: { playlist: any; large?: boolean }) {
  const [showPlay, setShowPlay] = useState(false);

  return (
    <Link
      to={`/playlist/${playlist.id}`}
      className="group relative bg-[#18181F] rounded-xl p-4 hover:bg-[#25252E] transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setShowPlay(true)}
      onMouseLeave={() => setShowPlay(false)}
    >
      <div className="relative mb-4">
        <img
          src={playlist.cover}
          alt={playlist.title}
          className={`w-full ${large ? 'aspect-square' : 'aspect-square'} object-cover rounded-lg shadow-lg`}
        />
        <button
          className={`absolute right-2 bottom-2 w-12 h-12 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            showPlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <Play size={20} fill="white" className="ml-0.5" />
        </button>
      </div>
      <h3 className="font-semibold mb-1 truncate">{playlist.title}</h3>
      <p className="text-sm text-gray-400 truncate">{playlist.description || playlist.artist}</p>
    </Link>
  );
}

export function Home() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8">
      {/* Greeting */}
      <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
        {greeting}, Justas
      </h1>

      {/* Made for you */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Made for you</h2>
        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
          {madeForYou.map((playlist) => (
            <div key={playlist.id} className="flex-shrink-0 w-60">
              <PlaylistCard playlist={playlist} large />
            </div>
          ))}
        </div>
      </section>

      {/* Your top genres */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Your top genres</h2>
        <div className="flex gap-3 flex-wrap">
          {genres.map((genre) => (
            <button
              key={genre}
              className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8B5CF6]/10 to-[#EC4899]/10 border border-[#8B5CF6]/20 text-sm font-medium hover:border-[#8B5CF6]/40 transition-all"
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Recently played */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Recently played</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {recentlyPlayed.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>

      {/* New releases */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">New releases</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
          {newReleases.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      </section>
    </div>
  );
}
