import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/curriculum.css";

function Curriculum() {
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Fetch all data
  const fetchCurriculum = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      if (error) console.log(error);

      setCurrentUser(userData);

      if (userData) {
        await fetchRegistrations(userData.id);
      }
    } else {
      setCurrentUser(null);
      setRegistrations([]);
    }

    const { data: coursesData, error } = await supabase
      .from("courses")
      .select("*")
      .order("name", { ascending: true });

    if (error) console.log(error);
    else setCourses(coursesData || []);

    setLoading(false);
  };

  // 🔹 Fetch registrations
  const fetchRegistrations = async (studentId) => {
    const { data, error } = await supabase
      .from("enrollments")
      .select(
        `
        *,
        course:courses(*)
      `
      )
      .eq("student_id", studentId);

    if (error) {
      console.log(error);
      return;
    }

    setRegistrations(data || []);
  };

  // 🔹 Register course
  const registerCourse = async (courseId) => {
    if (!courseId || !currentUser || saving) return;

    setSaving(true);

    const { error } = await supabase.from("enrollments").insert([
      {
        student_id: currentUser.id,
        course_id: courseId,
      },
    ]);

    if (error) {
      console.log(error);
      alert("Error registering course");
    } else {
      await fetchRegistrations(currentUser.id);
    }

    setSaving(false);
  };

  // 🔹 DROP COURSE (NEW)
  const dropCourse = async (courseId) => {
    if (!currentUser) return;

    const confirmDrop = window.confirm("Are you sure you want to drop this course?");
    if (!confirmDrop) return;

    const { error } = await supabase
      .from("enrollments")
      .delete()
      .eq("student_id", currentUser.id)
      .eq("course_id", courseId);

    if (error) {
      console.log(error);
      alert("Error dropping course");
    } else {
      await fetchRegistrations(currentUser.id);
    }
  };

  // 🔹 Check registration
  const isRegistered = (courseId) =>
    registrations.some((item) => item.course_id === courseId);

  useEffect(() => {
    fetchCurriculum();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchCurriculum();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Layout>
      <div className="curriculum-container">
        <h2>Curriculum Management</h2>

        {loading ? (
          <p className="loading">Loading curriculum...</p>
        ) : (
          <>
            {/* ================= AVAILABLE COURSES ================= */}
            <section className="curriculum-section">
              <div className="section-header">
                <h3>Available Courses</h3>
                <span>{courses.length} courses</span>
              </div>

              {courses.length === 0 ? (
                <p className="no-data">No courses available</p>
              ) : (
                <div className="course-grid">
                  {courses.map((course) => (
                    <div key={course.id} className="course-card">
                      <h4>{course.name}</h4>
                      <p>{course.description || "No description available"}</p>

                      <div className="course-meta">
                        {course.code && <span>{course.code}</span>}
                        {course.credits && (
                          <span>{course.credits} Credits</span>
                        )}
                      </div>

                      {currentUser && (
                        <button
                          onClick={() => registerCourse(course.id)}
                          disabled={isRegistered(course.id) || saving}
                          className="register-btn"
                        >
                          {isRegistered(course.id)
                            ? "Registered"
                            : saving
                            ? "Registering..."
                            : "Register"}
                        </button>
                      )}

                      {!currentUser && (
                        <p className="no-data" style={{ marginTop: "10px" }}>
                          Login to register
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ================= REGISTERED COURSES ================= */}
            <section className="curriculum-section">
              <div className="section-header">
                <h3>My Registered Courses</h3>
                <span>{registrations.length} courses</span>
              </div>

              {registrations.length === 0 ? (
                <p className="no-data">No registered courses yet</p>
              ) : (
                <div className="schedule-list">
                  {registrations.map((item) => {
                    const course = item.course;

                    return (
                      <div key={item.id} className="schedule-card">
                        <div>
                          <h4>{course?.name}</h4>
                          <p>
                            {course?.Instructor || "Instructor not assigned"}
                          </p>
                        </div>

                        {/* 🔥 DROP BUTTON */}
                        <button
                          onClick={() => dropCourse(course.id)}
                          className="drop-btn"
                        >
                          Drop
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ================= CLASS SCHEDULE ================= */}
            <section className="curriculum-section">
              <div className="section-header">
                <h3>Class Schedule</h3>
                <span>{registrations.length} classes</span>
              </div>

              {registrations.length === 0 ? (
                <p className="no-data">No registered classes yet</p>
              ) : (
                <div className="schedule-list">
                  {registrations.map((item) => {
                    const course = item.course;

                    return (
                      <div key={item.id} className="schedule-card">
                        <div>
                          <h4>{course?.name}</h4>
                        </div>

                        <div className="schedule-time">
                          <span>{course?.Day || "TBA"}</span>
                          <strong>{course?.Time || "Time TBA"}</strong>
                          {course?.Room && <small>{course.Room}</small>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

export default Curriculum;