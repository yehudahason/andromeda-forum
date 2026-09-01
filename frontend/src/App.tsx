import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ForumPage from "./pages/ForumPage";
import ThreadPage from "./pages/ThreadPage";
import NewThread from "./pages/NewThread";
import NewReply from "./pages/NewReply";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/forum/:f" element={<ForumPage />} />
      <Route path="/forum/:f/:id" element={<ThreadPage />} />
      <Route path="/post/:f/" element={<NewThread />} />
      <Route path="/post/:f/:t" element={<NewReply />} />
      <Route path="/about" element={<About />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
