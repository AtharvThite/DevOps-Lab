import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import PipelinePage from "./pages/PipelinePage";
import StatusPage from "./pages/StatusPage";

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/pipeline/:id" element={<StatusPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
