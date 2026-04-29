import { useNavigate } from "react-router";
import { ChevronDown, Heart, MoreHorizontal, Play, Pause, Shuffle, SkipBack, SkipForward, Repeat } from "lucide-react";
import { useState } from "react";

const lyrics = [
  { time: "0:14", line: "Driving through the city lights" },
  { time: "0:18", line: "Shadows dance in neon bright" },
  { time: "0:23", line: "Radio plays our favorite song" },
  { time: "0:27", line: "In this moment we belong" },
  { time: "0:32", line: "" },
  { time: "0:35", line: "Midnight echoes call my name" },
  { time: "0:40", line: "Every street looks just the same" },
  { time: "0:44", line: "Lost in thoughts of yesterday" },
  { time: "0:48", line: "Hoping you would choose to stay" },
  { time: "0:53", line: "" },
  { time: "0:56", line: "But you're gone now, far away" },
  { time: "1:01", line: "Left me here with words to say" },
  { time: "1:05", line: "So I drive through empty nights" },
  { time: "1:09", line: "Chasing dreams in city lights" },
];

export function NowPlaying() {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentLine, setCurrentLine] = useState(2);
  const [progress, setProgress] = useState(42);
  const [isLiked, setIsLiked] = useState(true);

  return (
    <div className="fixed inset-0 bg-[#0A0A0F] z-50 flex flex-col">
      {/* Background blur */}
      <div className="absolute inset-0 opacity-30">
        <img
          src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop"
          alt=""
          className="w-full h-full object-cover blur-3xl scale-110"
        />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition-colors"
          >
            <ChevronDown size={24} />
          </button>
          <div className="text-center">
            <p className="text-sm text-gray-400">Playing from playlist</p>
            <p className="font-semibold">Late Night Drives</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center hover:bg-black/30 transition-colors">
            <MoreHorizontal size={24} />
          </button>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex items-center justify-center px-16 pb-8">
          <div className="flex gap-16 max-w-7xl w-full">
            {/* Album art and controls */}
            <div className="flex-1 flex flex-col items-center justify-center max-w-2xl">
              {/* Album art */}
              <img
                src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=480&h=480&fit=crop"
                alt="Midnight Echoes"
                className="w-[480px] h-[480px] rounded-2xl shadow-2xl mb-8"
              />

              {/* Song info */}
              <div className="text-center mb-6 w-full">
                <h1 className="text-4xl font-bold mb-3">Midnight Echoes</h1>
                <p className="text-xl text-gray-400">Luna Rivers</p>
              </div>

              {/* Like button */}
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="mb-8 text-gray-400 hover:text-white transition-colors"
              >
                <Heart size={32} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'text-[#8B5CF6]' : ''} />
              </button>

              {/* Progress bar */}
              <div className="w-full mb-2">
                <div className="h-1.5 bg-white/10 rounded-full relative group cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] rounded-full relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
                  </div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-2">
                  <span>2:14</span>
                  <span>5:12</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-8 mt-6">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Shuffle size={24} />
                </button>
                <button className="text-white hover:scale-110 transition-transform">
                  <SkipBack size={32} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
                >
                  {isPlaying ? (
                    <Pause size={28} fill="white" />
                  ) : (
                    <Play size={28} fill="white" className="ml-1" />
                  )}
                </button>
                <button className="text-white hover:scale-110 transition-transform">
                  <SkipForward size={32} />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Repeat size={24} />
                </button>
              </div>
            </div>

            {/* Lyrics panel */}
            <div className="w-[400px] bg-black/20 backdrop-blur-md rounded-2xl p-8 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-400 mb-6 uppercase tracking-wider">Lyrics</h3>
              <div className="space-y-6">
                {lyrics.map((lyric, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 ${
                      index === currentLine
                        ? 'text-white text-2xl font-medium'
                        : index < currentLine
                        ? 'text-gray-500 text-lg'
                        : 'text-gray-600 text-lg'
                    }`}
                  >
                    {lyric.line || <div className="h-6" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
