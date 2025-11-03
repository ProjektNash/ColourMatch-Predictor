import React from "react";
import { Link, useLocation } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/" },
    { name: "Colour Match", path: "/colourmatch" }, // ✅ new menu item
  ];

  return (
    <div
      className="d-flex flex-column bg-dark text-white p-3"
      style={{ width: "250px", minHeight: "100vh" }}
    >
      <h4 className="mb-4 text-center fw-bold text-info">ProjektNash-Core</h4>

      <ul className="nav nav-pills flex-column mb-auto">
        {menuItems.map((item) => (
          <li className="nav-item mb-2" key={item.path}>
            <Link
              to={item.path}
              className={`nav-link text-white ${
                location.pathname === item.path
                  ? "active bg-info text-dark fw-semibold"
                  : ""
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      <div className="text-center small text-secondary mt-auto">
        © ProjektNash
      </div>
    </div>
  );
}
