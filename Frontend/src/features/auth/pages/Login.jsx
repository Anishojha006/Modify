import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import "./login.scss";
import { useNavigate } from "react-router-dom";
import Loader from "../componenets/Loader.jsx";

const Login = () => {
    const {
        loading,
        handleLogin,
    } = useAuth();

    const navigate = useNavigate();

    const [key, setKey] = useState("");
    const [email, setEmail] = useState("");
    const [ShowPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handlepassword = (password) => {
        setKey(password);
    };

    const handleEmail = (email) => {
        setEmail(email);
    };

    const handleShowPassword = () => {
        setShowPassword(!ShowPassword);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await handleLogin({
                email: email.trim(),
                password: key,
            });

            navigate("/dashboad");
        } catch (err) {
            setError(
                err.message ||
                "Login failed. Please check your credentials."
            );
        }
    };

    if (loading) {
        return <Loader />;
    }

    return (
        <div className="login-page">

            <div className="moodify-logo">
                Moodify
            </div>

            <h1>Login to Moodify</h1>

            <form onSubmit={handleFormSubmit}>

                <div className="email-field">
                    <label htmlFor="email">
                        Email
                    </label>

                    <input
                        required
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }}
                    />
                </div>

                <div>
                    <label htmlFor="password">
                        Password
                    </label>

                    <input
                        required
                        type={ShowPassword ? "text" : "password"}
                        id="password"
                        value={key}
                        onChange={(e) =>
                            handlepassword(e.target.value)
                        }
                    />

                    <button
                        type="button"
                        onClick={handleShowPassword}
                    >
                        {ShowPassword ? "Hide" : "Show"}
                    </button>
                </div>

                {error && (
                    <p role="alert">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                >
                    Login
                </button>

            </form>
        </div>
    );
};

export default Login;