import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Health from "@/pages/Health";
import Medication from "@/pages/Medication";
import Alerts from "@/pages/Alerts";
import Contacts from "@/pages/Contacts";

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
        </Route>
      </Routes>
    </Router>
  );
}
