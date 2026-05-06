import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/curriculum.css";

const ASSIGNMENT_SUBMISSIONS_BUCKET = "assignment_submissions";

function StudentCurriculum({ currentUser }) {
  const [courses, setCourses] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionFiles, setSubmissionFiles] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const fetchCurriculum = async () => {
    setLoading(true);

    const { data: coursesData } = await supabase
  .from("courses")
  .select(`
    *,
    professor:users!courses_professor_id_fkey(name)
  `)
  .order("name", { ascending: true });

    setCourses(coursesData || []);

    if (currentUser) {
      await fetchRegistrations(currentUser.id, coursesData || []);
    } else {
      setRegistrations([]);
      setAssignments([]);
      setSubmissions([]);
    }

    setLoading(false);
  };

  const fetchRegistrations = async (studentId, courseCatalog = courses) => {
    const { data } = await supabase
      .from("enrollments")
      .select(`*, course:courses(*)`)
      .eq("student_id", studentId);

    setRegistrations(data || []);
    await fetchAssignments(data || [], studentId, courseCatalog);
  };

  const fetchAssignments = async (
    registrationData,
    studentId,
    courseCatalog = courses
  ) => {
    const courseIds = registrationData
      .map((item) => item.course_id || item.course?.id)
      .filter(Boolean);

    const { data: assignmentsData, error } = await supabase
      .from("assignments")
      .select("*")
      .order("deadline", { ascending: true });

    if (error) {
      console.log(error);
      setAssignmentMessage(`Assignments could not load: ${error.message}`);
    }

    const { data: submissionsData } = await supabase
      .from("assignment_submissions")
      .select("*")
      .eq("student_id", studentId);

    const registeredCourseIds = courseIds.map((id) => String(id));
    const allAssignments = assignmentsData || [];
    const registeredAssignments = allAssignments.filter((assignment) =>
      registeredCourseIds.includes(String(assignment.course_id))
    );

    const visibleAssignments =
      registeredAssignments.length > 0 ? registeredAssignments : allAssignments;

    const assignmentsWithCourses = visibleAssignments.map((assignment) => ({
      ...assignment,
      course: courseCatalog.find(
        (course) => String(course.id) === String(assignment.course_id)
      ),
    }));

    setAssignments(assignmentsWithCourses);
    setSubmissions(submissionsData || []);
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

  const submitAssignment = async (assignmentId) => {
    const file = submissionFiles[assignmentId];

    if (!file || !currentUser || submittingId) {
      setAssignmentMessage("Please choose a PDF file before submitting.");
      return;
    }

    if (file.type !== "application/pdf") {
      setAssignmentMessage("Only PDF files are allowed.");
      return;
    }

    setSubmittingId(assignmentId);
    setAssignmentMessage("");

    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, "-");
    const filePath = `${assignmentId}/${currentUser.id}/${Date.now()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(ASSIGNMENT_SUBMISSIONS_BUCKET)
      .upload(filePath, file);

    if (uploadError) {
      console.log(uploadError);
      setAssignmentMessage(`PDF upload failed: ${uploadError.message}`);
      setSubmittingId(null);
      return;
    }

    const { data: fileData } = supabase.storage
      .from(ASSIGNMENT_SUBMISSIONS_BUCKET)
      .getPublicUrl(filePath);

    const { error } = await supabase.from("assignment_submissions").insert([
      {
        assignment_id: assignmentId,
        student_id: currentUser.id,
        file_url: fileData.publicUrl,
        file_name: file.name,
      },
    ]);

    if (error) {
      console.log(error);
      setAssignmentMessage(`PDF was uploaded, but submission was not saved: ${error.message}`);
    } else {
      setSubmissionFiles({ ...submissionFiles, [assignmentId]: null });
      setAssignmentMessage("PDF submitted successfully.");
      await fetchAssignments(registrations, currentUser.id);
    }

    setSubmittingId(null);
  };

  const isRegistered = (courseId) =>
    registrations.some((item) => item.course_id === courseId);

  const hasSubmitted = (assignmentId) =>
    submissions.some((item) => String(item.assignment_id) === String(assignmentId));

  const formatDeadline = (deadline) => {
    if (!deadline) return "No deadline";
    return new Date(deadline).toLocaleDateString();
  };

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
      course.professor?.name?.toLowerCase().includes(term) ||
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

  const weekDays = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const formatTime = (time) => {
    if (!time) return "TBA";
    return time.slice(0, 5);
  };

  const renderCourseCard = (course, showRequired) => (
    <div key={course.id} className="course-card">
      <h4>{course.name}</h4>
      <p>{course.description}</p>
      <p className="course-instructor">
      {course.professor?.name
        ? `Dr. ${course.professor.name}`
        : "No instructor assigned"}      
        </p>

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
                <h3>Assignments</h3>
                <span>{assignments.length} assignments</span>
              </div>

              <div className="materials-list">
                {assignments.length === 0 ? (
                  <p className="no-results">No assignments available</p>
                ) : (
                  assignments.map((assignment) => (
                    <div key={assignment.id} className="assignment-card">
                      <div className="assignment-card-header">
                        <div>
                          <h4>{assignment.title}</h4>
                          <p>
                            {assignment.course?.name || "Registered course"}{" "}
                            {assignment.course?.["Course Code"]}
                          </p>
                        </div>

                        <span className="deadline-badge">
                          {formatDeadline(assignment.deadline)}
                        </span>
                      </div>

                      {hasSubmitted(assignment.id) ? (
                        <p className="submitted-label">Submitted</p>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="application/pdf"
                            className="assignment-file-input"
                            onChange={(e) =>
                              setSubmissionFiles({
                                ...submissionFiles,
                                [assignment.id]: e.target.files[0],
                              })
                            }
                          />

                          <button
                            className="register-btn submit-response-btn"
                            onClick={() => submitAssignment(assignment.id)}
                            disabled={submittingId === assignment.id}
                          >
                            {submittingId === assignment.id
                              ? "Submitting..."
                              : "Submit Response"}
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {assignmentMessage && (
                <p className="form-message">{assignmentMessage}</p>
              )}
            </section>

            <section className="curriculum-section">
              <div className="section-header">
                <h3>Class Schedule</h3>
                <span>{registrations.length} classes</span>
              </div>

              {Object.keys(groupedSchedule).length === 0 ? (
                <p className="no-results">No schedule available</p>
              ) : (
                <div className="schedule-board">
                  {weekDays.map((day) => {
                    const dayCourses = groupedSchedule[day] || [];

                    return (
                      <div key={day} className="schedule-column">
                        <div className="schedule-column-header">{day}</div>

                        <div className="schedule-column-body">
                          {dayCourses.length === 0 ? (
                            <p className="empty-day">No classes</p>
                          ) : (
                            dayCourses
                              .sort((a, b) => (a.Time || "").localeCompare(b.Time || ""))
                              .map((course) => (
                                <div key={course.id} className="schedule-class-card">
                                  <span className="schedule-time-modern">
                                    {formatTime(course.Time)}
                                  </span>

                                  <h5>{course.name}</h5>

                                  <span className="schedule-room">
                                    {course.Room || "Room TBA"}
                                  </span>
                                </div>
                              ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                        <p>{course?.professor?.name || "No instructor assigned"}</p>
                      </div>

                      <div className="registered-actions">
                        <button
                          onClick={() => fetchMaterials(course)}
                          className="view-btn small-action"
                          disabled={!course}
                        >
                          View Materials
                        </button>

                        <button
                          onClick={() => dropCourse(course?.id)}
                          className="drop-btn"
                          disabled={!course}
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

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

          </>
        )}

        {selectedCourse && (
          <div className="modal-overlay" onClick={() => setSelectedCourse(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{selectedCourse.name}</h2>
              <p>{selectedCourse.description}</p>
              <p>
                <strong>Instructor:</strong>{" "}
                {selectedCourse.professor?.name || "No instructor assigned"}
              </p>
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
