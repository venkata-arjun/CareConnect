import { BrowserRouter, Routes, Route } from "react-router-dom";

import AIReview from "../pages/AIReview";
import AIUnavailable from "../pages/AIUnavailable";
import ActivityHistory from "../pages/ActivityHistory";
import ActivityReview from "../pages/ActivityReview";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/Login";
import CallLogging from "../pages/CallLogging";
import PatientDetails from "../pages/PatientDetails";
import Patients from "../pages/Patients";
import Profile from "../pages/Profile";
import SaveError from "../pages/SaveError";
import Worklist from "../pages/Worklist";

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/worklist" element={<Worklist />} />

        <Route path="/patients" element={<Patients />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/patient/:patientId" element={<PatientDetails />} />

        <Route path="/patient/:patientId/call" element={<CallLogging />} />

        <Route path="/patient/:patientId/ai-review" element={<AIReview />} />

        <Route
          path="/patient/:patientId/ai-unavailable"
          element={<AIUnavailable />}
        />

        <Route
          path="/patient/:patientId/activity-review"
          element={<ActivityReview />}
        />

        <Route
          path="/patient/:patientId/activity-history"
          element={<ActivityHistory />}
        />

        <Route path="/patient/:patientId/save-error" element={<SaveError />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
