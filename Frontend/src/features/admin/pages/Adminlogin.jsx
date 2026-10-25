import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Loader from "../../auth/components/Loader.jsx";
import { useAdmin } from "../admin.context.jsx";
import "../style/Adminlogin.scss";

const Adminlogin = () => {
    const { admin, loading: adminLoading, handleLogin } = useAdmin();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await handleLogin(formData);
            navigate("/admin/songs", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message || "Login failed. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    if (adminLoading) {
        return <Loader text="Checking your admin session..." />;
    }

    if (admin) {
        return <Navigate to="/admin/songs" replace />;
    }

    return (
        <main className="admin-login">
            <form
                className="admin-login__form"
                onSubmit={handleSubmit}
            >
                <h1 className="admin-login__title">
                    Moodify Admin
                </h1>

                <div className="admin-login__field">
                    <label htmlFor="admin-username">
                        Username
                    </label>

                    <input
                        id="admin-username"
                        name="username"
                        type="text"
                        placeholder="Enter your username"
                        autoComplete="username"
                        autoCapitalize="none"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="admin-login__field">
                    <label htmlFor="admin-password">
                        Password
                    </label>

                    <input
                        id="admin-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                {error && (
                    <p className="admin-login__error" role="alert">
                        {error}
                    </p>
                )}

                <button
                    className="admin-login__submit"
                    type="submit"
                    disabled={loading || adminLoading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </main>
    );
};

export default Adminlogin;
