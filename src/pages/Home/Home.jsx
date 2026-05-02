import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import "../../styles/home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="home">

        {/* NAVIGATION - If you want it inside Layout, you can remove this */}
        {/* But keeping it here for now if needed */}

        {/* HERO SECTION */}
        <section className="hero">
          <div className="hero-content">
            <h1>University Management System</h1>
            <p>Streamline all university operations — from academics to administration — in one powerful platform.</p>
          </div>
        </section>

        {/* MODULE CARDS */}
        <section className="dashboard">
          <h2 className="section-title">Quick Access</h2>
          
          <div className="cards">
            
            {/* Community */}
            <div className="card" onClick={() => navigate("/community")}>
              <div className="card-icon">👥</div>
              <h3>Community</h3>
              <p>Messaging &amp; Announcements</p>
            </div>

            {/* Curriculum */}
            <div className="card" onClick={() => navigate("/curriculum")}>
              <div className="card-icon">📚</div>
              <h3>Curriculum</h3>
              <p>Courses &amp; Academic Content</p>
            </div>

            {/* Staff */}
            <div className="card" onClick={() => navigate("/staff")}>
              <div className="card-icon">👔</div>
              <h3>Staff</h3>
              <p>Manage Professors &amp; Employees</p>
            </div>

            {/* Facilities */}
            <div className="card" onClick={() => navigate("/facilities")}>
              <div className="card-icon">🏛️</div>
              <h3>Facilities</h3>
              <p>Rooms &amp; Resources Booking</p>
            </div>

          </div>
        </section>

      </div>
    </Layout>
  );
}

export default Home;