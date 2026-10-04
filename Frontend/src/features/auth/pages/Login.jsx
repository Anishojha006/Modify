import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import "../style/login.scss";
import "../style/buttons/LoginButtons.scss";
import { Link, useNavigate } from "react-router-dom";
import Loader from "../componenets/Loader.jsx";

const Login = () => {
    const {
        loading,
        handleLogin,
    } = useAuth();
  


    const navigate = useNavigate();

    const [key, setKey] = useState("");
    const [loginMethod, setLoginMethod] = useState("email");
    const [identifier, setIdentifier] = useState("");
    const [ShowPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handlepassword = (password) => {
        setKey(password);
    };

    const handleShowPassword = () => {
        setShowPassword(!ShowPassword);
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await handleLogin({
                [loginMethod]: identifier.trim(),
                password: key,
            });

            navigate("/dashboard");
        } catch (err) {
            setError(
                err.message ||
                "Login failed. Please check your credentials."
            );
        }
    };

    if (loading) {
        return <Loader text={"Loading ..."} />;
    }

    return (
        <div className="login-page">

            <div className="moodify-logo">
                Moodify
            </div>

            <h1>Login to Moodify</h1>

            <form onSubmit={handleFormSubmit}>

                <div className="login-identifier-field">
                    <div className="login-method-options" role="group" aria-label="Login method">
                        <button
                            type="button"
                            className={loginMethod === "email" ? "is-selected" : ""}
                            aria-pressed={loginMethod === "email"}
                            onClick={() => setLoginMethod("email")}
                        >
                            Email
                        </button>
                        <button
                            type="button"
                            className={loginMethod === "username" ? "is-selected" : ""}
                            aria-pressed={loginMethod === "username"}
                            onClick={() => setLoginMethod("username")}
                        >
                            Username
                        </button>
                    </div>

                    <label htmlFor="login-identifier">
                        {loginMethod === "email" ? "Email" : "Username"}
                    </label>

                    <input
                        required
                        type={loginMethod === "email" ? "email" : "text"}
                        id="login-identifier"
                        autoComplete={loginMethod === "email" ? "email" : "username"}
                        value={identifier}
                        onChange={(e) => {
                            setIdentifier(e.target.value);
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
            <div>Have no account then please  <Link to="/register" >Register</Link></div>
           
        </div>
    );
};

export default Login;