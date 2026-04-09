import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AnimatedBackground from "./components/AnimatedBackground";
import Login from "./pages/Login";
import LandingPage from "./pages/LandingPage";
import UploadResume from "./pages/UploadResume";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import CandidatePortal from "./pages/CandidatePortal";

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === "recruiter" ? "/upload" : "/candidate"} replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <AnimatedBackground />
      {user?.role === "recruiter" && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to={user.role === "recruiter" ? "/upload" : "/candidate"} /> : <Login />} />
        <Route path="/upload" element={<RequireAuth role="recruiter"><UploadResume /></RequireAuth>} />
        <Route path="/results" element={<RequireAuth role="recruiter"><Results /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth role="recruiter"><Dashboard /></RequireAuth>} />
        <Route path="/candidate" element={<RequireAuth role="candidate"><CandidatePortal /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}