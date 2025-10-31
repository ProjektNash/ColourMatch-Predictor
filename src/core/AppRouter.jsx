// src/core/AppRouter.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Core layout components
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";

// Modules
import Assets from "../modules/Assets/Assets";
import ColourMatch from "../modules/ColourMatch/pages/ColourMatch.jsx"; // ✅ added import

// Dashboard placeholder
function Dashboard() {
  return (
    <div className="p-4">
      <h3 className="mb-3">Dashboard</h3>
      <p className="text-secondary">Welcome to ProjektNash-Core.</p>
    </div>
  );
}

export default function AppRouter() {
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("pn_loggedIn") === "true"
  );

  // Watch for login state changes
  useEffect(() => {
    const handleStorageChange = () => {
      setLoggedIn(localStorage.getItem("pn_loggedIn") === "true");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Background login check
  useEffect(() => {
    const checkLogin = setInterval(() => {
      const stored = localStorage.getItem("pn_loggedIn") === "true";
      if (stored !== loggedIn) setLoggedIn(stored);
    }, 500);
    return () => clearInterval(checkLogin);
  }, [loggedIn]);

  // --- Unauthenticated routes ---
  if (!loggedIn) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // --- Authenticated layout ---
  return (
    <Router>
      <div className="d-flex">
        {/* Sidebar navigation */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-grow-1 bg-light min-vh-100">
          <Navbar />
          <div className="container-fluid mt-3">
            <Routes>
              {/* Dashboard */}
              <Route path="/" element={<Dashboard />} />

              {/* Assets Module */}
              <Route path="/assets" element={<Assets />} />

              {/* ✅ Colour Match Module */}
              <Route path="/colourmatch" element={<ColourMatch />} />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
