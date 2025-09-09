import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Chat from "./components/Chat";
import ChatBot from "./components/ChatBot";
import "./App.css";

// Professional Navbar Component
const NavBar = ({ user, onLogout }) => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="logo">
          <Link to="/" className="brand">
            <svg className="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20C10.4605 20 9.02151 19.6331 7.76491 19M3 12C3 7.58172 7.02944 4 12 4C14.3271 4 16.4615 4.77557 18.1421 6.07107M3 12C3 13.1251 3.21171 14.2039 3.59963 15.2M21 12C21 10.8749 20.7883 9.79606 20.4004 8.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            ChatApp
          </Link>
        </div>
        <nav className="nav-links">
          {!user && (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="nav-link nav-link-primary">Sign Up</Link>
            </div>
          )}
          {user && (
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="welcome">Hi, {user.username}</span>
              </div>
              <button onClick={onLogout} className="logout-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15M10 17L15 12M15 12L10 7M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => setUser(JSON.parse(localStorage.getItem("user")) || null);
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="app">
      <NavBar user={user} onLogout={handleLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Chat />} />
        </Routes>
      </main>
      <ChatBot />
    </div>
  );
};

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}