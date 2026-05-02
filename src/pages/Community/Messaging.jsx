import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/messaging.css";

function Messaging() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      setCurrentUser(data);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*");
    setUsers(data);
  };

  const fetchMessages = async () => {
    if (!currentUser) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`
      )
      .order("id", { ascending: true });

    if (!error) {
      setMessages(data);
    }

    setLoading(false);
  };

  const sendMessage = async () => {
    if (!message || !currentUser || !selectedReceiver) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: currentUser.id,
        receiver_id: selectedReceiver,
        content: message,
      },
    ]);

    if (!error) {
      setMessage("");
      fetchMessages();
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMessages();
    }
  }, [currentUser]);

  const filteredUsers = users.filter((u) => {
    if (!currentUser || u.id === currentUser.id) return false;

    if (currentUser.role === "student") {
      return u.role === "doctor";
    }

    if (currentUser.role === "parent") {
      return u.role === "doctor";
    }

    if (currentUser.role === "doctor") {
      return true;
    }

    return false;
  });

  return (
    <Layout>
      <div className="messaging-container">
        <h2>Messaging</h2>

        <select
          value={selectedReceiver}
          onChange={(e) => setSelectedReceiver(e.target.value)}
        >
          <option value="">Select Receiver</option>
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>

        <div className="messages-list">
          {loading ? (
            <p className="loading">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="no-data">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-card ${
                  msg.sender_id === currentUser?.id
                    ? "message-sent"
                    : "message-received"
                }`}
              >
                <p>{msg.content}</p>

                <div className="message-info">
                  {msg.sender_id === currentUser?.id
                    ? "You"
                    : "Other user"}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="input-section">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </Layout>
  );
}

export default Messaging;