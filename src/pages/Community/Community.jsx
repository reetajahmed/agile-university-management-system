import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import "../../styles/community.css";

function Community() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="community-container">

        <h2>Community Module</h2>

        <div className="community-cards">

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

        </div>

      </div>
    </Layout>
  );
}

export default Community;