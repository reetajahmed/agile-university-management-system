import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import "../styles/navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut(); // clear session
    navigate("/login"); // go to login page
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <NavLink to="/home">Home</NavLink>
        <NavLink to="/community">Community</NavLink>
        <NavLink to="/curriculum">Curriculum</NavLink>
        <NavLink to="/staff">Staff</NavLink>
        <NavLink to="/facilities">Facilities</NavLink>
      </div>

      {/* Logout button */}
      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}

export default Navbar;