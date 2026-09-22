import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ForumPage from "./pages/ForumPage";
import ThreadPage from "./pages/ThreadPage";
import NewThread from "./pages/NewThread";
import NewReply from "./pages/NewReply";
import AuthGuard from "./components/Guard";
import UploadPage from "./pages/UploadPage";
import EditThread from "./pages/EditThread";
import EditReply from "./pages/EditReply";
import NewPosts from "./pages/NewPosts";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/forum/:f" element={<ForumPage />} />
      <Route path="/newposts" element={<NewPosts />} />
      <Route path="/forum/:f/:t" element={<ThreadPage />} />
      <Route
        path="/post/:f"
        element={
          <AuthGuard>
            <NewThread />
          </AuthGuard>
        }
      />
      <Route
        path="/editThread/:f/:t"
        element={
          <AuthGuard>
            <EditThread />
          </AuthGuard>
        }
      />
      <Route
        path="/post/:f/:t"
        element={
          <AuthGuard>
            <NewReply />
          </AuthGuard>
        }
      />
      <Route
        path="/editReply/:f/:t/:id"
        element={
          <AuthGuard>
            <EditReply />
          </AuthGuard>
        }
      />
      <Route path="/about" element={<About />} />
      <Route path="/upload" element={<UploadPage />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
