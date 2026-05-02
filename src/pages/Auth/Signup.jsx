import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const [childEmail, setChildEmail] = useState("");

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }

    let childId = null;

    if (role === "parent") {
      if (!childEmail) {
        alert("Please enter child email");
        return;
      }

      const { data: childData, error: childError } = await supabase
        .from("users")
        .select("*")
        .eq("email", childEmail)
        .single();

      if (childError || !childData) {
        alert("Child not found");
        return;
      }

      childId = childData.id;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Signup succeeded but no user session found");
      return;
    }

    const { error: insertError } = await supabase.from("users").insert([
      {
        auth_id: user.id,
        name: name,
        email: email,
        role: role,
        child_id: childId,
      },
    ]);

    if (insertError) {
      console.log(insertError);
      alert("Error saving user profile");
      return;
    }

    if (role === "parent") {
      navigate("/community");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Join the University Management System
        </p>

        <div className="auth-input-group">
          <label>Name</label>
          <input
            type="text"
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="auth-input-group">
          <label>Role</label>
          <select onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="parent">Parent</option>
          </select>
        </div>

        {role === "parent" && (
          <div className="auth-input-group">
            <label>Child Email</label>
            <input
              type="email"
              placeholder="Enter your child's email"
              onChange={(e) => setChildEmail(e.target.value)}
            />
          </div>
        )}

        <button onClick={handleSignup}>Sign Up</button>

        <div className="auth-footer">
          Already have an account?{" "}
          <a href="/login">Login</a>
        </div>

      </div>
    </div>
  );
}

export default Signup;