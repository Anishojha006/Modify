import { useEffect, useRef, useState } from "react";
import { detectExpression, setup } from "../utills/utils";
import { useAuth } from "../../auth/hooks/useAuth.js"
import Loader from "../../auth/componenets/Loader.jsx";

const FaceExpression = () => {
    const { loading: authLoading } = useAuth();
    const videoRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const streamRef = useRef(null);

    const [expression, setExpression] =
        useState("Camera loading...");

    const [detecting, setDetecting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [cameraReady, setCameraReady] =
        useState(false);

    useEffect(() => {
        setup({ videoRef, faceLandmarkerRef, streamRef, setError, setExpression, setCameraReady });

        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current =
                    null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject =
                    null;

                videoRef.current.onloadedmetadata =
                    null;
            }

            if (faceLandmarkerRef.current) {
                faceLandmarkerRef.current.close();

                faceLandmarkerRef.current =
                    null;
            }
        };
    }, []);

    if (authLoading) {
        return <Loader text="Checking your session..." />;
    }

    return (
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

            <section className="expression-result" aria-live="polite">
                <p className="result-label">Detected expression</p>
                <h2>{expression}</h2>
            </section>

            <button
                onClick={() => { detectExpression({ videoRef, faceLandmarkerRef, setLoading: setDetecting, setError, setExpression }) }}
                disabled={
                    !cameraReady || detecting
                }
                className="detect-button"
            >
                {detecting
                    ? "Detecting..."
                    : "Detect Expression"}
            </button>
            <p className="privacy-note">Your camera feed stays in this browser.</p>
        </main>
    );
};

export default FaceExpression;