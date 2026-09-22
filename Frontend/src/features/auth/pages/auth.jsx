import {
    useNavigate,
    Link,
} from "react-router-dom";

import { useState } from "react";

import "./Register.scss";

import { useAuth } from "../hooks/useAuth.js";


const Register = () => {

    const navigate = useNavigate();

    const {
        loading,
        handleRegister,
    } = useAuth();


    // FORM DATA

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });


    // PASSWORD VISIBILITY

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);


    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);


    // ERROR

    const [
        error,
        setError,
    ] = useState("");


    // INPUT CHANGE

    const handleChange = (e) => {

        const {
            name,
            value,
        } = e.target;


        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));


        setError("");
    };


    // FORM SUBMIT

    const handleSubmit = async (e) => {

        e.preventDefault();


        const {
            username,
            email,
            password,
            confirmPassword,
        } = formData;


        // EMPTY FIELD CHECK

        if (
            !username.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
        ) {

            setError(
                "Please fill in all fields."
            );

            return;
        }


        // USERNAME VALIDATION

        if (username.trim().length < 3) {

            setError(
                "Username must contain at least 3 characters."
            );

            return;
        }


        // EMAIL VALIDATION

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailRegex.test(email)) {

            setError(
                "Please enter a valid email address."
            );

            return;
        }


        // PASSWORD VALIDATION

        if (password.length < 8) {

            setError(
                "Password must contain at least 8 characters."
            );

            return;
        }


        // CONFIRM PASSWORD

        if (password !== confirmPassword) {

            setError(
                "Passwords do not match."
            );

            return;
        }


        // API REQUEST

        try {

            setError("");


            await handleRegister({

                username:
                    username.trim(),

                email:
                    email.trim(),

                password,

            });


            // SUCCESS

            navigate("/login", {
                replace: true,
            });


        } catch (err) {

            console.error(
                "Registration failed:",
                err
            );


            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Registration failed. Please try again."
            );
        }
    };


    return (

        <div className="register-page">

            <div className="register-card">


                {/* HEADER */}

                <div className="register-header">

                    <div className="logo-border">

                        <div className="logo">
                            Moodify
                        </div>

                    </div>


                    <h1>
                        Create your account
                    </h1>


                    <p>
                        Join us today and get started.
                    </p>

                </div>


                {/* FORM */}

                <form
                    className="register-form"
                    onSubmit={handleSubmit}
                >


                    {/* USERNAME */}

                    <div className="form-group">

                        <label htmlFor="username">
                            Username
                        </label>


                        <input
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            disabled={loading}
                        />

                    </div>


                    {/* EMAIL */}

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>


                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            disabled={loading}
                        />

                    </div>


                    {/* PASSWORD */}

                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>


                        <div className="password-wrapper">

                            <input
                                id="password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="new-password"
                                disabled={loading}
                            />


                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        (prev) =>
                                            !prev
                                    )
                                }
                            >

                                {showPassword
                                    ? "Hide"
                                    : "Show"}

                            </button>

                        </div>


                        <small>
                            Minimum 8 characters
                        </small>

                    </div>


                    {/* CONFIRM PASSWORD */}

                    <div className="form-group">

                        <label htmlFor="confirmPassword">
                            Confirm Password
                        </label>


                        <div className="password-wrapper">

                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={
                                    showConfirmPassword
                                        ? "text"
                                        : "password"
                                }
                                placeholder="Confirm your password"
                                value={
                                    formData.confirmPassword
                                }
                                onChange={handleChange}
                                autoComplete="new-password"
                                disabled={loading}
                            />


                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        (prev) =>
                                            !prev
                                    )
                                }
                            >

                                {showConfirmPassword
                                    ? "Hide"
                                    : "Show"}

                            </button>

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div
                            className="form-error"
                            role="alert"
                        >
                            {error}
                        </div>

                    )}


                    {/* SUBMIT */}

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Creating Account..."
                            : "Create Account"}

                    </button>

                </form>


                {/* LOGIN */}

                <div className="login-link">

                    <span>
                        Already have an account?
                    </span>


                    <Link to="/login">
                        Login
                    </Link>

                </div>


                {/* TERMS */}

                <div className="terms">

                    By creating an account, you agree
                    to our{" "}

                    <Link to="/terms">
                        Terms of Service
                    </Link>

                    {" "}and{" "}

                    <Link to="/privacy">
                        Privacy Policy
                    </Link>

                    .

                </div>

            </div>

        </div>
    );
};


export default Register;