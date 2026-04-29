import { NavLink } from "react-router-dom";
import "../styles/navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/">Home</NavLink>
      <NavLink to="/community">Community</NavLink>
      <NavLink to="/curriculum">Curriculum</NavLink>
      <NavLink to="/staff">Staff</NavLink>
      <NavLink to="/facilities">Facilities</NavLink>
    </nav>
  );
}

export default Navbar;