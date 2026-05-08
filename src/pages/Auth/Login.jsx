import { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import "../../styles/auth.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
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

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .single();

    if (userError || !userData) {
      alert("Error loading user data");
      return;
    }

    if (userData.role === "parent") {
      navigate("/community");
    } else {
      navigate("/home");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Login to continue</p>

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

        <button onClick={handleLogin}>Login</button>

        <div className="auth-footer">
          Contact the administrator if you do not have an account.
        </div>

      </div>
    </div>
  );
}

export default Login;