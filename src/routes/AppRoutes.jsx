import { Navigate, Route, Routes } from "react-router-dom";
import Home from "../pages/Home";
import About from "../pages/About";
import Agency from "../pages/Agency";
import Login from "../pages/Login";
import Panel from "../pages/Panel";
import Dashboard from "../pages/Dashboard";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/agency" element={<Agency />} />
      <Route path="/login" element={<Login />} />
      <Route path="/panel" element={<Panel />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
