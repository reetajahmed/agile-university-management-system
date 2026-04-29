import Navbar from "./Navbar";
import "../styles/layout.css";

function Layout({ children }) {
  return (
    <div>
      <Navbar />
      <div className="container">{children}</div>
    </div>
  );
}

export default Layout;