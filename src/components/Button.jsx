import "../styles/button.css";

function Button({ text, onClick }) {
  return (
    <button className="btn" onClick={onClick}>
      {text}
    </button>
  );
}

export default Button;