import { useCallback, useEffect, useRef, useState } from "react";
import { useSong } from "../hooks/useSongs.js";
import "../style/player.scss";

const FALLBACK_SONG = {
    title: "Untitled Track",
    mood: "Chill",
    url: "",
};

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");

    return `${minutes}:${remainingSeconds}`;
};

const Player = () => {
    const songContext = useSong();
    const song = songContext?.song ?? FALLBACK_SONG;
    const playRequest = songContext?.playRequest ?? 0;
    const { registerAudioElement } = songContext;
    const audioRef = useRef(null);
    const lastPlayRequestRef = useRef(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.72);

    const handleLoadedMetadata = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    }, []);

    const handleTimeUpdate = useCallback(() => {
        const audio = audioRef.current;
        if (!audio) return;

        setCurrentTime(audio.currentTime || 0);
    }, []);

    const handleEnded = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
    }, []);

    useEffect(() => {
        registerAudioElement(audioRef.current);
        return () => registerAudioElement(null);
    }, [registerAudioElement]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return undefined;

        audio.volume = volume;
        audio.addEventListener("loadedmetadata", handleLoadedMetadata);
        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);

        return () => {
            audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
        };
    }, [handleEnded, handleLoadedMetadata, handleTimeUpdate, volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.pause();
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);

        if (playRequest === 0 || playRequest === lastPlayRequestRef.current || !song.url) return;

        lastPlayRequestRef.current = playRequest;
        audio.muted = false;
        audio.load();
        audio.play()
            .then(() => setIsPlaying(true))
            .catch((error) => {
                console.error("Unable to autoplay detected-mood song:", error);
                setIsPlaying(false);
            });
    }, [playRequest, song.url]);

    const togglePlayback = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || !song.url) return;

        if (audio.paused) {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (error) {
                console.error("Unable to play song:", error);
            }
            return;
        }

        audio.pause();
        setIsPlaying(false);
    }, [song.url]);

    const handleSeek = useCallback((event) => {
        const nextValue = Number(event.target.value);
        const audio = audioRef.current;

        if (!audio) return;

        audio.currentTime = nextValue;
        setCurrentTime(nextValue);
    }, []);

    const handleVolumeChange = useCallback((event) => {
        const nextValue = Number(event.target.value);
        const audio = audioRef.current;

        if (audio) {
            audio.volume = nextValue;
        }

        setVolume(nextValue);
    }, []);

    const trackTitle = song.title || FALLBACK_SONG.title;
    const mood = song.mood || FALLBACK_SONG.mood;

    return (
        <aside className="player-shell" aria-label="Music player">
            <div className="player-card">
                <div className={`player-art-wrap${isPlaying ? " is-playing" : ""}`}>
                    <div className={`player-disc${isPlaying ? " is-playing" : ""}`}>
                        <div className="player-disc-hole" aria-hidden="true" />
                    </div>
                </div>

                <div className="player-info">
                    <p className="player-kicker">Now playing</p>
                    <h3>{trackTitle}</h3>
                    <span className="player-mood-pill">{mood}</span>
                </div>

                <div className="player-progress">
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        aria-label="Seek through song"
                    />
                    <div className="player-times">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <div className="player-controls">
                    <button
                        type="button"
                        className="player-control"
                        aria-label="Previous track"
                        disabled
                        title="Previous track unavailable"
                    >
                        ⏮
                    </button>
                    <button
                        type="button"
                        className="player-control player-control-primary"
                        aria-label={isPlaying ? "Pause" : "Play"}
                        onClick={togglePlayback}
                        disabled={!song.url}
                    >
                        {isPlaying ? "❚❚" : "▶"}
                    </button>
                    <button
                        type="button"
                        className="player-control"
                        aria-label="Next track"
                        disabled
                        title="Next track unavailable"
                    >
                        ⏭
                    </button>
                </div>

                <div className="player-volume">
                    <span>Volume</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        aria-label="Volume"
                    />
                </div>

                <audio ref={audioRef} src={song.url} preload="metadata" />
            </div>
        </aside>
    );
};

export default Player;
