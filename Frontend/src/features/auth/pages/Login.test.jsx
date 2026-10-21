import { useAuth } from "../hooks/useAuth.js";
import Login from "./Login.jsx";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../hooks/useAuth.js", () => ({
    useAuth: vi.fn(),
}));

function renderLogin(handleLogin = vi.fn()) {
    useAuth.mockReturnValue({ handleLogin, loading: false });

    return {
        handleLogin,
        ...render(
            <MemoryRouter initialEntries={["/login"]}>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={<h1>Dashboard</h1>}
                    />
                </Routes>
            </MemoryRouter>,
        ),
    };
}

describe("Login page", () => {
    it("submits an email and navigates after successful login", async () => {
        const user = userEvent.setup();
        const handleLogin = vi.fn().mockResolvedValue({ user: { id: "1" } });
        renderLogin(handleLogin);

        await user.type(screen.getByLabelText("Email"), "member@example.com");
        await user.type(screen.getByLabelText("Password"), "correct-horse");
        await user.click(screen.getByRole("button", { name: "Login" }));

        await screen.findByRole("heading", { name: "Dashboard" });
        expect(handleLogin).toHaveBeenCalledWith({
            email: "member@example.com",
            password: "correct-horse",
        });
    });

    it("switches to username authentication", async () => {
        const user = userEvent.setup();
        renderLogin();

        await user.click(screen.getByRole("button", { name: "Username" }));

        expect(screen.getByLabelText("Username")).toHaveAttribute("type", "text");
    });

    it("shows an authentication error and stays on the login page", async () => {
        const user = userEvent.setup();
        const handleLogin = vi.fn().mockRejectedValue(
            new Error("Invalid credentials"),
        );
        renderLogin(handleLogin);

        await user.type(screen.getByLabelText("Email"), "member@example.com");
        await user.type(screen.getByLabelText("Password"), "wrong-password");
        await user.click(screen.getByRole("button", { name: "Login" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Invalid credentials",
        );
        expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
    });
});
