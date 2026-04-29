import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/progress.css";

function Progress() {
  const [progress, setProgress] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get logged-in user
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

  // Fetch progress with JOIN (courses)
  const fetchProgress = async () => {
    if (!currentUser) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("student_progress")
      .select(`
        *,
        course:courses(name)
      `)
      .eq("student_id", currentUser.id);

    if (error) {
      console.log(error);
    } else {
      setProgress(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProgress();
    }
  }, [currentUser]);

  return (
    <Layout>
      <div className="progress-container">
        <h2>My Academic Progress</h2>

        {loading ? (
          <p className="loading">Loading progress...</p>
        ) : progress.length === 0 ? (
          <p className="no-data">No progress data available</p>
        ) : (
          <div className="progress-list">
            {progress.map((item) => (
              <div key={item.id} className="progress-card">
                <h3>{item.course?.name}</h3>
                <p>Grade: {item.grade}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Progress;