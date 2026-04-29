import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

function Signup() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    // 2. Insert into users table
    const { error: insertError } = await supabase.from("users").insert([
      {
        auth_id: data.user.id,
        name: email,
        role: "student",
      },
    ]);

    if (insertError) {
      alert("Error saving user profile");
      return;
    }

    alert("Signup successful!");

    // 3. Redirect to home
    navigate("/home");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>Create Account</h2>
        <p className="auth-subtitle">
          Join the University Management System
        </p>

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