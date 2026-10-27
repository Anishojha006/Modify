import { useContext } from "react";
import { AdminContext } from "./admin.context.value.js";

export const useAdmin = () => {
    const context = useContext(AdminContext);

    if (!context) {
        throw new Error("useAdmin must be used inside AdminProvider");
    }

    return context;
};
