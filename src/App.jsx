import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import CareerGuidance from "./pages/CareerGuidance";
import StudyPlanner from "./pages/StudyPlanner";
import ExamPlanWizard from "./pages/ExamPlanWizard";
import AITutor from "./pages/AITutor";
import CollegeFinder from "./pages/CollegeFinder";
import ProgressTracker from "./pages/ProgressTracker";
import Profile from "./pages/Profile";

// Milestone 1 routes: one working page per sidebar item.
// Deeper features (AI, Firebase) will be added in later milestones.
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="career" element={<CareerGuidance />} />
        <Route path="planner" element={<StudyPlanner />} />
        <Route path="planner/new" element={<ExamPlanWizard />} />
        <Route path="tutor" element={<AITutor />} />
        <Route path="colleges" element={<CollegeFinder />} />
        <Route path="progress" element={<ProgressTracker />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
