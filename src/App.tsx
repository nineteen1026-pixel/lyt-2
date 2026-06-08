import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Health from "@/pages/Health";
import Medication from "@/pages/Medication";
import Alerts from "@/pages/Alerts";
import Contacts from "@/pages/Contacts";
import CommunityService from "@/pages/CommunityService";
import MonthlyReport from "@/pages/MonthlyReport";
import RiskStratification from "@/pages/RiskStratification";
import Schedule from "@/pages/Schedule";
import FamilyCareTask from "@/pages/FamilyCareTask";
import FollowUp from "@/pages/FollowUp";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/health" element={<Health />} />
          <Route path="/medication" element={<Medication />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/community-service" element={<CommunityService />} />
          <Route path="/monthly-report" element={<MonthlyReport />} />
          <Route path="/risk-stratification" element={<RiskStratification />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/family-care-task" element={<FamilyCareTask />} />
          <Route path="/follow-up" element={<FollowUp />} />
        </Route>
      </Routes>
    </Router>
  );
}
