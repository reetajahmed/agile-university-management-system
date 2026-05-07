import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");

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

  const fetchEvents = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.log(error);
    } else {
      setEvents(data);
    }

    setLoading(false);
  };

  const createEvent = async () => {
    if (!title || !description || !date) {
      alert("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("events").insert([
      {
        title,
        description,
        date,
      },
    ]);

    if (error) {
      console.log(error);
      alert("Failed to create event");
      return;
    }

    setTitle("");
    setDescription("");
    setDate("");

    fetchEvents();
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
  }, []);

  const isAdmin = currentUser?.role === "admin";

  return (
    <Layout>
      <div className="events-container">

        <h2>Upcoming Events</h2>

        {isAdmin && (
          <div className="create-event-form">

            <h3>Create Event</h3>

            <input
              type="text"
              placeholder="Event Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <textarea
              placeholder="Event Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            <button onClick={createEvent}>
              Create Event
            </button>

          </div>
        )}

        {loading ? (
          <p className="loading">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="no-data">No events available</p>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div key={event.id} className="event-card">

                <h3>{event.title}</h3>

                <p>{event.description}</p>

                <span className="event-date">
                  {new Date(event.date).toLocaleDateString()}
                </span>

              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}

export default Events;