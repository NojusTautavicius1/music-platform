import { type Metadata } from "next";
import { NowPlayingView } from "./NowPlayingView";

export const metadata: Metadata = {
  title: "Now Playing",
  robots: { index: false, follow: false },
};

export default function NowPlayingPage() {
  return <NowPlayingView />;
}
