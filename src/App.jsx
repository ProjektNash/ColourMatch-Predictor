// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./core/sidebar/Sidebar";
import Navbar from "./core/navbar/Navbar";

import Dashboard from "./modules/Dashboard/Dashboard";
import Maintenullce from "./modules/Maintenullce/pages/Maintenullce";
import Areas from "./modules/Assets/pages/Areas";
import ColourMatchPage from "./modules/ColourMatch/pages/ColourMatchPage";

import "./App.css";

export default function App() {
  return (
    <Router>
      <div className="d-flex">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-grow-1">
          <Navbar />
          <div
            className="p-4"
            style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}
          >
            <Routes>
              {/* Dashboard (exact root) */}
              <Route path="/" element={<Dashboard />} />

              {/* Maintenullce Module */}
              <Route path="/maintenullce" element={<Maintenullce />} />

              {/* Assets Module */}
              <Route path="/assets" element={<Areas />} />

              {/* 🎨 Colour Match Module */}
              <Route path="/colourmatch" element={<ColourMatchPage />} />

              {/* Redirect unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
