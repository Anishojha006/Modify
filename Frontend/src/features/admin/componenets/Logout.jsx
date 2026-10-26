import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../admin.context.jsx";
import "../style/Logout.scss";
import { getErrorMessage } from "../../../services/errorMessage.js";

const Logout = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAdmin();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const onLogout = async () => {
    if (isLoggingOut) return;

    setError("");
    setIsLoggingOut(true);

    try {
      await handleLogout();
      navigate("/admin", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
      setError(getErrorMessage(error, "Unable to log out. Please try again."));
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="admin-logout"
        onClick={onLogout}
        disabled={isLoggingOut}
        aria-label="Log out of admin dashboard"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  );
};

export default Logout;