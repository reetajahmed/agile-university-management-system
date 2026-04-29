import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/events.css";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true); 

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

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <Layout>
      <div className="events-container">
        <h2>Upcoming Events</h2>

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