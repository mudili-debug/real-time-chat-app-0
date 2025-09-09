const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://real-time-chat-app-0.onrender.com"  // your Render backend URL
    : "http://localhost:5000";

export default API_BASE_URL;
