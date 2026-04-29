import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { Home } from "./components/pages/Home";
import { Library } from "./components/pages/Library";
import { PlaylistDetail } from "./components/pages/PlaylistDetail";
import { NowPlaying } from "./components/pages/NowPlaying";
import { Search } from "./components/pages/Search";
import { Login } from "./components/pages/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: Home },
      { path: "library", Component: Library },
      { path: "playlist/:id", Component: PlaylistDetail },
      { path: "now-playing", Component: NowPlaying },
      { path: "search", Component: Search },
    ],
  },
]);
