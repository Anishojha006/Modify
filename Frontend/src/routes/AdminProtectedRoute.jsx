import { Navigate } from "react-router-dom";
import Loader from "../features/auth/components/Loader.jsx";
import { useAdmin } from "../features/admin/useAdmin.js";

const AdminProtectedRoute = ({ children }) => {
    const { admin, loading } = useAdmin();

    if (loading) {
        return <Loader text="Checking your admin session..." />;
    }

    if (!admin) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
