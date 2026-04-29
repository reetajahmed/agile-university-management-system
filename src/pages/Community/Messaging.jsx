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

  // Get logged-in user
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

  //Get all users
  const fetchUsers = async () => {
    const { data } = await supabase.from("users").select("*");
    setUsers(data);
  };

  // 🔹 Get messages (ONLY related to current user)
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

    if (error) {
      console.log(error);
    } else {
      setMessages(data);
    }

    setLoading(false); 
  };

  // Send message
  const sendMessage = async () => {
    if (!message || !currentUser || !selectedReceiver) return;

    const { error } = await supabase.from("messages").insert([
      {
        sender_id: currentUser.id,
        receiver_id: selectedReceiver,
        content: message,
      },
    ]);

    if (error) {
      console.log(error);
      alert("Error sending message");
      return;
    }

    setMessage("");
    fetchMessages();
  };

  // Load initial data
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  // Load messages AFTER user is known
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (currentUser) {
      fetchMessages();
    }
  }, [currentUser]);

  return (
    <Layout>
      <div className="messaging-container">
        <h2>Messaging</h2>

        {/* Receiver Dropdown */}
        <select
          value={selectedReceiver}
          onChange={(e) => setSelectedReceiver(e.target.value)}
        >
          <option value="">Select Receiver</option>
          {users
            .filter((u) => !currentUser || u.id !== currentUser.id)
            .map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
        </select>

        {/*MESSAGE DISPLAY */}
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

        {/* Input */}
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