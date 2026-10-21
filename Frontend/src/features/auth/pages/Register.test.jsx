import { useAuth } from "../hooks/useAuth.js";
import Register from "./Register.jsx";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

vi.mock("../hooks/useAuth.js", () => ({
    useAuth: vi.fn(),
}));

function renderRegister(handleRegister = vi.fn()) {
    useAuth.mockReturnValue({ handleRegister, loading: false });

    return {
        handleRegister,
        ...render(
            <MemoryRouter initialEntries={["/register"]}>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={<h1>Dashboard</h1>}
                    />
                </Routes>
            </MemoryRouter>,
        ),
    };
}

describe("Register page", () => {
    async function fillValidForm(user) {
        await user.type(screen.getByLabelText("Username"), "new-member");
        await user.type(screen.getByLabelText("Email"), "new@example.com");
        await user.type(screen.getByLabelText("Password"), "safe-password");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "safe-password",
        );
    }

    it("rejects mismatched passwords without calling the API", async () => {
        const user = userEvent.setup();
        const handleRegister = vi.fn();
        renderRegister(handleRegister);

        await user.type(screen.getByLabelText("Username"), "new-member");
        await user.type(screen.getByLabelText("Email"), "new@example.com");
        await user.type(screen.getByLabelText("Password"), "safe-password");
        await user.type(
            screen.getByLabelText("Confirm Password"),
            "different-password",
        );
        await user.click(screen.getByRole("button", { name: "Create Account" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "Passwords do not match.",
        );
        expect(handleRegister).not.toHaveBeenCalled();
    });

    it("registers valid input and navigates to the dashboard", async () => {
        const user = userEvent.setup();
        const handleRegister = vi.fn().mockResolvedValue({ user: { id: "1" } });
        renderRegister(handleRegister);

        await fillValidForm(user);
        await user.click(screen.getByRole("button", { name: "Create Account" }));

        await screen.findByRole("heading", { name: "Dashboard" });
        expect(handleRegister).toHaveBeenCalledWith({
            username: "new-member",
            email: "new@example.com",
            password: "safe-password",
        });
    });

    it("renders an API error without navigating", async () => {
        const user = userEvent.setup();
        const handleRegister = vi.fn().mockRejectedValue({
            response: { data: { message: "User already registered" } },
        });
        renderRegister(handleRegister);

        await fillValidForm(user);
        await user.click(screen.getByRole("button", { name: "Create Account" }));

        expect(await screen.findByRole("alert")).toHaveTextContent(
            "User already registered",
        );
        expect(screen.queryByRole("heading", { name: "Dashboard" })).toBeNull();
    });
});
