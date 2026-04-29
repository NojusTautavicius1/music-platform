import { useState } from "react";
import { Link } from "react-router";
import { Play } from "lucide-react";

const genres = [
  { name: "Pop", color: "from-pink-500 to-purple-500", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop" },
  { name: "Hip-Hop", color: "from-orange-600 to-red-600", cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=120&h=120&fit=crop" },
  { name: "Rock", color: "from-red-700 to-gray-900", cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop" },
  { name: "Electronic", color: "from-cyan-400 to-blue-600", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=120&h=120&fit=crop" },
  { name: "Jazz", color: "from-amber-700 to-yellow-900", cover: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=120&h=120&fit=crop" },
  { name: "Lo-Fi", color: "from-purple-400 to-pink-400", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop" },
  { name: "R&B", color: "from-rose-600 to-pink-700", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=120&h=120&fit=crop" },
  { name: "Indie", color: "from-green-600 to-teal-700", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=120&h=120&fit=crop" },
  { name: "Classical", color: "from-gray-700 to-slate-900", cover: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=120&h=120&fit=crop" },
  { name: "Country", color: "from-yellow-700 to-orange-800", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=120&h=120&fit=crop" },
  { name: "Metal", color: "from-gray-900 to-black", cover: "https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=120&h=120&fit=crop" },
  { name: "Latin", color: "from-red-500 to-yellow-500", cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=120&h=120&fit=crop" },
];

const allSongs = [
  { id: "1", title: "Midnight Echoes", artist: "Luna Rivers", album: "Drift", duration: "5:12", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=48&h=48&fit=crop" },
  { id: "2", title: "Neon Waves", artist: "Aurora Waves", album: "Neon Dreams", duration: "4:38", cover: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=48&h=48&fit=crop" },
  { id: "3", title: "Velvet Skies", artist: "Indigo Nights", album: "Velvet Sky", duration: "3:45", cover: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=48&h=48&fit=crop" },
];

const allPlaylists = [
  { id: "1", title: "Late Night Drives", description: "42 songs", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=180&h=180&fit=crop" },
  { id: "2", title: "Focus Flow", description: "38 songs", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=180&h=180&fit=crop" },
];

export function Search() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const hasQuery = query.trim().length > 0;
  const filteredSongs = allSongs.filter(
    song => song.title.toLowerCase().includes(query.toLowerCase()) ||
           song.artist.toLowerCase().includes(query.toLowerCase())
  );
  const filteredPlaylists = allPlaylists.filter(
    playlist => playlist.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Search input */}
      <div className="mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What do you want to listen to?"
          className="w-full max-w-md h-12 px-5 bg-[#18181F] rounded-full placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/10"
          autoFocus
        />
      </div>

      {!hasQuery ? (
        <>
          <h1 className="text-4xl font-bold mb-8">Browse all</h1>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {genres.map((genre) => (
              <button
                key={genre.name}
                className="relative h-48 rounded-xl overflow-hidden group cursor-pointer transition-transform hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${genre.color}`} />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <h3 className="text-2xl font-bold">{genre.name}</h3>
                  <img
                    src={genre.cover}
                    alt=""
                    className="absolute bottom-0 right-0 w-28 h-28 object-cover rounded-lg rotate-[25deg] translate-x-4 translate-y-2 shadow-xl"
                  />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-white/5">
            {["All", "Songs", "Artists", "Albums", "Playlists"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-semibold transition-colors relative ${
                  activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899]" />
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top result */}
            {filteredSongs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Top result</h2>
                <div className="bg-[#18181F] rounded-xl p-6 hover:bg-[#25252E] transition-colors group cursor-pointer">
                  <img
                    src={filteredSongs[0].cover}
                    alt={filteredSongs[0].title}
                    className="w-24 h-24 rounded-lg mb-6"
                  />
                  <h3 className="text-3xl font-bold mb-2">{filteredSongs[0].title}</h3>
                  <p className="text-gray-400 mb-6">{filteredSongs[0].artist}</p>
                  <button className="w-12 h-12 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} fill="white" className="ml-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Songs */}
            {filteredSongs.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Songs</h2>
                <div className="space-y-2">
                  {filteredSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-[#18181F] transition-colors group cursor-pointer"
                    >
                      <img src={song.cover} alt="" className="w-12 h-12 rounded" />
                      <div className="flex-1">
                        <div className="font-medium">{song.title}</div>
                        <div className="text-sm text-gray-400">{song.artist}</div>
                      </div>
                      <span className="text-sm text-gray-400">{song.duration}</span>
                      <button className="w-10 h-10 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} fill="white" className="ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Playlists */}
          {filteredPlaylists.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Playlists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {filteredPlaylists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className="bg-[#18181F] rounded-xl p-4 hover:bg-[#25252E] transition-colors group cursor-pointer"
                  >
                    <div className="relative mb-4">
                      <img
                        src={playlist.cover}
                        alt={playlist.title}
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <button className="absolute right-2 bottom-2 w-12 h-12 bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={20} fill="white" className="ml-0.5" />
                      </button>
                    </div>
                    <h3 className="font-semibold mb-1 truncate">{playlist.title}</h3>
                    <p className="text-sm text-gray-400">{playlist.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredSongs.length === 0 && filteredPlaylists.length === 0 && (
            <div className="text-center py-16">
              <p className="text-2xl font-semibold mb-2">No results found for "{query}"</p>
              <p className="text-gray-400">Try searching with different keywords</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
