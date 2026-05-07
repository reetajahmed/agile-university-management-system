import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/announcements.css";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("all");

  // FETCH LOGGED-IN USER

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

  // FETCH ANNOUNCEMENTS

  const fetchAnnouncements = async () => {
    if (!currentUser) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .in("target_role", [currentUser.role, "all"])
      .order("id", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }

    setLoading(false);
  };

  // CREATE ANNOUNCEMENT

  const createAnnouncement = async () => {
    if (!title || !content) return;

    const { error } = await supabase.from("announcements").insert([
      {
        title,
        content,
        target_role: targetRole,
      },
    ]);

    if (error) {
      console.log(error);
      alert("Error creating announcement");
      return;
    }

    setTitle("");
    setContent("");
    setTargetRole("all");

    fetchAnnouncements();
  };

  // LOAD USER

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // LOAD ANNOUNCEMENTS AFTER USER LOADS

  useEffect(() => {
    if (currentUser) {
      fetchAnnouncements();
    }
  }, [currentUser]);

  return (
    <Layout>
      <div className="announcements-container">

        <h2>Announcements</h2>

        {/* DOCTOR OR ADMIN CAN CREATE */}

        {(currentUser?.role === "doctor" ||
          currentUser?.role === "admin") && (
          <div className="create-announcement">

            <h3>Create Announcement</h3>

            <input
              type="text"
              placeholder="Announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
            >
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="doctor">Doctors</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>

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

        {/* DISPLAY ANNOUNCEMENTS */}

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

                <div className="announcement-footer">

                  <span className="target-role">
                    {item.target_role === "all"
                      ? "All Users"
                      : item.target_role}
                  </span>

                  {item.created_at && (
                    <span className="date">
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  )}

                </div>

              </div>
            ))}

          </div>
        )}

      </div>
    </Layout>
  );
}

export default Announcements;