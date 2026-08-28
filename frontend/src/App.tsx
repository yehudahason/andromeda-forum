import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ForumPage from "./pages/ForumPage";
import ThreadPage from "./pages/ThreadPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/forum/:f" element={<ForumPage />} />
      <Route path="/forum/:f/:id" element={<ThreadPage />} />
      <Route path="/about" element={<About />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
