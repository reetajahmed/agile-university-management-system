import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/messaging.css";

function Messaging() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(true);

  // GET CURRENT USER
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
      return data;
    }
  };

  //GET CONVERSATIONS
  const fetchConversations = async (user) => {
    if (!user) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

    const userIds = new Set();

    data.forEach((msg) => {
      if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
      if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
    });

    const { data: usersData } = await supabase
      .from("users")
      .select("*")
      .in("id", [...userIds]);

    setConversations(usersData || []);
  };

  //GET MESSAGES
  const fetchMessages = async () => {
    if (!currentUser || !selectedUser) return;

    setLoading(true);

    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`
      )
      .order("id", { ascending: true });

    setMessages(data || []);
    setLoading(false);
  };

  //SEND MESSAGE
  const sendMessage = async () => {
    if (!message || !currentUser || !selectedUser) return;

    await supabase.from("messages").insert([
      {
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: message,
      },
    ]);

    setMessage("");
    fetchMessages();
    fetchConversations(currentUser);
  };

  // 🔹 SEARCH USERS (REAL-TIME)
  const searchUser = async (value) => {
    setSearchEmail(value);

    if (!value) {
      setSearchResult([]);
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .ilike("email", `%${value}%`);

    if (!error && data) {
      const filtered = data.filter((u) => u.id !== currentUser?.id);
      setSearchResult(filtered);
    }
  };

  // 🔹 INIT
  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser();
      await fetchConversations(user);
    };
    init();
  }, []);

  // 🔹 LOAD MESSAGES WHEN USER CHANGES
  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  return (
    <Layout>
      <div className="chat-container">

        {/* SIDEBAR */}
        <div className="chat-sidebar">
          <h3>Chats</h3>

          {/* SEARCH */}
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => searchUser(e.target.value)}
            />
          </div>

          {/* SEARCH RESULTS */}
          {searchResult.length > 0 &&
            searchResult.map((user) => (
              <div
                key={user.id}
                className="chat-user"
                onClick={() => {
                  setSelectedUser(user);
                  setSearchResult([]);
                  setSearchEmail("");
                }}
              >
                <div className="chat-avatar">
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <div className="chat-info">
                  <span className="chat-name">{user.name}</span>
                  <span className="chat-last">{user.email}</span>
                </div>
              </div>
            ))}

          {/* CONVERSATIONS */}
          {conversations.map((user) => (
            <div
              key={user.id}
              className={`chat-user ${
                selectedUser?.id === user.id ? "active" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              <div className="chat-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="chat-info">
                <span className="chat-name">{user.name}</span>
                <span className="chat-last">Tap to chat</span>
              </div>
            </div>
          ))}
        </div>

        {/* MAIN CHAT */}
        <div className="chat-main">
          {!selectedUser ? (
            <div className="no-chat">Select a conversation</div>
          ) : (
            <>
              {/* HEADER */}
              <div className="chat-header">
                Chat with {selectedUser.name}
              </div>

              {/* MESSAGES */}
              <div className="messages-list">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;

                    return (
                      <div
                        key={msg.id}
                        className={`message-row ${isMe ? "me" : "other"}`}
                      >
                        <div className="message-bubble">
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* INPUT */}
              <div className="input-area">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message"
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          )}
        </div>

      </div>
    </Layout>
  );
}

export default Messaging;