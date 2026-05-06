import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/progress.css";

function Progress() {
  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //GET CURRENT USER
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

  //FETCH COURSES
  const fetchCourses = async () => {
    if (!currentUser) return;

    setLoading(true);

    // FIX FOR PARENT
    const studentId =
      currentUser.role === "parent"
        ? currentUser.child_id
        : currentUser.id;

    // 1. enrollments
    const { data: enrollmentsData, error: e1 } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("student_id", studentId);

    if (e1) {
      console.error(e1);
      setLoading(false);
      return;
    }

    const courseIds = enrollmentsData.map((e) => e.course_id);

    // 2. courses
    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds);

    // 3. progress
    const { data: progressData } = await supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId);

    // 4. merge
    const merged = coursesData.map((course) => {
      const progress = progressData.find(
        (p) => p.course_id === course.id
      );

      return {
        course,
        progress,
      };
    });

    setCourses(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) fetchCourses();
  }, [currentUser]);

  return (
    <Layout>
      <div className="progress-container">
        <h2>My Courses</h2>

        {loading ? (
          <p className="loading">Loading...</p>
        ) : courses.length === 0 ? (
          <p className="no-data">No enrolled courses found</p>
        ) : (
          <div className="progress-grid">
            {courses.map((c) => {
              const progress = c.progress;

              return (
                <div
                  key={c.course.id}
                  className="course-card"
                  onClick={() =>
                    setSelected({
                      ...c,
                      progress: progress || null,
                    })
                  }
                >
                  <div className="course-left">
                    <h3>{c.course?.name}</h3>
                    <p>{c.course?.course_code}</p>
                  </div>

                  <div className="course-right">
                    {progress?.status === "finished" ? (
                      <span className="badge finished">Finished</span>
                    ) : (
                      <span className="badge active">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETAILS PANEL */}
        {selected && (
          <div className="details-panel">
            <h3 className="details-title">{selected.course?.name}</h3>

            <div className="details-grid">
              
              {/* Row 1 */}
              <div className="detail-card">
                <span>Course Code</span>
                <strong>{selected.course?.["Course Code"]}</strong>
              </div>

              <div className="detail-card">
                <span>Hours</span>
                <strong>{selected.course?.["Hours"]}</strong>
              </div>

              {/* Row 2 */}
              <div className="detail-card">
                <span>Midterm</span>
                <strong>
                  {selected.progress?.midterm_grade ?? "Not graded"}
                </strong>
              </div>

              <div className="detail-card">
                <span>Activities</span>
                <strong>
                  {selected.progress?.activities_grade ?? "Not graded"}
                </strong>
              </div>

              {/* Row 3 (Full width) */}
              <div className="detail-card full">
                <span>Status</span>
                <strong>
                  {selected.progress?.status === "finished"
                    ? `Final Grade: ${selected.progress.grade}`
                    : "In Progress"}
                </strong>
              </div>

            </div>

            <button className="close-btn" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Progress;