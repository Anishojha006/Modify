import { BrowserRouter } from "react-router-dom";

import "./App.css";

import { AuthProvider } from "./features/auth/auth.context.jsx";
import AppRoutes from "./routes/Approute.jsx";

function App() {
    return (
        <BrowserRouter>

            <AuthProvider>

                <AppRoutes />

            </AuthProvider>

        </BrowserRouter>
    );
}

export default App;