import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";

const socket = io("https://real-time-chat-app-0.onrender.com/api/chats");

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [users, setUsers] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedPrivateUser, setSelectedPrivateUser] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [privateSearchQuery, setPrivateSearchQuery] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!user) window.location.href = "/login";

    const fetchChats = async () => {
      const { data } = await axios.get("https://real-time-chat-app-0.onrender.com/api/chats", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setChats(data);
    };

    const fetchUsers = async () => {
      const { data } = await axios.get("https://real-time-chat-app-0.onrender.com/api/auth/users", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setUsers(data.filter((u) => u._id !== user.id));
    };

    fetchChats();
    fetchUsers();

    socket.emit("join", { userId: user.id });

    socket.on("message", (msg) => {
      if (msg.chat === selectedChat?._id) setMessages((prev) => [...prev, msg]);
    });

    socket.on("onlineStatus", ({ userId, online }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: online }));
    });

    return () => socket.disconnect();
  }, [user, selectedChat]);

  // Logout
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Select Chat
  const selectChat = async (chat) => {
    setSelectedChat(chat);
    socket.emit("joinChat", chat._id);
    const { data } = await axios.get(`https://real-time-chat-app-0.onrender.com/api/messages/${chat._id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    setMessages(data);
  };

  // Send Message
  const sendMessage = async () => {
    if (!message && !file) return;
    const formData = new FormData();
    formData.append("content", message);
    formData.append("chatId", selectedChat._id);
    if (file) formData.append("file", file);

    try {
      await axios.post("https://real-time-chat-app-0.onrender.com/api/message", formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMessage("");
      setFile(null);
    } catch (err) {
      alert(err.response?.data?.message || "Error sending message");
    }
  };

  // Create Group
  const createGroup = async () => {
    if (!groupName || selectedUsers.length === 0) {
      return alert("Please enter a group name and select users.");
    }
    try {
      const { data } = await axios.post(
        "https://real-time-chat-app-0.onrender.com/api/chat",
        { isGroup: true, name: groupName, users: selectedUsers },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setChats((prev) => [...prev, data]);
      setSelectedChat(data);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedUsers([]);
      setGroupSearchQuery("");
    } catch (err) {
      alert(err.response?.data?.message || "Error creating group");
    }
  };

  // Start Private Chat
  const startPrivateChat = async () => {
    if (!selectedPrivateUser) return alert("Select a user");
    try {
      const { data } = await axios.post(
        "https://real-time-chat-app-0.onrender.com/api/chat",
        { isGroup: false, users: [selectedPrivateUser] },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      // Add chat if not already exists
      if (!chats.find((c) => c._id === data._id)) setChats((prev) => [...prev, data]);
      setSelectedChat(data);
      setShowPrivateModal(false);
      setSelectedPrivateUser(null);
      setPrivateSearchQuery("");
    } catch (err) {
      alert(err.response?.data?.message || "Error starting chat");
    }
  };

  // Filtered users for group modal
  const filteredGroupUsers = users.filter(u =>
    u.username.toLowerCase().includes(groupSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  // Filtered users for private modal
  const filteredPrivateUsers = users.filter(u =>
    u.username.toLowerCase().includes(privateSearchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(privateSearchQuery.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif", backgroundColor: "#f0f0f0" }}>
      {/* Sidebar */}
      <div style={{ width: "30%", borderRight: "1px solid #ccc", padding: "10px", backgroundColor: "#fff", overflowY: "auto" }}>
        <button
          onClick={() => setShowGroupModal(true)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Create Group
        </button>
        <button
          onClick={() => setShowPrivateModal(true)}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          New Chat
        </button>
        <button
          onClick={logout}
          style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#dc3545", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
        >
          Logout
        </button>

        <ul style={{ listStyle: "none", padding: "0" }}>
          {chats.map((chat) => (
            <li
              key={chat._id}
              onClick={() => selectChat(chat)}
              style={{
                padding: "10px",
                borderBottom: "1px solid #eee",
                cursor: "pointer",
                backgroundColor: selectedChat?._id === chat._id ? "#e9ecef" : "transparent",
              }}
            >
              {chat.isGroup ? chat.name : chat.users.find((u) => u._id !== user.id)?.username}
              {chat.users.map((u) => (onlineUsers[u._id] ? " (Online)" : " (Offline)"))}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat Area */}
      <div style={{ width: "70%", padding: "10px", backgroundColor: "#fff", overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        {selectedChat && (
          <>
            <div style={{ height: "70vh", overflowY: "auto", borderBottom: "1px solid #ccc", padding: "10px" }}>
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  style={{
                    margin: "10px 0",
                    padding: "8px",
                    backgroundColor: msg.sender._id === user.id ? "#007bff" : "#e9ecef",
                    color: msg.sender._id === user.id ? "#fff" : "#000",
                    borderRadius: "5px",
                    maxWidth: "60%",
                    wordWrap: "break-word",
                  }}
                >
                  <strong>{msg.sender.username}:</strong> {msg.content}
                  {msg.file && (
                    <a href={`https://real-time-chat-app-0.onrender.com/${msg.file}`} download style={{ color: msg.sender._id === user.id ? "#fff" : "#007bff" }}>
                      File
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div style={{ padding: "10px", display: "flex", gap: "10px" }}>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type message"
                style={{ flex: "1", padding: "8px", border: "1px solid #ccc", borderRadius: "5px" }}
              />
              <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ padding: "8px" }} />
              <button onClick={sendMessage} style={{ padding: "8px 15px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                Send
              </button>
            </div>
          </>
        )}
      </div>

      {/* Group Modal */}
      {showGroupModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "400px" }}>
            <h2>Create Group</h2>
            <input
              type="text"
              placeholder="Group Name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "10px", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}
            />
            <input
              type="text"
              placeholder="Search users..."
              value={groupSearchQuery}
              onChange={(e) => setGroupSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "10px", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}
            />
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "5px", marginBottom: "10px", backgroundColor: "#fafafa" }}>
              {filteredGroupUsers.map((u) => (
                <div key={u._id}>
                  <label style={{ display: "block", padding: "5px", borderBottom: "1px solid #eee" }}>
                    <input
                      type="checkbox"
                      value={u._id}
                      checked={selectedUsers.includes(String(u._id))}
                      onChange={(e) => {
                        const id = String(e.target.value);
                        if (selectedUsers.includes(id)) {
                          setSelectedUsers(selectedUsers.filter((uid) => uid !== id));
                        } else {
                          setSelectedUsers([...selectedUsers, id]);
                        }
                      }}
                    />{" "}
                    {u.username} ({u.email})
                  </label>
                </div>
              ))}
            </div>
            <button onClick={createGroup} style={{ backgroundColor: "#007bff", color: "#fff", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px" }}>
              Create
            </button>
            <button onClick={() => setShowGroupModal(false)} style={{ padding: "8px 15px", borderRadius: "5px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ddd" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Private Chat Modal */}
      {showPrivateModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "#fff", padding: "20px", borderRadius: "8px", width: "400px" }}>
            <h2>New Chat</h2>
            <input
              type="text"
              placeholder="Search users..."
              value={privateSearchQuery}
              onChange={(e) => setPrivateSearchQuery(e.target.value)}
              style={{ width: "100%", padding: "8px", marginBottom: "10px", backgroundColor: "#f0f0f0", border: "1px solid #ddd", borderRadius: "4px" }}
            />
            <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #ccc", padding: "5px", marginBottom: "10px", backgroundColor: "#fafafa" }}>
              {filteredPrivateUsers.map((u) => (
                <div key={u._id}>
                  <label style={{ display: "block", padding: "5px", borderBottom: "1px solid #eee" }}>
                    <input
                      type="radio"
                      name="privateUser"
                      value={u._id}
                      checked={selectedPrivateUser === u._id}
                      onChange={(e) => setSelectedPrivateUser(e.target.value)}
                    />{" "}
                    {u.username} ({u.email})
                  </label>
                </div>
              ))}
            </div>
            <button onClick={startPrivateChat} style={{ backgroundColor: "#28a745", color: "#fff", padding: "8px 15px", border: "none", borderRadius: "5px", cursor: "pointer", marginRight: "10px" }}>
              Start
            </button>
            <button onClick={() => setShowPrivateModal(false)} style={{ padding: "8px 15px", borderRadius: "5px", cursor: "pointer", backgroundColor: "#f0f0f0", border: "1px solid #ddd" }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
