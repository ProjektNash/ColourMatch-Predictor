import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  // Load username from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("pn_user");
    if (storedUser) {
      const formatted =
        storedUser.charAt(0).toUpperCase() + storedUser.slice(1);
      setUsername(formatted);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("pn_loggedIn");
    localStorage.removeItem("pn_user");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-light bg-white shadow-sm px-3">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Left side - welcome message */}
        <span className="text-secondary small">
          Welcome, <strong>{username || "User"}</strong>
        </span>

        {/* Right side - logout button */}
        <button
          onClick={handleLogout}
          className="btn btn-outline-secondary btn-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
