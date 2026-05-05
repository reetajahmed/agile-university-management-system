import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/meetings.css";

function Meetings() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const [search, setSearch] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [date, setDate] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get logged in user
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
      return data;
    }
  };

  // Get doctors
  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "doctor");

    setUsers(data || []);
  };

  // Filter doctors by email
  useEffect(() => {
    if (!search) {
      setFilteredDoctors([]);
      return;
    }

    const results = users.filter((u) =>
      u.email.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredDoctors(results);
  }, [search, users]);

  // Fetch meetings
  const fetchMeetings = async (user) => {
    if (!user) return;

    setLoading(true);

    let query = supabase
    .from("meetings")
    .select(`
      *,
      doctor:users!doctor_id(email, name)
    `);

    if (user.role === "student") {
      query = query.eq("student_id", user.id);
    }

    if (user.role === "doctor") {
      query = query.eq("doctor_id", user.id);
    }

    if (user.role === "parent") {
      query = query.eq("student_id", user.child_id);
    }

    const { data } = await query.order("date", { ascending: true });

    setMeetings(data || []);
    setLoading(false);
  };

  // Create meeting
  const createMeeting = async () => {
    if (!selectedDoctor || !date || !currentUser) return;

    if (currentUser.role !== "student") {
      alert("Only students can schedule meetings");
      return;
    }

    await supabase.from("meetings").insert([
      {
        student_id: currentUser.id,
        doctor_id: selectedDoctor,
        date,
      },
    ]);

    setSelectedDoctor("");
    setSelectedDoctorObj(null);
    setDate("");
    fetchMeetings(currentUser);
  };

  useEffect(() => {
    const init = async () => {
      const user = await fetchCurrentUser();
      await fetchUsers();
      await fetchMeetings(user);
    };

    init();
  }, []);

  return (
    <Layout>
      <div className="meetings-container">
        <h2>Meetings</h2>

        {currentUser?.role === "student" && (
          <div className="meeting-form">

            <div className="search-box">
              <input
                type="text"
                placeholder="Search doctor by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {filteredDoctors.length > 0 && (
              <div className="doctor-results">
                {filteredDoctors.map((doc) => (
                  <div
                    key={doc.id}
                    className="doctor-item"
                    onClick={() => {
                      setSelectedDoctor(doc.id);
                      setSelectedDoctorObj(doc);
                      setSearch("");
                      setFilteredDoctors([]);
                    }}
                  >
                    <div className="doctor-avatar">
                      {doc.name[0].toUpperCase()}
                    </div>

                    <div className="doctor-info">
                      <span className="doctor-name">{doc.name}</span>
                      <span className="doctor-email">{doc.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedDoctorObj && (
              <div className="selected-doctor">
                Selected: <strong>{selectedDoctorObj.name}</strong>
              </div>
            )}

            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button onClick={createMeeting}>Schedule</button>
          </div>
        )}

        <div className="meetings-list">
          {loading ? (
            <p className="loading">Loading meetings...</p>
          ) : meetings.length === 0 ? (
            <p className="no-data">No meetings scheduled</p>
          ) : (
            meetings.map((m) => (
              <div key={m.id} className="meeting-card">
                <p>Doctor: {m.doctor?.name}</p>
                <p>Email: {m.doctor?.email}</p>
                <p>Date: {new Date(m.date).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Meetings;