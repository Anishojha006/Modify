import { createContext, useCallback, useRef, useState } from "react";

export const SongContext = createContext();

export const SongContextProvider = ({ children }) => {
    const [song, setSong] = useState({
        "url": "https://ik.imagekit.io/hnoglysw00/cohort-2/moodify/songs/Lady_Singham_gs01DFz-1.mp3",
        "posterUrl": "https://ik.imagekit.io/hnoglysw00/cohort-2/moodify/posters/Lady_Singham_WW8DGJkie",
        "title": "Lady Singham",
        "mood": "happy"
    });

    const [loading, setLoading] = useState(false);
    const [playRequest, setPlayRequest] = useState(0);
    const audioRef = useRef(null);

    const registerAudioElement = useCallback((audioElement) => {
        audioRef.current = audioElement;
    }, []);

    const preparePlayback = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || !audio.paused || !audio.currentSrc) return;

        audio.muted = true;
        audio.play().catch((error) => {
            console.error("Unable to prepare automatic playback:", error);
        });
    }, []);

    const restorePlaybackAudio = useCallback(() => {
        if (audioRef.current) audioRef.current.muted = false;
    }, []);

    return (
        <SongContext.Provider value={{
            song,
            setSong,
            loading,
            setLoading,
            playRequest,
            setPlayRequest,
            registerAudioElement,
            preparePlayback,
            restorePlaybackAudio,
        }}>
            {children}
        </SongContext.Provider>
    );
};