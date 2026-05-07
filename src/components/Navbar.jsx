import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return null;
  }

  const isParent = currentUser?.role === "parent";
  const isAdmin = currentUser?.role === "admin";

  return (
    <nav className="navbar">

      <div className="nav-left">

        {!isParent && (
          <NavLink to="/home">Home</NavLink>
        )}

        <NavLink to="/community">
          Community
        </NavLink>

        {!isParent && (
          <>

            {!isAdmin && (
              <NavLink to="/curriculum">
                Curriculum
              </NavLink>
            )}

            <NavLink to="/staff">
              Staff
            </NavLink>

            <NavLink to="/facilities">
              Facilities
            </NavLink>

          </>
        )}

      </div>

      <div className="nav-right">

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </nav>
  );
}

export default Navbar;