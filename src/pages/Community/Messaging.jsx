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
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorPopup, setErrorPopup] = useState("");

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

  const searchUser = async () => {
    if (!searchEmail) return;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("email", searchEmail)
      .single();

    if (data && data.id !== currentUser.id) {
      setSearchResult(data);
    } else {
      setSearchResult(null);
      setErrorPopup("User not found");
    }
  };

  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser();
      await fetchConversations(user);
    };
    init();
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [selectedUser]);

  return (
    <Layout>
      <div className="chat-container">

        {/* LEFT: Conversations */}
        <div className="chat-sidebar">
          <h3>Chats</h3>

          <div className="search-box">
            <input
              type="email"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <button onClick={searchUser}>Search</button>
          </div>

          {searchResult && (
            <div
              className="chat-user"
              onClick={() => {
                setSelectedUser(searchResult);
                setSearchResult(null);
              }}
            >
              {searchResult.name}
            </div>
          )}

          {conversations.map((user) => (
            <div
              key={user.id}
              className={`chat-user ${
                selectedUser?.id === user.id ? "active" : ""
              }`}
              onClick={() => setSelectedUser(user)}
            >
              {user.name}
            </div>
          ))}
        </div>

        {/* RIGHT: Messages */}
        <div className="chat-main">
          {!selectedUser ? (
            <p className="no-chat">Select a conversation</p>
          ) : (
            <>
              <div className="chat-header">
                Chat with {selectedUser.name}
              </div>

              <div className="messages-list">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message ${
                        msg.sender_id === currentUser.id
                          ? "sent"
                          : "received"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
              </div>

              <div className="input-area">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type message..."
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          )}
        </div>

      </div>
      {errorPopup && (
      <div className="popup-overlay">
        <div className="popup">
          <p>{errorPopup}</p>
          <button onClick={() => setErrorPopup("")}>OK</button>
        </div>
      </div>
    )}
    </Layout>
  );
}

export default Messaging;