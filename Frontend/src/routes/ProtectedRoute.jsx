import { Navigate } from "react-router-dom";
import Loader from "../features/auth/componenets/Loader.jsx";
import { useAuth } from "../features/auth/hooks/useAuth.js";

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loader text="Checking your session..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;