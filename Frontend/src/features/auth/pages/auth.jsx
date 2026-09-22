
import { useState } from "react";
import "./Register.scss";
import { useProfile } from '../hooks/useAuth.js'

const Register = () => {
    const {  user,loading, handleLogin , handleRegister } = useProfile();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const register = async (username, email, password) => {
        try {

            await handleRegister(username, email, password);

        }
        catch (err) {
            throw error("Internal server error");
        }


    }
   if(loading){
    
   }
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setError("");
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const {
            username,
            email,
            password,
            confirmPassword,
        } = formData;

        if (!username || !email || !password || !confirmPassword) {
            setError("Please fill in all fields.");
            return;
        }

        if (username.length < 3) {
            setError("Username must contain at least 3 characters.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        console.log("Registration Data:", {
            username,
            email,
            password,
        });

    };

    return (
        <div className="register-page">

            <div className="register-card">

                <div className="register-header">


                    <div className="logo">
                        Moodify
                    </div>

                    <h1>Create your account</h1>

                    <p>
                        Join us today and get started.
                    </p>
                </div>

                <form
                    className="register-form"
                    onSubmit={handleSubmit}
                >


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
                        />
                    </div>


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
                        />
                    </div>

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
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        !showPassword
                                    )
                                }
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>

                        <small>
                            Minimum 8 characters
                        </small>
                    </div>

                    {/* Confirm Password */}
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
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowConfirmPassword(
                                        !showConfirmPassword
                                    )
                                }
                            >
                                {showConfirmPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="form-error">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        className="register-button"
                    >
                        Create Account
                    </button>

                </form>

                <div className="login-link">
                    Already have an account?
                    <a href="/login">
                        Login
                    </a>
                </div>

                <div className="terms">
                    By creating an account, you agree to our
                    <a href="/terms"> Terms of Service </a>
                    and
                    <a href="/privacy"> Privacy Policy</a>.
                </div>

            </div>

        </div>
    );
};

export default Register;

