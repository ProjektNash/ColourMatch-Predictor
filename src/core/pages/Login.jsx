import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Log the form data before sending it
    console.log("Form data being sent:", form);

    try {
      // Send login request to backend
      const response = await axios.post("http://localhost:5000/login", form);

      // Store the JWT token and username if login is successful
      localStorage.setItem("pn_loggedIn", "true");
      localStorage.setItem("pn_user", form.username);
      localStorage.setItem("pn_token", response.data.token); // Store JWT token

      setError("");
      navigate("/", { replace: true }); // Redirect to dashboard
    } catch (err) {
      // Log the full error response for debugging
      console.error("Login error:", err);

      // Show user-friendly error message
      if (err.response) {
        console.error("Error response data:", err.response.data);
        setError(err.response.data.message || "Invalid credentials");
      } else {
        setError("Network error or server issue. Please try again later.");
      }
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center bg-light"
      style={{ minHeight: "100vh" }}
    >
      <div
        className="card shadow-sm p-4"
        style={{ width: "100%", maxWidth: "400px" }}
      >
        <h4 className="text-center mb-3 text-info fw-bold">ProjektNash-Core</h4>
        <p className="text-center text-secondary mb-4">Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="alert alert-danger py-2 small text-center">
              {error}
            </div>
          )}

          <div className="d-grid">
            <button className="btn btn-info text-white" type="submit">
              Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
