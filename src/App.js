import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Community from "./pages/Community/Community";
import Curriculum from "./pages/Curriculum/Curriculum";
import Staff from "./pages/Staff/Staff";
import Facilities from "./pages/Facilities/Facilities";
import Messaging from "./pages/Community/Messaging";
import Announcements from "./pages/Community/Announcements";
import Signup from "./pages/Auth/Signup";
import Login from "./pages/Auth/Login";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login */}
        <Route path="/" element={<Login />} />

        {/* Modules */}
        <Route path="/home" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/messages" element={<Messaging />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;