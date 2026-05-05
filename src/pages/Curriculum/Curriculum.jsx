import { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import { supabase } from "../../services/supabaseClient";
import ProfessorCurriculum from "./ProfessorCurriculum";
import StudentCurriculum from "./StudentCurriculum";

function Curriculum() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    setLoading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;

    if (!user) {
      setCurrentUser(null);
      setLoading(false);
      return;
    }

    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    setCurrentUser(userData);
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      fetchCurrentUser();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const role = currentUser?.role?.toLowerCase();
  const isProfessor = role === "doctor" || role === "professor" || role === "prof";

  if (loading) {
    return (
      <Layout>
        <div className="curriculum-container">
          <p className="loading">Loading curriculum...</p>
        </div>
      </Layout>
    );
  }

  if (isProfessor) {
    return <ProfessorCurriculum />;
  }

  return <StudentCurriculum currentUser={currentUser} />;
}

export default Curriculum;
