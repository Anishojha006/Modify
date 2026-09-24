import { Routes, Route } from "react-router-dom";
import Register from "../features/auth/pages/Register.jsx"
import FaceExpression from "../features/expression/components/FaceExpression.jsx";
import Login from "../features/auth/pages/Login.jsx"
import ProtectedRoute from "./ProtectedRoute.jsx";

const AppRoutes = () => {
    return (
        <Routes>
         
           <Route
                path="/"
                element={<Login/>}
                
            />
            <Route
                path="/login"
                element={<Login/>}
                
            />

        

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/dashboad"
                element={
                    <ProtectedRoute>
                        <FaceExpression />
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
};

export default AppRoutes;