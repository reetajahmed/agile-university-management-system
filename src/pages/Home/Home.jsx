import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import "../../styles/home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="home">

        {/* HERO SECTION */}
        <div className="hero">
          <h1>University Management System</h1>
          <p>Manage all university operations in one place</p>
        </div>

        {/* MODULE CARDS */}
        <div className="cards">

          {/* Community */}
          <div 
            className="card" 
            onClick={() => navigate("/community")}
          >
            <h3>Community</h3>
            <p>Messaging & Announcements</p>
          </div>

          {/* Curriculum */}
          <div 
            className="card" 
            onClick={() => navigate("/curriculum")}
          >
            <h3>Curriculum</h3>
            <p>Courses & Academic Content</p>
          </div>

          {/* Staff */}
          <div 
            className="card" 
            onClick={() => navigate("/staff")}
          >
            <h3>Staff</h3>
            <p>Manage Professors & Employees</p>
          </div>

          {/* Facilities */}
          <div 
            className="card" 
            onClick={() => navigate("/facilities")}
          >
            <h3>Facilities</h3>
            <p>Rooms & Resources Booking</p>
          </div>

        </div>

      </div>
    </Layout>
  );
}

export default Home;