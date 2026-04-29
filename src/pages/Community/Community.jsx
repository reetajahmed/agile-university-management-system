import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import "../../styles/community.css";

function Community() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="community-container">

        <h2>Communication Center</h2>

        <div className="cards-row top-row">

          {/* Messaging */}
          <div
            className="community-card"
            onClick={() => navigate("/messages")}
          >
            <h3>Messaging</h3>
            <p>Send and receive messages</p>
          </div>

          {/* Announcements */}
          <div
            className="community-card"
            onClick={() => navigate("/announcements")}
          >
            <h3>Announcements</h3>
            <p>View latest updates</p>
          </div>

          {/* Events */}
          <div
            className="community-card"
            onClick={() => navigate("/events")}
          >
            <h3>Events</h3>
            <p>View university events</p>
          </div>

        </div>

        <div className="cards-row bottom-row">

          {/* Meetings */}
          <div
            className="community-card"
            onClick={() => navigate("/meetings")}
          >
            <h3>Meetings</h3>
            <p>Schedule meeting with professor</p>
          </div>

          {/* Progress */}
          <div
            className="community-card"
            onClick={() => navigate("/progress")}
          >
            <h3>Progress</h3>
            <p>View your academic performance</p>
          </div>

        </div>

      </div>
    </Layout>
  );
}

export default Community;