import { BrowserRouter } from "react-router-dom";

import "./App.css";

import { AuthProvider } from "./features/auth/auth.context.jsx";
import { SongContextProvider } from "./features/Home/context/song.context.jsx";
import AppRoutes from "./routes/Approute.jsx";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SongContextProvider>
                    <AppRoutes />
                </SongContextProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;