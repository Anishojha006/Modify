import { useContext } from "react";
import AdminSongsContext from "../adminSongs.context.jsx";

const useAdminSongs = () => {
    const context = useContext(AdminSongsContext);

    if (!context) {
        throw new Error(
            "useAdminSongs must be used inside AdminSongsProvider."
        );
    }

    return context;
};

export default useAdminSongs;
