import React, { useState, useEffect } from "react";
import { 
  getBookingsByRoom, addBooking, deleteBooking, addRoom, updateRoom, deleteRoom,
  addIssue, updateIssueStatus, addEquipment, deleteEquipment, typeLabel
} from "./facilitiesService";

// ========== BADGE COMPONENT ==========
function Badge({ type, label }) {
  const cls = `fac-badge fac-badge-${(type || "").toLowerCase().replace(" ", "-")}`;
  return <span className={cls}>{label || type}</span>;
}

// ========== BOOK ROOM MODAL ==========
function BookRoomModal({ room, currentUser, onClose, onBooked }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ title: "", date: "", start_time: "", end_time: "" });
  const [showForm, setShowForm] = useState(false);

  const isDoctor = currentUser?.role === "doctor";
  const isAdmin = currentUser?.role === "admin";
  const canBook = isDoctor || isAdmin;

  useEffect(() => { loadBookings(); }, [room.id]);

  async function loadBookings() {
    setLoading(true);
    try {
      const data = await getBookingsByRoom(room.id);
      setBookings(data);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(e) {
    e.preventDefault();
    if (!form.title || !form.date || !form.start_time || !form.end_time)
      return setMessage({ type: "error", text: "All fields are required." });
    if (form.start_time >= form.end_time)
      return setMessage({ type: "error", text: "End time must be after start time." });

    const conflict = bookings.find(
      (b) => b.date === form.date &&
        ((form.start_time >= b.start_time && form.start_time < b.end_time) ||
          (form.end_time > b.start_time && form.end_time <= b.end_time))
    );
    if (conflict) return setMessage({ type: "error", text: "This time slot is already booked." });

    setSaving(true);
    try {
      await addBooking({ ...form, room_id: room.id, booked_by: currentUser.id, status: "Confirmed" });
      setForm({ title: "", date: "", start_time: "", end_time: "" });
      setShowForm(false);
      setMessage({ type: "success", text: "Room booked successfully!" });
      await loadBookings();
      onBooked && onBooked();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await deleteBooking(id);
      setMessage({ type: "success", text: "Booking cancelled." });
      await loadBookings();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  return (
    <div className="fac-overlay" onClick={onClose}>
      <div className="fac-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="fac-modal-header">
          <div>
            <h2>{room.name}</h2>
            <p style={{ margin: 0, fontSize: 13, color: "#6B7280" }}>
              {typeLabel(room.type)} · Capacity: {room.capacity} · {room.location}
            </p>
          </div>
          <button className="fac-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="fac-modal-body">
          {message && (
            <div className={`fac-alert fac-alert-${message.type}`}>{message.text}</div>
          )}

          {canBook && (
            <button className="fac-btn-primary" style={{ marginBottom: 16 }}
              onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancel" : "+ Book This Room"}
            </button>
          )}

          {showForm && (
            <form onSubmit={handleBook} style={{ background: "#F8FAFC", padding: 16, borderRadius: 10, marginBottom: 20, border: "1px solid #E5E7EB" }}>
              <div className="fac-form-group">
                <label>Booking Title *</label>
                <input className="fac-input" value={form.title}
                  onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. CS101 Lecture" />
              </div>
              <div className="fac-form-row">
                <div className="fac-form-group">
                  <label>Date *</label>
                  <input className="fac-input" type="date" value={form.date}
                    onChange={(e) => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="fac-form-group">
                  <label>Start Time *</label>
                  <input className="fac-input" type="time" value={form.start_time}
                    onChange={(e) => setForm(p => ({ ...p, start_time: e.target.value }))} />
                </div>
              </div>
              <div className="fac-form-group">
                <label>End Time *</label>
                <input className="fac-input" type="time" value={form.end_time}
                  onChange={(e) => setForm(p => ({ ...p, end_time: e.target.value }))} />
              </div>
              <button type="submit" className="fac-btn-primary" disabled={saving}>
                {saving ? "Booking..." : "Confirm Booking"}
              </button>
            </form>
          )}

          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1E40AF", marginBottom: 12 }}>
            Existing Bookings
          </h3>

          {loading ? <p style={{ color: "#6B7280" }}>Loading...</p> :
            bookings.length === 0 ? (
              <p style={{ color: "#6B7280", textAlign: "center", padding: 24 }}>No bookings yet for this room.</p>
            ) : (
              bookings.map((b) => (
                <div className="fac-booking-item" key={b.id}>
                  <div className="fac-booking-info">
                    <h4>{b.title}</h4>
                    <p>{b.date} · {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}</p>
                    {b.users && <p style={{ color: "#9CA3AF", fontSize: 12 }}>By: {b.users.name}</p>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <Badge type={b.status} label={b.status} />
                    {(isAdmin || b.booked_by === currentUser?.id) && (
                      <button className="fac-btn-danger" onClick={() => handleDelete(b.id)}>Cancel</button>
                    )}
                  </div>
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
}

// ========== REPORT ISSUE MODAL ==========
function ReportIssueModal({ rooms, currentUser, onClose, onReported }) {
  const [form, setForm] = useState({ title: "", description: "", room_id: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title) return setMessage({ type: "error", text: "Title is required." });
    setSaving(true);
    try {
      await addIssue({
        title: form.title,
        description: form.description,
        room_id: form.room_id || null,
        reported_by: currentUser.id,
        status: "Open",
      });
      setMessage({ type: "success", text: "Issue reported successfully!" });
      onReported && onReported();
      setTimeout(onClose, 1500);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fac-overlay" onClick={onClose}>
      <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fac-modal-header">
          <h2>Report Facility Issue</h2>
          <button className="fac-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="fac-modal-body">
          {message && <div className={`fac-alert fac-alert-${message.type}`}>{message.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="fac-form-group">
              <label>Issue Title *</label>
              <input className="fac-input" value={form.title}
                onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Projector not working" />
            </div>
            <div className="fac-form-group">
              <label>Room (optional)</label>
              <select className="fac-select-input" value={form.room_id}
                onChange={(e) => setForm(p => ({ ...p, room_id: e.target.value }))}>
                <option value="">-- Select a room --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="fac-form-group">
              <label>Description</label>
              <textarea className="fac-textarea" value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe the issue in detail..." rows={4} />
            </div>
            <div className="fac-modal-footer" style={{ padding: 0, paddingTop: 8 }}>
              <button type="button" className="fac-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="fac-btn-primary" disabled={saving}>
                {saving ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ========== ROOM FORM MODAL ==========
function RoomFormModal({ room, onClose, onSaved }) {
  const isEdit = !!room;
  const [form, setForm] = useState({
    name: room?.name || "",
    type: room?.type || "classroom",
    capacity: room?.capacity || "",
    location: room?.location || "",
    description: room?.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.capacity) return setMessage({ type: "error", text: "Name and capacity are required." });
    setSaving(true);
    try {
      if (isEdit) {
        await updateRoom(room.id, form);
      } else {
        await addRoom(form);
      }
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fac-overlay" onClick={onClose}>
      <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fac-modal-header">
          <h2>{isEdit ? "Edit Room" : "Add New Room"}</h2>
          <button className="fac-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="fac-modal-body">
          {message && <div className={`fac-alert fac-alert-${message.type}`}>{message.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="fac-form-row">
              <div className="fac-form-group">
                <label>Room Name *</label>
                <input className="fac-input" value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Room 101" />
              </div>
              <div className="fac-form-group">
                <label>Type</label>
                <select className="fac-select-input" value={form.type}
                  onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="classroom">Classroom</option>
                  <option value="lab">Lab</option>
                  <option value="lecture_hall">Lecture Hall</option>
                </select>
              </div>
            </div>
            <div className="fac-form-row">
              <div className="fac-form-group">
                <label>Capacity *</label>
                <input className="fac-input" type="number" value={form.capacity}
                  onChange={(e) => setForm(p => ({ ...p, capacity: e.target.value }))}
                  placeholder="e.g. 30" />
              </div>
              <div className="fac-form-group">
                <label>Location</label>
                <input className="fac-input" value={form.location}
                  onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Building A" />
              </div>
            </div>
            <div className="fac-form-group">
              <label>Description</label>
              <textarea className="fac-textarea" value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Optional description..." rows={3} />
            </div>
            <div className="fac-modal-footer" style={{ padding: 0, paddingTop: 8 }}>
              <button type="button" className="fac-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="fac-btn-primary" disabled={saving}>
                {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Room"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ========== EQUIPMENT FORM MODAL ==========
function EquipmentFormModal({ rooms, onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", type: "", quantity: 1, room_id: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.type) return setMessage({ type: "error", text: "Name and type are required." });
    setSaving(true);
    try {
      await addEquipment({ ...form, room_id: form.room_id || null });
      onSaved && onSaved();
      onClose();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fac-overlay" onClick={onClose}>
      <div className="fac-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fac-modal-header">
          <h2>Add Equipment</h2>
          <button className="fac-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="fac-modal-body">
          {message && <div className={`fac-alert fac-alert-${message.type}`}>{message.text}</div>}
          <form onSubmit={handleSubmit}>
            <div className="fac-form-row">
              <div className="fac-form-group">
                <label>Name *</label>
                <input className="fac-input" value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Projector" />
              </div>
              <div className="fac-form-group">
                <label>Type *</label>
                <input className="fac-input" value={form.type}
                  onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                  placeholder="e.g. AV Equipment" />
              </div>
            </div>
            <div className="fac-form-row">
              <div className="fac-form-group">
                <label>Quantity</label>
                <input className="fac-input" type="number" value={form.quantity}
                  onChange={(e) => setForm(p => ({ ...p, quantity: e.target.value }))} />
              </div>
              <div className="fac-form-group">
                <label>Room</label>
                <select className="fac-select-input" value={form.room_id}
                  onChange={(e) => setForm(p => ({ ...p, room_id: e.target.value }))}>
                  <option value="">-- No room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fac-form-group">
              <label>Notes</label>
              <textarea className="fac-textarea" value={form.notes}
                onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Optional notes..." rows={3} />
            </div>
            <div className="fac-modal-footer" style={{ padding: 0, paddingTop: 8 }}>
              <button type="button" className="fac-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="fac-btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Add Equipment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ========== ROOMS TAB ==========
export function RoomsTab({ rooms, currentUser, isAdmin, onRefresh }) {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCapacity, setFilterCapacity] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const filtered = rooms.filter((r) => {
    const matchSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || r.type === filterType;
    const matchCap = !filterCapacity || r.capacity >= parseInt(filterCapacity);
    return matchSearch && matchType && matchCap;
  });

  async function handleDelete(id) {
    if (!window.confirm("Delete this room?")) return;
    try {
      await deleteRoom(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="fac-filter-bar">
        <div className="fac-search-wrap">
          <span className="fac-search-icon">🔍</span>
          <input className="fac-search-input" placeholder="Search rooms..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="fac-select" value={filterType}
          onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="classroom">Classroom</option>
          <option value="lab">Lab</option>
          <option value="lecture_hall">Lecture Hall</option>
        </select>
        <select className="fac-select" value={filterCapacity}
          onChange={(e) => setFilterCapacity(e.target.value)}>
          <option value="">Any Capacity</option>
          <option value="20">20+</option>
          <option value="40">40+</option>
          <option value="80">80+</option>
          <option value="100">100+</option>
        </select>
        {isAdmin && (
          <button className="fac-btn-primary" onClick={() => { setEditingRoom(null); setShowRoomForm(true); }}>
            + Add Room
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="fac-no-results">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏫</div>
          <p>No rooms match your filters.</p>
        </div>
      ) : (
        <div className="fac-cards-grid">
          {filtered.map((room) => (
            <div className="fac-card" key={room.id}>
              <div className="fac-card-header">
                <div>
                  <p className="fac-card-title">{room.name}</p>
                  <p className="fac-card-subtitle">{room.location || "—"}</p>
                </div>
                <Badge type={room.type} label={typeLabel(room.type)} />
              </div>
              <div className="fac-card-body">
                <div className="fac-card-row">
                  <span>👥</span>
                  <span>Capacity: <strong>{room.capacity}</strong></span>
                </div>
                {room.description && (
                  <div className="fac-card-row">
                    <span>📋</span>
                    <span>{room.description}</span>
                  </div>
                )}
              </div>
              <div className="fac-card-actions">
                <button className="fac-btn-primary" onClick={() => { setSelectedRoom(room); setShowBookModal(true); }}>
                  View / Book
                </button>
                {isAdmin && (
                  <>
                    <button className="fac-btn-secondary" onClick={() => { setEditingRoom(room); setShowRoomForm(true); }}>Edit</button>
                    <button className="fac-btn-danger" onClick={() => handleDelete(room.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showBookModal && selectedRoom && (
        <BookRoomModal
          room={selectedRoom}
          currentUser={currentUser}
          onClose={() => setShowBookModal(false)}
          onBooked={onRefresh}
        />
      )}

      {showRoomForm && (
        <RoomFormModal
          room={editingRoom}
          onClose={() => setShowRoomForm(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}

// ========== BOOKINGS TAB ==========
export function BookingsTab({ bookings, currentUser, isAdmin, onRefresh }) {
  const [search, setSearch] = useState("");

  const filtered = bookings.filter((b) =>
    b.title?.toLowerCase().includes(search.toLowerCase()) ||
    b.rooms?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.users?.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCancel(id) {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await deleteBooking(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="fac-filter-bar">
        <div className="fac-search-wrap">
          <span className="fac-search-icon">🔍</span>
          <input className="fac-search-input" placeholder="Search bookings..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="fac-no-results">
          <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="fac-table-wrapper">
          <table className="fac-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Booked By</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600 }}>{b.title}</td>
                  <td>{b.rooms?.name || "—"}</td>
                  <td>{b.date}</td>
                  <td>{b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5)}</td>
                  <td>{b.users?.name || "—"}</td>
                  <td><Badge type={b.status?.toLowerCase()} label={b.status} /></td>
                  {isAdmin && (
                    <td>
                      <button className="fac-btn-danger" onClick={() => handleCancel(b.id)}>Cancel</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fac-table-footer">Showing {filtered.length} bookings</div>
        </div>
      )}
    </div>
  );
}

// ========== ISSUES TAB ==========
export function IssuesTab({ issues, rooms, currentUser, isAdmin, onRefresh }) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = issues.filter((i) => {
    const matchSearch = i.title?.toLowerCase().includes(search.toLowerCase()) ||
      i.rooms?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || i.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleStatus(id, status) {
    try {
      await updateIssueStatus(id, status);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  const statusOptions = ["Open", "In Progress", "Resolved"];

  return (
    <div>
      <div className="fac-filter-bar">
        <div className="fac-search-wrap">
          <span className="fac-search-icon">🔍</span>
          <input className="fac-search-input" placeholder="Search issues..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="fac-select" value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <button className="fac-btn-primary" onClick={() => setShowReportModal(true)}>
          + Report Issue
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="fac-no-results">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔧</div>
          <p>No issues found.</p>
        </div>
      ) : (
        <div className="fac-table-wrapper">
          <table className="fac-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Room</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => (
                <tr key={issue.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{issue.title}</div>
                    {issue.description && <div style={{ fontSize: 12, color: "#6B7280" }}>{issue.description}</div>}
                  </td>
                  <td>{issue.rooms?.name || "General"}</td>
                  <td>{issue.users?.name || "—"}</td>
                  <td>{new Date(issue.created_at).toLocaleDateString()}</td>
                  <td>
                    <Badge
                      type={issue.status === "In Progress" ? "in-progress" : issue.status?.toLowerCase()}
                      label={issue.status}
                    />
                  </td>
                  {isAdmin && (
                    <td>
                      <select className="fac-select" style={{ padding: "4px 8px", fontSize: 13 }}
                        value={issue.status}
                        onChange={(e) => handleStatus(issue.id, e.target.value)}>
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fac-table-footer">Showing {filtered.length} issues</div>
        </div>
      )}

      {showReportModal && (
        <ReportIssueModal
          rooms={rooms}
          currentUser={currentUser}
          onClose={() => setShowReportModal(false)}
          onReported={onRefresh}
        />
      )}
    </div>
  );
}

// ========== EQUIPMENT TAB ==========
export function EquipmentTab({ equipment, rooms, isAdmin, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = equipment.filter((e) =>
    e.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.type?.toLowerCase().includes(search.toLowerCase()) ||
    e.rooms?.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id) {
    if (!window.confirm("Delete this equipment?")) return;
    try {
      await deleteEquipment(id);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div>
      <div className="fac-filter-bar">
        <div className="fac-search-wrap">
          <span className="fac-search-icon">🔍</span>
          <input className="fac-search-input" placeholder="Search equipment..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isAdmin && (
          <button className="fac-btn-primary" onClick={() => setShowForm(true)}>
            + Add Equipment
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="fac-no-results">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🖥️</div>
          <p>No equipment found.</p>
        </div>
      ) : (
        <div className="fac-table-wrapper">
          <table className="fac-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Room</th>
                <th>Notes</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((eq) => (
                <tr key={eq.id}>
                  <td style={{ fontWeight: 600 }}>{eq.name}</td>
                  <td>{eq.type}</td>
                  <td>{eq.quantity}</td>
                  <td>{eq.rooms?.name || "—"}</td>
                  <td style={{ color: "#6B7280", fontSize: 13 }}>{eq.notes || "—"}</td>
                  {isAdmin && (
                    <td>
                      <button className="fac-btn-danger" onClick={() => handleDelete(eq.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="fac-table-footer">Showing {filtered.length} items</div>
        </div>
      )}

      {showForm && (
        <EquipmentFormModal
          rooms={rooms}
          onClose={() => setShowForm(false)}
          onSaved={onRefresh}
        />
      )}
    </div>
  );
}