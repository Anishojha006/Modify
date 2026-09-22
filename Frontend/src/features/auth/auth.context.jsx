import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);

    return (
        <AuthContext.Provider
            value={{
                setLoading,
                setUser,
                user,
                loading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const AuthContextProvider = AuthContext;