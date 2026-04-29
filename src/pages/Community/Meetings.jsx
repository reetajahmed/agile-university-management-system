import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/meetings.css";

function Meetings() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true); // 🔥 NEW

  // 🔹 Fetch logged-in user
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

  // 🔹 Fetch users (doctors only)
  const fetchUsers = async () => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("role", "doctor");

    setUsers(data);
  };

  // 🔹 Fetch meetings
  const fetchMeetings = async () => {
    setLoading(true); // 🔥 START loading

    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("date", { ascending: true });

    setMeetings(data || []);

    setLoading(false); // 🔥 END loading
  };

  // 🔹 Create meeting
  const createMeeting = async () => {
    if (!selectedDoctor || !date || !currentUser) return;

    await supabase.from("meetings").insert([
      {
        student_id: currentUser.id,
        doctor_id: selectedDoctor,
        date,
      },
    ]);

    setSelectedDoctor("");
    setDate("");
    fetchMeetings();
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchMeetings();
  }, []);

  return (
    <Layout>
      <div className="meetings-container">
        <h2>Schedule Meeting</h2>

        {/* Form */}
        <div className="meeting-form">
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
          >
            <option value="">Select Doctor</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>

          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <button onClick={createMeeting}>
            Schedule
          </button>
        </div>

        {/* 🔥 FIXED DISPLAY */}
        <div className="meetings-list">
          {loading ? (
            <p className="loading">Loading meetings...</p>
          ) : meetings.length === 0 ? (
            <p className="no-data">No meetings scheduled</p>
          ) : (
            meetings.map((m) => (
              <div key={m.id} className="meeting-card">
                <p>Doctor ID: {m.doctor_id}</p>
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