import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/Guard";
import Home from "./Home";
import Test from "./pages/Test";
// import Guard from "./Guard";
import NotFound from "./components/NotFound";
import Layout from "./Layout";
import TodoMain from "./pages/TodoMain";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/todo"
            element={
              <AuthGuard>
                <TodoMain />
              </AuthGuard>
            }
          />

          <Route
            path="/test"
            element={
              // <Guard>
              <Test />
              // </Guard>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
