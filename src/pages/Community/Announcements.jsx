import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import "../../styles/announcements.css";

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from("announcements").select("*");
    setAnnouncements(data);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <Layout>
      <div className="announcements-container">
        <h2>Announcements</h2>

        <div className="announcements-list">
          {announcements.map((item) => (
            <div className="announcement-card" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Announcements;