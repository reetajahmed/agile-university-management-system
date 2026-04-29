import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/announcements.css";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // 🔥 NEW

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  //Fetch logged-in user
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

  //Fetch announcements
  const fetchAnnouncements = async () => {
    setLoading(true); 

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }

    setLoading(false); 
  };

  //Create announcement (DOCTOR ONLY)
  const createAnnouncement = async () => {
    if (!title || !content) return;

    const { error } = await supabase.from("announcements").insert([
      {
        title,
        content,
      },
    ]);

    if (error) {
      console.log(error);
      alert("Error creating announcement");
      return;
    }

    setTitle("");
    setContent("");
    fetchAnnouncements();
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchAnnouncements();
  }, []);

  return (
    <Layout>
      <div className="announcements-container">
        <h2>Announcements</h2>

        {/* ONLY DOCTOR CAN SEE THIS */}
        {currentUser?.role === "doctor" && (
          <div className="create-announcement">
            <h3>Create Announcement</h3>

            <input
              type="text"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Write announcement content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />

            <button onClick={createAnnouncement}>
              Post Announcement
            </button>
          </div>
        )}

        {/*DISPLAY LOGIC */}
        {loading ? (
          <p className="loading">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="no-data">No announcements available</p>
        ) : (
          <div className="announcements-list">
            {announcements.map((item) => (
              <div key={item.id} className="announcement-card">
                <h3>{item.title}</h3>
                <p>{item.content}</p>

                {item.created_at && (
                  <span className="date">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Announcements;