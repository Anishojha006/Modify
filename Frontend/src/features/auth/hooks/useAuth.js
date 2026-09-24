import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context.jsx";
import { useNavigate } from "react-router-dom";
import {
    getme,
    register,
    login
} from "../services/auth.service.js";

export const useProfile = () => {
    const navigate = useNavigate();
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
    
    const handlegetme = async ()=>{
        setLoading(true);
        try{
            const response = await getme();
            console.log(response);
            setUser(response.user);
            navigate("/dashboad");

        }
        catch(err){
            console.log(err.message);
        }
        finally{
            setLoading(false);
        }
    } 

useEffect(() => {
  

handlegetme();
}, [])

    return {
        handlegetme,
        user,
        loading,
        handleLogin,
        handleRegister
    };
};

export const useAuth = useProfile;