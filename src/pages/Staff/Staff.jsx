import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import "../../styles/staff.css";
import Layout from "../../components/Layout";
// =============================================================================
// SERVICES
// =============================================================================

async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();
  if (error || !data) return null;
  return data;
}

async function getProfessors() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("role", "doctor")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

async function addProfessor(professorData) {
  const { data, error } = await supabase
    .from("users")
    .insert([{ ...professorData, role: "doctor" }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateProfessor(auth_id, updates) {
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("auth_id", auth_id)
    .select();
  if (error) throw error;
  if (!data || data.length === 0) throw new Error(`No professor found with auth_id ${auth_id}`);
  return data[0];
}

async function getCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

async function getEnrollmentsByProfessor(professorId) {
  const { data, error } = await supabase
    .from("enrollments")
    .select("*, courses(*)")
    .eq("student_id", professorId);
  if (error) throw error;
  return data;
}

async function assignCourse(professorId, courseId) {
  const { data: existing } = await supabase
    .from("enrollments")
    .select("id")
    .eq("student_id", professorId)
    .eq("course_id", courseId)
    .single();
  if (existing) throw new Error("Professor is already assigned to this course.");
  const { data, error } = await supabase
    .from("enrollments")
    .insert([{ student_id: professorId, course_id: courseId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function unassignCourse(professorId, courseId) {
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("student_id", professorId)
    .eq("course_id", courseId);
  if (error) throw error;
}

// --- Research ---
async function getResearch(professorId) {
  const { data, error } = await supabase
    .from("research_publications")
    .select("*")
    .eq("professor_id", professorId)
    .order("published_date", { ascending: false });
  if (error) throw error;
  return data;
}

async function addResearch(professorId, researchData) {
  const { data, error } = await supabase
    .from("research_publications")
    .insert([{ ...researchData, professor_id: professorId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteResearch(id) {
  const { error } = await supabase.from("research_publications").delete().eq("id", id);
  if (error) throw error;
}

// --- Professional Activities ---
async function getActivities(professorId) {
  const { data, error } = await supabase
    .from("professional_activities")
    .select("*")
    .eq("professor_id", professorId)
    .order("activity_date", { ascending: false });
  if (error) throw error;
  return data;
}

async function addActivity(professorId, activityData) {
  const { data, error } = await supabase
    .from("professional_activities")
    .insert([{ ...activityData, professor_id: professorId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteActivity(id) {
  const { error } = await supabase.from("professional_activities").delete().eq("id", id);
  if (error) throw error;
}

// --- Payroll ---
async function getPayroll(professorId) {
  const { data, error } = await supabase
    .from("payroll")
    .select("*")
    .eq("professor_id", professorId)
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return data;
}

async function getAllPayroll() {
  const { data, error } = await supabase
    .from("payroll")
    .select("*, users(name, email)")
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return data;
}

async function addPayroll(professorId, payrollData) {
  const { data, error } = await supabase
    .from("payroll")
    .insert([{ ...payrollData, professor_id: professorId }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Leave Requests ---
async function getLeaveRequests(professorId) {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("professor_id", professorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getAllLeaveRequests() {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users(name, email)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function addLeaveRequest(professorId, leaveData) {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert([{ ...leaveData, professor_id: professorId, status: "Pending" }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateLeaveStatus(id, status) {
  const { error } = await supabase
    .from("leave_requests")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// =============================================================================
// STAFF TABLE COMPONENT
// =============================================================================

function StaffTable({ professors, onView, onEdit, onAssign, isAdmin }) {
  const [search, setSearch] = useState("");

  const filtered = professors.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())
  );

  const initials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "P";

  return (
    <div className="staff-table-wrapper">
      <div className="staff-search-bar">
        <span className="staff-search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search professors by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="staff-search-input"
        />
        {search && (
          <button className="staff-search-clear" onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="staff-empty">
          <div className="staff-empty-icon">👨‍🏫</div>
          <p>{search ? "No professors match your search." : "No professors added yet."}</p>
        </div>
      ) : (
        <table className="staff-table">
          <thead>
            <tr>
              <th>Professor</th>
              <th>Email</th>
              <th>ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((prof) => (
              <tr key={prof.id} className="staff-table-row" onClick={() => onView(prof)}>
                <td>
                  <div className="staff-name-cell">
                    <div className="staff-avatar-small">{initials(prof.name)}</div>
                    <span className="staff-name">{prof.name}</span>
                  </div>
                </td>
                <td className="staff-email">{prof.email || "—"}</td>
                <td className="staff-id">#{prof.id}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="staff-action-buttons">
                    <button className="btn-action btn-view" onClick={() => onView(prof)}>View</button>
                    {isAdmin && (
                      <>
                        <button className="btn-action btn-edit" onClick={() => onEdit(prof)}>Edit</button>
                        <button className="btn-action btn-assign" onClick={() => onAssign(prof)}>Assign</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="staff-table-footer">
        Showing {filtered.length} of {professors.length} professors
      </div>
    </div>
  );
}

// =============================================================================
// STAFF CARD COMPONENT (View Modal)
// =============================================================================

function StaffCard({ professor, onEdit, onAssign, onClose, isAdmin, isDoctor, currentUser, onPerformance, onPayroll }) {
  // All hooks at the top
  const [activeTab, setActiveTab] = useState("info");
  const [research, setResearch] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (activeTab === "research" || activeTab === "activities") {
      setLoadingData(true);
      Promise.all([getResearch(professor.id), getActivities(professor.id)])
        .then(([r, a]) => { setResearch(r); setActivities(a); })
        .catch(console.error)
        .finally(() => setLoadingData(false));
    }
  }, [activeTab, professor.id]);

  // Early return after hooks
  if (!professor) return null;

  const initials = professor.name
    ? professor.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "P";

  const isOwnProfile = currentUser?.id === professor.id;
  const showPerformancePayroll = isAdmin || (isDoctor && isOwnProfile);

  return (
    <div className="staff-card-overlay" onClick={onClose}>
      <div className="staff-card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, width: "95%" }}>
        <div className="staff-card-header">
          <div className="staff-avatar-large">{initials}</div>
          <div className="staff-card-title">
            <h2>{professor.name}</h2>
            <span className="staff-role-badge">Professor</span>
          </div>
          <button className="staff-close-btn" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 16 }}>
          {["info", "research", "activities"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                background: "none",
                color: activeTab === tab ? "#3b82f6" : "#64748b",
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {tab === "activities" ? "Development" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "info" && (
          <div className="staff-card-body">
            <div className="staff-detail-row">
              <span className="staff-detail-label">Email</span>
              <span className="staff-detail-value">{professor.email || <em className="staff-not-provided">Not provided</em>}</span>
            </div>
            <div className="staff-detail-row">
              <span className="staff-detail-label">ID</span>
              <span className="staff-detail-value">#{professor.id}</span>
            </div>
            <div className="staff-detail-row">
              <span className="staff-detail-label">Role</span>
              <span className="staff-detail-value staff-capitalize">{professor.role}</span>
            </div>
          </div>
        )}

        {activeTab === "research" && (
          <div style={{ padding: "0 8px" }}>
            {loadingData ? <p>Loading...</p> : research.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>No research publications yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {research.map((r) => (
                  <li key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{r.title}</div>
                    <div style={{ color: "#64748b", fontSize: 13, margin: "4px 0" }}>{r.description}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{r.published_date}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "activities" && (
          <div style={{ padding: "0 8px" }}>
            {loadingData ? <p>Loading...</p> : activities.length === 0 ? (
              <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>No activities logged yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {activities.map((a) => (
                  <li key={a.id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.title}</span>
                      <span style={{ fontSize: 12, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 99 }}>{a.activity_type}</span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 13, margin: "4px 0" }}>{a.description}</div>
                    <div style={{ color: "#94a3b8", fontSize: 12 }}>{a.activity_date}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isAdmin && (
          <div className="staff-card-actions" style={{ marginTop: 16 }}>
            <button className="btn-primary" onClick={() => onEdit(professor)}>Edit Info</button>
            <button className="btn-secondary" onClick={() => onAssign(professor)}>Assign Course</button>
          </div>
        )}

        {showPerformancePayroll && (
          <div className="staff-card-actions" style={{ marginTop: 8, borderTop: "1px solid #e5e7eb" }}>
            <button className="btn-action btn-view" onClick={() => onPerformance(professor)}>Performance Tracking</button>
            <button className="btn-action btn-assign" onClick={() => onPayroll(professor)}>Payroll & Leave</button>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STAFF FORM COMPONENT (Add/Edit)
// =============================================================================

function StaffForm({ professor, onSubmit, onClose, loading }) {
  const isEdit = !!professor;
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (professor) setForm({ name: professor.name || "", email: professor.email || "" });
  }, [professor]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim() || !form.email.includes("@")) return setError("A valid email is required.");
    onSubmit(form);
  };

  return (
    <div className="staff-card-overlay" onClick={onClose}>
      <div className="staff-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="staff-form-header">
          <h2>{isEdit ? "Edit Professor" : "Add New Professor"}</h2>
          <button className="staff-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="staff-form-body">
          {error && <div className="staff-alert staff-alert-error">{error}</div>}
          <div className="staff-form-group">
            <label htmlFor="name">Full Name *</label>
            <input id="name" name="name" type="text" placeholder="e.g. Dr. Sarah Johnson" value={form.name} onChange={handleChange} className="staff-input" autoFocus />
          </div>
          <div className="staff-form-group">
            <label htmlFor="email">Email Address *</label>
            <input id="email" name="email" type="email" placeholder="e.g. sarah.johnson@university.edu" value={form.email} onChange={handleChange} className="staff-input" />
          </div>
          <div className="staff-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? "Saving..." : isEdit ? "Save Changes" : "Add Professor"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// ASSIGN COURSE MODAL
// =============================================================================

function AssignCourseModal({ professor, onClose }) {
  const [courses, setCourses] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [allCourses, enrollments] = await Promise.all([getCourses(), getEnrollmentsByProfessor(professor.id)]);
        setCourses(allCourses);
        setAssigned(enrollments.map((e) => e.course_id));
      } catch (err) {
        setMessage({ type: "error", text: err.message });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [professor.id]);

  const handleToggle = async (courseId) => {
    setActionLoading(courseId);
    setMessage(null);
    try {
      if (assigned.includes(courseId)) {
        await unassignCourse(professor.id, courseId);
        setAssigned((prev) => prev.filter((id) => id !== courseId));
        setMessage({ type: "success", text: "Course unassigned successfully." });
      } else {
        await assignCourse(professor.id, courseId);
        setAssigned((prev) => [...prev, courseId]);
        setMessage({ type: "success", text: "Course assigned successfully." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="staff-card-overlay" onClick={onClose}>
      <div className="staff-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="staff-form-header">
          <div>
            <h2>Assign Courses</h2>
            <p className="staff-modal-subtitle">Managing courses for <strong>{professor.name}</strong></p>
          </div>
          <button className="staff-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="staff-assign-body">
          {message && (
            <div className={`staff-alert ${message.type === "success" ? "staff-alert-success" : "staff-alert-error"}`}>
              {message.text}
            </div>
          )}
          {loading ? <div className="staff-loading">Loading courses...</div> : courses.length === 0 ? (
            <div className="staff-empty"><p>No courses found.</p></div>
          ) : (
            <ul className="staff-course-list">
              {courses.map((course) => {
                const isAssigned = assigned.includes(course.id);
                const isLoading = actionLoading === course.id;
                return (
                  <li key={course.id} className="staff-course-item">
                    <div className="staff-course-info">
                      <span className="staff-course-name">{course.name}</span>
                      {course.description && <span className="staff-course-desc">{course.description}</span>}
                    </div>
                    <button
                      className={`btn-toggle ${isAssigned ? "btn-toggle-remove" : "btn-toggle-add"}`}
                      onClick={() => handleToggle(course.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? "..." : isAssigned ? "Assigned" : "Assign"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="staff-form-actions">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PERFORMANCE TRACKING MODAL (US4) — Doctor & Admin
// =============================================================================

function PerformanceModal({ professor, currentUser, isAdmin, isDoctor, onClose }) {
  // All hooks at the top - NO conditional returns before hooks
  const [activeTab, setActiveTab] = useState("research");
  const [research, setResearch] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const [researchForm, setResearchForm] = useState({ title: "", description: "", published_date: "" });
  const [activityForm, setActivityForm] = useState({ title: "", activity_type: "Conference", description: "", activity_date: "" });
  const [showResearchForm, setShowResearchForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [professor.id]);

  async function loadData() {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([getResearch(professor.id), getActivities(professor.id)]);
      setResearch(r);
      setActivities(a);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddResearch(e) {
    e.preventDefault();
    if (!researchForm.title || !researchForm.published_date) return setMessage({ type: "error", text: "Title and date are required." });
    setSaving(true);
    try {
      await addResearch(professor.id, researchForm);
      setResearchForm({ title: "", description: "", published_date: "" });
      setShowResearchForm(false);
      setMessage({ type: "success", text: "Research added successfully." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteResearch(id) {
    if (!window.confirm("Delete this publication?")) return;
    try {
      await deleteResearch(id);
      setMessage({ type: "success", text: "Deleted successfully." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function handleAddActivity(e) {
    e.preventDefault();
    if (!activityForm.title || !activityForm.activity_date) return setMessage({ type: "error", text: "Title and date are required." });
    setSaving(true);
    try {
      await addActivity(professor.id, activityForm);
      setActivityForm({ title: "", activity_type: "Conference", description: "", activity_date: "" });
      setShowActivityForm(false);
      setMessage({ type: "success", text: "Activity logged successfully." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteActivity(id) {
    if (!window.confirm("Delete this activity?")) return;
    try {
      await deleteActivity(id);
      setMessage({ type: "success", text: "Deleted successfully." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  const isOwnProfile = currentUser?.id === professor.id;
  const canEdit = isAdmin || (isDoctor && isOwnProfile);

  const tabStyle = (tab) => ({
    padding: "8px 18px", border: "none", cursor: "pointer", background: "none",
    borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
    color: activeTab === tab ? "#3b82f6" : "#64748b",
    fontWeight: activeTab === tab ? 600 : 400,
  });

  return (
    <div className="staff-card-overlay" onClick={onClose}>
      <div className="staff-form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: "95%", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="staff-form-header">
          <div>
            <h2>Performance Tracking</h2>
            <p className="staff-modal-subtitle"><strong>{professor.name}</strong></p>
          </div>
          <button className="staff-close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`staff-alert ${message.type === "success" ? "staff-alert-success" : "staff-alert-error"}`} style={{ margin: "0 0 12px" }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 16 }}>
          <button style={tabStyle("research")} onClick={() => setActiveTab("research")}>Research</button>
          <button style={tabStyle("activities")} onClick={() => setActiveTab("activities")}>Development</button>
        </div>

        {loading ? <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading...</p> : (
          <>
            {activeTab === "research" && (
              <div>
                {canEdit && (
                  <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => setShowResearchForm(!showResearchForm)}>
                    {showResearchForm ? "Cancel" : "+ Add Publication"}
                  </button>
                )}
                {showResearchForm && (
                  <form onSubmit={handleAddResearch} style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <div className="staff-form-group">
                      <label>Title *</label>
                      <input className="staff-input" value={researchForm.title} onChange={(e) => setResearchForm(p => ({ ...p, title: e.target.value }))} placeholder="Publication title" />
                    </div>
                    <div className="staff-form-group">
                      <label>Description</label>
                      <textarea className="staff-input" value={researchForm.description} onChange={(e) => setResearchForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" rows={3} style={{ resize: "vertical" }} />
                    </div>
                    <div className="staff-form-group">
                      <label>Published Date *</label>
                      <input className="staff-input" type="date" value={researchForm.published_date} onChange={(e) => setResearchForm(p => ({ ...p, published_date: e.target.value }))} />
                    </div>
                    <div className="staff-form-actions">
                      <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </form>
                )}
                {research.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>No research publications yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {research.map((r) => (
                      <li key={r.id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>{r.title}</div>
                          <div style={{ color: "#64748b", fontSize: 13, margin: "4px 0" }}>{r.description}</div>
                          <div style={{ color: "#94a3b8", fontSize: 12 }}>{r.published_date}</div>
                        </div>
                        {canEdit && (
                          <button onClick={() => handleDeleteResearch(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>🗑</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "activities" && (
              <div>
                {canEdit && (
                  <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => setShowActivityForm(!showActivityForm)}>
                    {showActivityForm ? "Cancel" : "+ Log Activity"}
                  </button>
                )}
                {showActivityForm && (
                  <form onSubmit={handleAddActivity} style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <div className="staff-form-group">
                      <label>Title *</label>
                      <input className="staff-input" value={activityForm.title} onChange={(e) => setActivityForm(p => ({ ...p, title: e.target.value }))} placeholder="Activity title" />
                    </div>
                    <div className="staff-form-group">
                      <label>Type</label>
                      <select className="staff-input" value={activityForm.activity_type} onChange={(e) => setActivityForm(p => ({ ...p, activity_type: e.target.value }))}>
                        <option>Conference</option>
                        <option>Training</option>
                        <option>Workshop</option>
                        <option>Seminar</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="staff-form-group">
                      <label>Description</label>
                      <textarea className="staff-input" value={activityForm.description} onChange={(e) => setActivityForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description" rows={3} style={{ resize: "vertical" }} />
                    </div>
                    <div className="staff-form-group">
                      <label>Date *</label>
                      <input className="staff-input" type="date" value={activityForm.activity_date} onChange={(e) => setActivityForm(p => ({ ...p, activity_date: e.target.value }))} />
                    </div>
                    <div className="staff-form-actions">
                      <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </form>
                )}
                {activities.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>No activities logged yet.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {activities.map((a) => (
                      <li key={a.id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>{a.title}</span>
                            <span style={{ fontSize: 12, background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: 99 }}>{a.activity_type}</span>
                          </div>
                          <div style={{ color: "#64748b", fontSize: 13, margin: "4px 0" }}>{a.description}</div>
                          <div style={{ color: "#94a3b8", fontSize: 12 }}>{a.activity_date}</div>
                        </div>
                        {canEdit && (
                          <button onClick={() => handleDeleteActivity(a.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 }}>🗑</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// PAYROLL & LEAVE MODAL (US5) — Doctor & Admin
// =============================================================================

function PayrollLeaveModal({ professor, currentUser, isAdmin, isDoctor, onClose }) {
  // All hooks at the top - NO conditional returns before hooks
  const [activeTab, setActiveTab] = useState("payroll");
  const [payroll, setPayroll] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const [leaveForm, setLeaveForm] = useState({ start_date: "", end_date: "", reason: "" });
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [payrollForm, setPayrollForm] = useState({ amount: "", payment_date: "", notes: "" });
  const [showPayrollForm, setShowPayrollForm] = useState(false);

  const isOwnProfile = currentUser?.id === professor.id;
  const canView = isAdmin || (isDoctor && isOwnProfile);

  useEffect(() => {
    if (canView) {
      loadData();
    }
  }, [professor.id, canView]);

  async function loadData() {
    setLoading(true);
    try {
      const [p, l] = await Promise.all([getPayroll(professor.id), getLeaveRequests(professor.id)]);
      setPayroll(p);
      setLeaves(l);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLeave(e) {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) return setMessage({ type: "error", text: "All fields are required." });
    setSaving(true);
    try {
      await addLeaveRequest(professor.id, leaveForm);
      setLeaveForm({ start_date: "", end_date: "", reason: "" });
      setShowLeaveForm(false);
      setMessage({ type: "success", text: "Leave request submitted." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleLeaveStatus(id, status) {
    try {
      await updateLeaveStatus(id, status);
      setMessage({ type: "success", text: `Leave request ${status.toLowerCase()}.` });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function handleAddPayroll(e) {
    e.preventDefault();
    if (!payrollForm.amount || !payrollForm.payment_date) return setMessage({ type: "error", text: "Amount and date are required." });
    setSaving(true);
    try {
      await addPayroll(professor.id, payrollForm);
      setPayrollForm({ amount: "", payment_date: "", notes: "" });
      setShowPayrollForm(false);
      setMessage({ type: "success", text: "Payroll record added." });
      await loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const statusColor = (status) => {
    if (status === "Approved") return { background: "#dcfce7", color: "#166534" };
    if (status === "Rejected") return { background: "#fee2e2", color: "#991b1b" };
    return { background: "#fef9c3", color: "#854d0e" };
  };

  const tabStyle = (tab) => ({
    padding: "8px 18px", border: "none", cursor: "pointer", background: "none",
    borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
    color: activeTab === tab ? "#3b82f6" : "#64748b",
    fontWeight: activeTab === tab ? 600 : 400,
  });

  // Conditional return AFTER all hooks
  if (!canView) return (
    <div className="staff-card-overlay" onClick={onClose}>
      <div className="staff-form-modal" onClick={(e) => e.stopPropagation()}>
        <p style={{ textAlign: "center", padding: 32, color: "#94a3b8" }}>You don't have access to this section.</p>
        <div className="staff-form-actions"><button className="btn-primary" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );

  return (
    <div className="staff-card-overlay" onClick={onClose}>
      <div className="staff-form-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: "95%", maxHeight: "85vh", overflowY: "auto" }}>
        <div className="staff-form-header">
          <div>
            <h2>Payroll & Leave</h2>
            <p className="staff-modal-subtitle"><strong>{professor.name}</strong></p>
          </div>
          <button className="staff-close-btn" onClick={onClose}>✕</button>
        </div>

        {message && (
          <div className={`staff-alert ${message.type === "success" ? "staff-alert-success" : "staff-alert-error"}`} style={{ margin: "0 0 12px" }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 16 }}>
          <button style={tabStyle("payroll")} onClick={() => setActiveTab("payroll")}>Payroll</button>
          <button style={tabStyle("leave")} onClick={() => setActiveTab("leave")}>Leave Requests</button>
        </div>

        {loading ? <p style={{ textAlign: "center", color: "#94a3b8" }}>Loading...</p> : (
          <>
            {activeTab === "payroll" && (
              <div>
                {isAdmin && (
                  <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => setShowPayrollForm(!showPayrollForm)}>
                    {showPayrollForm ? "Cancel" : "+ Add Payroll Record"}
                  </button>
                )}
                {showPayrollForm && isAdmin && (
                  <form onSubmit={handleAddPayroll} style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <div className="staff-form-group">
                      <label>Amount (EGP) *</label>
                      <input className="staff-input" type="number" value={payrollForm.amount} onChange={(e) => setPayrollForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 15000" />
                    </div>
                    <div className="staff-form-group">
                      <label>Payment Date *</label>
                      <input className="staff-input" type="date" value={payrollForm.payment_date} onChange={(e) => setPayrollForm(p => ({ ...p, payment_date: e.target.value }))} />
                    </div>
                    <div className="staff-form-group">
                      <label>Notes</label>
                      <input className="staff-input" value={payrollForm.notes} onChange={(e) => setPayrollForm(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" />
                    </div>
                    <div className="staff-form-actions">
                      <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
                    </div>
                  </form>
                )}
                {payroll.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>No payroll records found.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {payroll.map((p) => (
                      <li key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b" }}>EGP {Number(p.amount).toLocaleString()}</div>
                          <div style={{ color: "#64748b", fontSize: 13 }}>{p.payment_date}</div>
                          {p.notes && <div style={{ color: "#94a3b8", fontSize: 12 }}>{p.notes}</div>}
                        </div>
                        <span style={{ background: "#dcfce7", color: "#166534", padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600 }}>Paid</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "leave" && (
              <div>
                {isDoctor && isOwnProfile && (
                  <button className="btn-primary" style={{ marginBottom: 12 }} onClick={() => setShowLeaveForm(!showLeaveForm)}>
                    {showLeaveForm ? "Cancel" : "+ Submit Leave Request"}
                  </button>
                )}
                {showLeaveForm && (
                  <form onSubmit={handleAddLeave} style={{ background: "#f8fafc", padding: 16, borderRadius: 8, marginBottom: 16 }}>
                    <div className="staff-form-group">
                      <label>Start Date *</label>
                      <input className="staff-input" type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm(p => ({ ...p, start_date: e.target.value }))} />
                    </div>
                    <div className="staff-form-group">
                      <label>End Date *</label>
                      <input className="staff-input" type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm(p => ({ ...p, end_date: e.target.value }))} />
                    </div>
                    <div className="staff-form-group">
                      <label>Reason *</label>
                      <textarea className="staff-input" value={leaveForm.reason} onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for leave" rows={3} style={{ resize: "vertical" }} />
                    </div>
                    <div className="staff-form-actions">
                      <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Submitting..." : "Submit"}</button>
                    </div>
                  </form>
                )}
                {leaves.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: 24 }}>No leave requests found.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {leaves.map((l) => (
                      <li key={l.id} style={{ padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1e293b" }}>{l.start_date} → {l.end_date}</div>
                            <div style={{ color: "#64748b", fontSize: 13, margin: "4px 0" }}>{l.reason}</div>
                          </div>
                          <span style={{ ...statusColor(l.status), padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{l.status}</span>
                        </div>
                        {isAdmin && l.status === "Pending" && (
                          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                            <button className="btn-action btn-view" onClick={() => handleLeaveStatus(l.id, "Approved")} style={{ background: "#dcfce7", color: "#166534", border: "none" }}>Approve</button>
                            <button className="btn-action btn-edit" onClick={() => handleLeaveStatus(l.id, "Rejected")} style={{ background: "#fee2e2", color: "#991b1b", border: "none" }}>Reject</button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN STAFF COMPONENT
// =============================================================================

export default function Staff() {
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";
  const isDoctor = currentUser?.role === "doctor";

  useEffect(() => {
    getCurrentUser().then(setCurrentUser);
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    setLoading(true);
    try {
      const data = await getProfessors();
      setProfessors(data);
    } catch (err) {
      console.error("Failed to load professors:", err);
      alert("Could not load professors.");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (prof) => { setSelectedProfessor(prof); setShowViewModal(true); };
  const handleEdit = (prof) => { if (!isAdmin) return; setEditingProfessor(prof); setShowFormModal(true); if (showViewModal) setShowViewModal(false); };
  const handleAssign = (prof) => { if (!isAdmin) return; setSelectedProfessor(prof); setShowAssignModal(true); if (showViewModal) setShowViewModal(false); };
  const handleAddNew = () => { if (!isAdmin) return; setEditingProfessor(null); setShowFormModal(true); };
  const handlePerformance = (prof) => { setSelectedProfessor(prof); setShowPerformanceModal(true); };
  const handlePayroll = (prof) => { setSelectedProfessor(prof); setShowPayrollModal(true); };

  const handleFormSubmit = async (formData) => {
    setFormLoading(true);
    try {
      if (editingProfessor) {
        await updateProfessor(editingProfessor.auth_id, formData);
      } else {
        await addProfessor(formData);
      }
      await loadProfessors();
      setShowFormModal(false);
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.message || "Failed to save professor.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowViewModal(false);
    setShowFormModal(false);
    setShowAssignModal(false);
    setShowPerformanceModal(false);
    setShowPayrollModal(false);
    setSelectedProfessor(null);
    setEditingProfessor(null);
  };

  return (
    <Layout>
    <div className="staff-container">
      <div className="staff-header">
        <h1 className="staff-title">Staff Management</h1>
        {isAdmin && (
          <button className="staff-add-button" onClick={handleAddNew}>Add Professor</button>
        )}
      </div>

      {isDoctor && currentUser && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button className="btn-action btn-view" onClick={() => handlePerformance(currentUser)}>My Research & Activities</button>
          <button className="btn-action btn-assign" onClick={() => handlePayroll(currentUser)}>My Payroll & Leave</button>
        </div>
      )}

      {loading ? (
        <div className="staff-loading-state">Loading professors...</div>
      ) : (
        <StaffTable professors={professors} onView={handleView} onEdit={handleEdit} onAssign={handleAssign} isAdmin={isAdmin} />
      )}

      {showViewModal && selectedProfessor && (
        <StaffCard
          professor={selectedProfessor}
          onEdit={handleEdit}
          onAssign={handleAssign}
          onClose={handleModalClose}
          isAdmin={isAdmin}
          isDoctor={isDoctor}
          currentUser={currentUser}
          onPerformance={handlePerformance}
          onPayroll={handlePayroll}
        />
      )}

      {isAdmin && showFormModal && (
        <StaffForm professor={editingProfessor} onSubmit={handleFormSubmit} onClose={handleModalClose} loading={formLoading} />
      )}

      {isAdmin && showAssignModal && selectedProfessor && (
        <AssignCourseModal professor={selectedProfessor} onClose={handleModalClose} />
      )}

      {showPerformanceModal && selectedProfessor && (
        <PerformanceModal professor={selectedProfessor} currentUser={currentUser} isAdmin={isAdmin} isDoctor={isDoctor} onClose={handleModalClose} />
      )}

      {showPayrollModal && selectedProfessor && (
        <PayrollLeaveModal professor={selectedProfessor} currentUser={currentUser} isAdmin={isAdmin} isDoctor={isDoctor} onClose={handleModalClose} />
      )}
    </div>
    </Layout>
  );
}