import { useContext } from "react";
import { AuthContext } from "../auth.context.jsx";
import {
    register,
    login
} from "../services/auth.service.js";

export const useProfile = () => {

    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useProfile must be used inside AuthContextProvider"
        );
    }


    const {
        setLoading,
        setUser,
        user,
        loading
    } = context;

    const handleLogin = async ({
        username,
        email,
        password
    }) => {

        setLoading(true);

        try {

            const response = await login({
                username,
                email,
                password
            });

            setUser(response.user);

            return response;

        } catch (error) {

            console.error(
                "Login failed:",
                error
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };

    const handleRegister = async ({
        username,
        email,
        password
    }) => {

        setLoading(true);

        try {

            const response = await register({
                username,
                email,
                password
            });

            setUser(response.user);

            return response;

        } catch (error) {

            console.error(
                "Registration failed:",
                error
            );

            throw error;

        } finally {

            setLoading(false);

        }
    };

    return {
        user,
        loading,
        handleLogin,
        handleRegister
    };
};

export const useAuth = useProfile;