import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { detectExpression, setup } from "../utils/utils.js";
import { useAuth } from "../../auth/hooks/useAuth.js"
import Loader from "../../auth/components/Loader.jsx";
import Player from "../../Home/components/Player.jsx";
import { useSong } from "../../Home/hooks/useSongs.js";
import { getErrorMessage } from "../../../services/errorMessage.js";
import "../style/FaceExpression.scss";

const FaceExpression = () => {
    const navigate = useNavigate();
    const { loading: authLoading, handleLogout } = useAuth();
    const { handleGetSongs, preparePlayback, restorePlaybackAudio } = useSong();
    const videoRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const streamRef = useRef(null);
    const setupTokenRef = useRef(null);

    const [expression, setExpression] =
        useState("Camera loading...");

    const [detecting, setDetecting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [cameraReady, setCameraReady] =
        useState(false);

    const [isLoggingOut, setIsLoggingOut] =
        useState(false);
 
    const handleDetectExpression = async () => {
        preparePlayback();

        let detectedExpression;
        try {
            detectedExpression = await detectExpression({
                videoRef,
                faceLandmarkerRef,
                setLoading: setDetecting,
                setError,
                setExpression,
            });
        } catch (error) {
            console.error("Unable to detect expression:", error);
            setError("Unable to detect an expression. Please try again.");
            restorePlaybackAudio();
            return;
        }

        console.log(detectedExpression);
        if (!detectedExpression || detectedExpression === "no-face") {
            restorePlaybackAudio();
            return;
        }

        try {
            await handleGetSongs({ mood: detectedExpression });
        } catch (error) {
            console.error("Unable to load a song for the detected expression:", error);
            setError(getErrorMessage(
                error,
                "Expression detected, but a matching song could not be loaded."
            ));
            restorePlaybackAudio();
        }
    };

    const stopCamera = (resetState = false) => {
        if (setupTokenRef.current) {
            setupTokenRef.current.cancelled = true;
            setupTokenRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current
                .getTracks()
                .forEach((track) => track.stop());

            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.onloadedmetadata = null;
        }

        if (faceLandmarkerRef.current) {
            faceLandmarkerRef.current.close();
            faceLandmarkerRef.current = null;
        }

        if (resetState) {
            setCameraReady(false);
            setExpression("Camera stopped.");
            setError("");
        }
    };

    const startCamera = () => {
        const setupToken = { cancelled: false };
        setupTokenRef.current = setupToken;

        setup({
            videoRef,
            faceLandmarkerRef,
            streamRef,
            setupToken,
            setError,
            setExpression,
            setCameraReady,
        });
    };

    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
        };
    }, []);

    const handleLogoutProcess = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        stopCamera(true);

        try {
            await handleLogout();

            window.setTimeout(() => {
                navigate("/login", { replace: true });
            }, 220);
        } catch (error) {
            console.error("Logout failed:", error);
            setError(getErrorMessage(error, "Unable to log out. Please try again."));
            setIsLoggingOut(false);
            startCamera();
        }
    };

    if (authLoading) {
        return <Loader text="Checking your session..." />;
    }
   
    return (
      <>
        <div className="logout-bar">
            <div className="logout-badge">Face AI</div>
            <button
                type="button"
                className={`logout-button${isLoggingOut ? " is-logging-out" : ""}`}
                onClick={handleLogoutProcess}
                aria-label="Log out of the app"
                disabled={isLoggingOut}
            >
                {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
        </div>
        <main className="expression-app">
            <header className="expression-header">
                <p className="eyebrow">Real-time computer vision</p>
                <h1>Face Expression Detector</h1>
                <p className="intro">Use your camera to identify the expression in front of you.</p>
            </header>

            {error && (
                <div className="expression-error" role="alert">
                    {error}
                </div>
            )}

            <section className="camera-stage" aria-label="Camera preview">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    width="640"
                    height="480"
                    className="camera-video"
                />
                {!cameraReady && <div className="camera-overlay">Preparing camera...</div>}
            </section>

            <div className="expression-controls">
                <section className="expression-result" aria-live="polite">
                    <p className="result-label">Detected expression</p>
                    <h2>{expression}</h2>
                </section>

                <button
                    onClick={handleDetectExpression}
                    disabled={!cameraReady || detecting}
                    className="detect-button"
                >
                    {detecting
                        ? "Detecting..."
                        : "Detect Expression"}
                </button>
                <p className="privacy-note">Your camera feed stays in this browser.</p>
            </div>

            <Player />
        </main></>
    );
};

export default FaceExpression;