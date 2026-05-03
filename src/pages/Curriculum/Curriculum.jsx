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

  // 🔍 SEARCH
  const [searchTerm, setSearchTerm] = useState("");

  // 🔥 POPUP + MATERIALS
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);

  // 🔹 Fetch everything
  const fetchCurriculum = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (user) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("auth_id", user.id)
        .single();

      setCurrentUser(userData);

      if (userData) {
        await fetchRegistrations(userData.id);
      }
    } else {
      setCurrentUser(null);
      setRegistrations([]);
    }

    const { data: coursesData } = await supabase
      .from("courses")
      .select("*")
      .order("name", { ascending: true });

    setCourses(coursesData || []);
    setLoading(false);
  };

  const fetchRegistrations = async (studentId) => {
    const { data } = await supabase
      .from("enrollments")
      .select(`*, course:courses(*)`)
      .eq("student_id", studentId);

    setRegistrations(data || []);
  };

  const registerCourse = async (courseId) => {
    if (!courseId || !currentUser || saving) return;

    setSaving(true);

    await supabase.from("enrollments").insert([
      {
        student_id: currentUser.id,
        course_id: courseId,
      },
    ]);

    await fetchRegistrations(currentUser.id);
    setSaving(false);
  };

  const dropCourse = async (courseId) => {
    if (!currentUser) return;

    if (!window.confirm("Drop this course?")) return;

    await supabase
      .from("enrollments")
      .delete()
      .eq("student_id", currentUser.id)
      .eq("course_id", courseId);

    await fetchRegistrations(currentUser.id);
  };

  const fetchMaterials = async (course) => {
    const { data } = await supabase
      .from("course_materials")
      .select("*")
      .eq("course_id", course.id);

    setMaterials(data || []);
    setSelectedCourse(course);
  };

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

  // 🔥 FILTER LOGIC (SEARCH)
  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase();

    return (
      course.name?.toLowerCase().includes(term) ||
      course.description?.toLowerCase().includes(term) ||
      course.Instructor?.toLowerCase().includes(term)
    );
  });

  return (
    <Layout>
      <div className="curriculum-container">
        <h2>Curriculum Management</h2>

        {loading ? (
          <p className="loading">Loading curriculum...</p>
        ) : (
          <>
            {/* ================= COURSES ================= */}
            <section className="curriculum-section">
              <div className="section-header">
                <h3>Available Courses</h3>
                <span>{filteredCourses.length} courses</span>
              </div>

              {/* 🔍 SEARCH INPUT */}
              <div className="search-container">
                <input
                  type="text"
                  placeholder="🔍 Search by name, instructor, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-bar"
                />
              </div>

              <div className="course-grid">
                {filteredCourses.length === 0 ? (
                  <p className="no-results">No courses match your search</p>
                ) : (
                  filteredCourses.map((course) => (
                    <div key={course.id} className="course-card">
                      <h4>{course.name}</h4>
                      <p>{course.description}</p>

                      <div className="course-meta">
                        <span>{course["Course Code"]}</span>
                        <span>{course.Hours} hrs</span>
                      </div>

                      <button
                        onClick={() => fetchMaterials(course)}
                        className="view-btn"
                      >
                        View Materials
                      </button>

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
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* ================= REGISTERED ================= */}
            <section className="curriculum-section">
              <h3>My Registered Courses</h3>

              <div className="schedule-list">
                {registrations.map((item) => {
                  const course = item.course;

                  return (
                    <div key={item.id} className="schedule-card">
                      <div>
                        <h4>{course?.name}</h4>
                        <p>{course?.Instructor}</p>
                      </div>

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
            </section>

            {/* ================= SCHEDULE ================= */}
            <section className="curriculum-section">
              <h3>Class Schedule</h3>

              <div className="schedule-list">
                {registrations.map((item) => {
                  const course = item.course;

                  return (
                    <div key={item.id} className="schedule-card">
                      <h4>{course?.name}</h4>

                      <div className="schedule-time">
                        <span>{course?.Day}</span>
                        <strong>{course?.Time}</strong>
                        <small>{course?.Room}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* ================= MODAL ================= */}
        {selectedCourse && (
          <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>{selectedCourse.name}</h2>

              <p>{selectedCourse.description}</p>

              <p><strong>Instructor:</strong> {selectedCourse.Instructor}</p>
              <p><strong>Type:</strong> {selectedCourse.Type}</p>
              <p><strong>Hours:</strong> {selectedCourse.Hours}</p>

              <h3 style={{ marginTop: "20px" }}>Materials</h3>

              {materials.length === 0 ? (
                <p>No materials available</p>
              ) : (
                materials.map((item) => (
                  <div key={item.id} className="material-item">
                    <span className="material-title">{item.title}</span>

                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="material-btn"
                    >
                      Open
                    </a>
                  </div>
                ))
              )}

              <button
                onClick={() => setSelectedCourse(null)}
                className="close-btn"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Curriculum;