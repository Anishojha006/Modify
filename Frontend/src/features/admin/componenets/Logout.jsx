import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../admin.context.jsx";
import "../style/Logout.scss";

const Logout = () => {
  const navigate = useNavigate();
  const { handleLogout } = useAdmin();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await handleLogout();
      navigate("/admin", { replace: true });
    } catch (error) {
      console.error("Admin logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      type="button"
      className="admin-logout"
      onClick={onLogout}
      disabled={isLoggingOut}
      aria-label="Log out of admin dashboard"
    >
      {isLoggingOut ? "Logging out..." : "Logout"}
    </button>
  );
};

export default Logout;