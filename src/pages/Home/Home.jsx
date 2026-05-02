import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";
import "../../styles/home.css";

function Home() {
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

  useEffect(() => {
    if (!loading && currentUser?.role === "parent") {
      navigate("/community");
    }
  }, [currentUser, loading, navigate]);

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="home">

        <section className="hero">
          <div className="hero-content">
            <h1>University Management System</h1>
            <p>
              Streamline all university operations — from academics to administration — in one powerful platform.
            </p>
          </div>
        </section>

        <section className="dashboard">
          <h2 className="section-title">Quick Access</h2>

          <div className="cards">

            <div className="card" onClick={() => navigate("/community")}>
              <div className="card-icon">👥</div>
              <h3>Community</h3>
              <p>Messaging & Announcements</p>
            </div>

            {currentUser?.role !== "parent" && (
              <>
                <div className="card" onClick={() => navigate("/curriculum")}>
                  <div className="card-icon">📚</div>
                  <h3>Curriculum</h3>
                  <p>Courses & Academic Content</p>
                </div>

                <div className="card" onClick={() => navigate("/staff")}>
                  <div className="card-icon">👔</div>
                  <h3>Staff</h3>
                  <p>Manage Professors & Employees</p>
                </div>

                <div className="card" onClick={() => navigate("/facilities")}>
                  <div className="card-icon">🏛️</div>
                  <h3>Facilities</h3>
                  <p>Rooms & Resources Booking</p>
                </div>
              </>
            )}

          </div>
        </section>

      </div>
    </Layout>
  );
}

export default Home;