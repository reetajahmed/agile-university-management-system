import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/curriculum.css";

function StudentCurriculum({ currentUser }) {
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);

  const fetchCurriculum = async () => {
    setLoading(true);

    if (currentUser) {
      await fetchRegistrations(currentUser.id);
    } else {
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
    const course = courses.find((item) => item.id === courseId);

    if (!courseId || !currentUser || saving || !course) return;

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
    if (!courseId || !currentUser) return;
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

  const getCourseType = (course) => course?.Type || "Uncategorized";

  const isElectiveCourse = (course) =>
    getCourseType(course).toLowerCase() === "elective";

  const isCoreCourse = (course) =>
    getCourseType(course).toLowerCase() === "core";

  useEffect(() => {
    fetchCurriculum();
  }, [currentUser]);

  const filteredCourses = courses.filter((course) => {
    const term = searchTerm.toLowerCase();

    return (
      course.name?.toLowerCase().includes(term) ||
      course.description?.toLowerCase().includes(term) ||
      course.Instructor?.toLowerCase().includes(term) ||
      course["Course Code"]?.toLowerCase().includes(term) ||
      course.Type?.toLowerCase().includes(term)
    );
  });

  const coreCourses = filteredCourses.filter(isCoreCourse);
  const electiveCourses = filteredCourses.filter(isElectiveCourse);
  const otherCourses = filteredCourses.filter(
    (course) => !isCoreCourse(course) && !isElectiveCourse(course)
  );

  const groupedSchedule = registrations.reduce((acc, item) => {
    const course = item.course;
    if (!course) return acc;

    const day = course.Day || "Other";

    if (!acc[day]) acc[day] = [];
    acc[day].push(course);

    return acc;
  }, {});

  const renderCourseCard = (course, showRequired) => (
    <div key={course.id} className="course-card">
      <h4>{course.name}</h4>
      <p>{course.description}</p>

      <div className="course-meta">
        <span>{course["Course Code"]}</span>
        <span>{course.Hours} hrs</span>
        <span className={`type-badge ${isCoreCourse(course) ? "core-type" : "elective-type"}`}>
          {getCourseType(course)}
        </span>
        {showRequired && <span className="required-badge">Required</span>}
      </div>

      <button onClick={() => fetchMaterials(course)} className="view-btn">
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
  );

  return (
    <Layout>
      <div className="curriculum-container">
        <h2>Curriculum Management</h2>

        {loading ? (
          <p className="loading">Loading curriculum...</p>
        ) : (
          <>
            <section className="curriculum-section">
              <div className="section-header">
                <h3>Available Courses</h3>
                <span>{filteredCourses.length} courses</span>
              </div>

              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-bar"
                />
              </div>

              <div className="course-category">
                <h4>Core Courses</h4>
                <p>Required subjects</p>
              </div>

              <div className="course-grid">
                {coreCourses.length === 0 ? (
                  <p className="no-results">No core courses available</p>
                ) : (
                  coreCourses.map((course) => renderCourseCard(course, true))
                )}
              </div>

              <div className="course-category">
                <h4>Elective Courses</h4>
                <p>Choose electives for registration</p>
              </div>

              <div className="course-grid">
                {electiveCourses.length === 0 ? (
                  <p className="no-results">No elective courses available</p>
                ) : (
                  electiveCourses.map((course) => renderCourseCard(course, false))
                )}
              </div>

              {otherCourses.length > 0 && (
                <>
                  <div className="course-category">
                    <h4>Other Courses</h4>
                    <p>Courses without Core or Elective type</p>
                  </div>

                  <div className="course-grid">
                    {otherCourses.map((course) => renderCourseCard(course, false))}
                  </div>
                </>
              )}
            </section>

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
                        onClick={() => dropCourse(course?.id)}
                        className="drop-btn"
                        disabled={!course}
                      >
                        Drop
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="curriculum-section">
              <h3>Class Schedule</h3>

              {Object.keys(groupedSchedule).length === 0 ? (
                <p className="no-results">No schedule available</p>
              ) : (
                Object.keys(groupedSchedule).map((day) => (
                  <div key={day} className="schedule-day">
                    <h4 className="schedule-day-title">{day}</h4>

                    {groupedSchedule[day].map((course) => (
                      <div key={course.id} className="schedule-card-modern">
                        <div className="schedule-left">
                          <h5>{course.name}</h5>
                          <span className="schedule-room">{course.Room}</span>
                        </div>

                        <div className="schedule-right">
                          <span className="schedule-time-modern">{course.Time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </section>
          </>
        )}

        {selectedCourse && (
          <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{selectedCourse.name}</h2>
              <p>{selectedCourse.description}</p>
              <p><strong>Instructor:</strong> {selectedCourse.Instructor}</p>
              <p><strong>Type:</strong> {selectedCourse.Type}</p>
              <p><strong>Hours:</strong> {selectedCourse.Hours}</p>

              <h3 className="materials-title">Materials</h3>

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

              <button onClick={() => setSelectedCourse(null)} className="close-btn">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default StudentCurriculum;
