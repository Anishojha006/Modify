import { Routes, Route } from "react-router-dom";
import Register from "../features/auth/pages/Register.jsx"
import FaceExpression from "../features/expression/components/FaceExpression.jsx";
import Login from "../features/auth/pages/Login.jsx"
import ProtectedRoute from "./ProtectedRoute.jsx";
import GuestRoute from "./GuestRoute.jsx";
import NotFound from "../features/expression/pages/NotFound.jsx";

const AppRoutes = () => {
    return (
        <Routes>

            <Route
                path="/"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <Login />
                    </GuestRoute>
                }
            />



            <Route
                path="/register"
                element={
                    <GuestRoute>
                        <Register />
                    </GuestRoute>
                }
            />

            <Route
                path="/dashboad"
                element={
                    <ProtectedRoute>
                        <FaceExpression />
                    </ProtectedRoute>
                }
            />

            <Route path="*" element={<NotFound />} />

        </Routes>
    );
};

export default AppRoutes;