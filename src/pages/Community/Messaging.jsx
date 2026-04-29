import { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Button from "../../components/Button";
import { supabase } from "../../services/supabaseClient";
import "../../styles/messaging.css";

function Messaging() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const fetchMessages = async () => {
    const { data } = await supabase.from("messages").select("*");
    setMessages(data);
  };

  useEffect(() => {
    fetchMessages();
  }, []);

    const sendMessage = async () => {
    const { data, error } = await supabase.from("messages").insert([
        {
        sender_id: 1,
        receiver_id: 2,
        content: message,
        },
    ]);

    console.log("DATA:", data);
    console.log("ERROR:", error);
    };
  return (
    <Layout>
      <div className="messaging-container">
        <h2>Messaging</h2>

        <div className="input-section">
          <input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button text="Send" onClick={sendMessage} />
        </div>

        <div className="messages-list">
          {messages.map((msg) => (
            <div className="message-card" key={msg.id}>
              <p>{msg.content}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Messaging;