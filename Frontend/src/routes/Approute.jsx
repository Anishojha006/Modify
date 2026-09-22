import { Routes, Route } from "react-router-dom";

// import Login from "../features/auth/pages/Login.jsx";
import Register from "../features/auth/pages/auth.jsx"
import FaceExpression from "../features/expression/components/FaceExpression.jsx";

const AppRoutes = () => {
    return (
        <Routes>

            {/* <Route
                path="/login"
                element={<Login />}
            /> */}

            <Route
                path="/"
                element={<Register />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/dashboad"
                element={<FaceExpression />}
            />

        </Routes>
    );
};

export default AppRoutes;