import { createContext, useCallback, useEffect, useRef, useState } from "react";
import {
    deleteSong,
    getSongs,
    uploadSong,
} from "./services/adminSongs.service.js";

const AdminSongsContext = createContext(null);

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || fallback;

export const AdminSongsProvider = ({ children }) => {
    const [songs, setSongs] = useState([]);
    const hasLoadedSongs = useRef(false);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deletingSongId, setDeletingSongId] = useState(null);
    const [error, setError] = useState("");

    const refreshSongs = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const loadedSongs = await getSongs();
            hasLoadedSongs.current = true;
            setSongs(loadedSongs);
            return true;
        } catch (loadError) {
            if (!hasLoadedSongs.current) {
                setSongs([]);
            }
            setError(
                getErrorMessage(loadError, "Unable to load songs from the database.")
            );
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let isActive = true;

        const loadInitialSongs = async () => {
            try {
                const loadedSongs = await getSongs();
                if (!isActive) return;

                hasLoadedSongs.current = true;
                setSongs(loadedSongs);
            } catch (loadError) {
                if (!isActive) return;

                setError(
                    getErrorMessage(
                        loadError,
                        "Unable to load songs from the database."
                    )
                );
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        loadInitialSongs();

        return () => {
            isActive = false;
        };
    }, []);

    const handleUpload = async ({ mood, file }) => {
        setUploading(true);
        setError("");

        try {
            await uploadSong({ mood, file });
            await refreshSongs();
            return true;
        } catch (uploadError) {
            setError(
                getErrorMessage(uploadError, "Unable to upload this song.")
            );
            return false;
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (songId) => {
        setDeletingSongId(songId);
        setError("");

        try {
            await deleteSong(songId);
            await refreshSongs();
            return true;
        } catch (deleteError) {
            setError(
                getErrorMessage(deleteError, "Unable to delete this song.")
            );
            return false;
        } finally {
            setDeletingSongId(null);
        }
    };

    return (
        <AdminSongsContext.Provider
            value={{
                songs,
                loading,
                uploading,
                deletingSongId,
                error,
                handleUpload,
                handleDelete,
            }}
        >
            {children}
        </AdminSongsContext.Provider>
    );
};

export default AdminSongsContext;
