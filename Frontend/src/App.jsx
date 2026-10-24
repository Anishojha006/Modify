import { BrowserRouter } from "react-router-dom";

import "./App.css";

import { AuthProvider } from "./features/auth/auth.context.jsx";
import { AdminProvider } from "./features/admin/admin.context.jsx";
import { SongContextProvider } from "./features/Home/context/song.context.jsx";
import AppRoutes from "./routes/Approute.jsx";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AdminProvider>
                    <SongContextProvider>
                        <AppRoutes />
                    </SongContextProvider>
                </AdminProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;