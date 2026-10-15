import { useContext } from "react";
import { SongContext } from "../context/song.context.jsx";
import { getSongs } from "../services/song.api.js";

export const useSong = () => {
    const context = useContext(SongContext);

    if (!context) {
        throw new Error("useSong must be used within a SongContextProvider.");
    }

    const {
        song,
        setSong,
        loading,
        setLoading,
        setPlayRequest,
        preparePlayback,
        restorePlaybackAudio,
    } = context;

    const handleGetSongs = async ({ mood }) => {
        setLoading(true);
        try {
            const data = await getSongs({ mood });

            const song = Array.isArray(data.song) ? data.song[0] : data.song;
            if (!song) {
                throw new Error(`No song found for the "${mood}" mood.`);
            }

            setSong(song);
            setPlayRequest((request) => request + 1);
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        song,
        playRequest: context.playRequest,
        handleGetSongs,
        registerAudioElement: context.registerAudioElement,
        preparePlayback,
        restorePlaybackAudio,
    };
};