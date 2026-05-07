import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "../../styles/community.css";

function Community() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
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

    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const isParent = currentUser?.role === "parent";
  const isAdmin = currentUser?.role === "admin";

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="community-container">

        <h2>Communication Center</h2>

        <div className="community-section">

          <div className="section-header">
            <h3>Communication Tools</h3>
            <span>{isParent ? "3 modules" : "5 modules"}</span>
          </div>

          <div className="community-grid">

            <div
              className="community-card"
              onClick={() => navigate("/messages")}
            >
              <h3>Messaging</h3>
              <p>Send and receive messages</p>
            </div>

            <div
              className="community-card"
              onClick={() => navigate("/announcements")}
            >
              <h3>Announcements</h3>
              <p>View latest updates</p>
            </div>

            {!isParent && (
              <div
                className="community-card"
                onClick={() => navigate("/events")}
              >
                <h3>Events</h3>
                <p>View university events</p>
              </div>
            )}

            {!isParent && !isAdmin && (
              <div
                className="community-card"
                onClick={() => navigate("/meetings")}
              >
                <h3>Meetings</h3>
                <p>Schedule meeting with professor</p>
              </div>
            )}

            {currentUser?.role !== "doctor" && !isAdmin && (
              <div
                className="community-card"
                onClick={() => navigate("/progress")}
              >
                <h3>Progress</h3>
                <p>
                  {isParent
                    ? "View your child's academic performance"
                    : "View your academic performance"}
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </Layout>
  );
}

export default Community;