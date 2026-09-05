import { useEffect, useRef, useState } from "react";
import { getExpression, getScore, detectExpression, setup } from "../utills/utils";

const FaceExpression = () => {
    // ==========================================
    // REFS
    // ==========================================

    const videoRef = useRef(null);

    const faceLandmarkerRef = useRef(null);

    const streamRef = useRef(null);

    // ==========================================
    // STATE
    // ==========================================

    const [expression, setExpression] =
        useState("Camera loading...");

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [cameraReady, setCameraReady] =
        useState(false);

    useEffect(() => {
        setup({ videoRef, faceLandmarkerRef, streamRef, setError, setExpression, setCameraReady });

        // ========================================
        // CLEANUP
        // ========================================

        return () => {
            // ----------------------------------------
            // Stop camera
            // ----------------------------------------

            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => {
                        track.stop();
                    });

                streamRef.current =
                    null;
            }

            // ----------------------------------------
            // Remove video stream
            // ----------------------------------------

            if (videoRef.current) {
                videoRef.current.srcObject =
                    null;

                videoRef.current.onloadedmetadata =
                    null;
            }

            // ----------------------------------------
            // Close MediaPipe
            // ----------------------------------------

            if (
                faceLandmarkerRef.current
            ) {
                faceLandmarkerRef.current.close();

                faceLandmarkerRef.current =
                    null;
            }
        };
    }, []);

    // ==========================================
    // UI
    // ==========================================

    return (
        <div
            style={{
                minHeight: "100vh",

                display: "flex",

                flexDirection: "column",

                alignItems: "center",

                justifyContent: "center",

                gap: "20px",

                padding: "20px",

                background: "#f5f5f5"
            }}
        >

            {/* =====================================
          TITLE
      ====================================== */}

            <h1>
                Face Expression Detector
            </h1>

            {/* =====================================
          ERROR
      ====================================== */}

            {error && (
                <div
                    style={{
                        padding: "12px 20px",

                        background: "#ffe5e5",

                        color: "#c00000",

                        borderRadius: "8px",

                        maxWidth: "600px",

                        textAlign: "center"
                    }}
                >
                    {error}
                </div>
            )}

            {/* =====================================
          CAMERA
      ====================================== */}

            <div
                style={{
                    width: "640px",

                    maxWidth: "90vw",

                    aspectRatio: "4 / 3",

                    background: "#111",

                    borderRadius: "15px",

                    overflow: "hidden",

                    boxShadow:
                        "0 10px 30px rgba(0,0,0,0.15)"
                }}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    width="640"
                    height="480"
                    style={{
                        width: "100%",

                        height: "100%",

                        objectFit: "cover",

                        transform:
                            "scaleX(-1)"
                    }}
                />
            </div>

            {/* =====================================
          EXPRESSION
      ====================================== */}

            <div
                style={{
                    padding: "20px 40px",

                    minWidth: "350px",

                    background: "white",

                    borderRadius: "15px",

                    textAlign: "center",

                    boxShadow:
                        "0 5px 20px rgba(0,0,0,0.08)"
                }}
            >
                <p
                    style={{
                        color: "#777",

                        marginBottom: "10px"
                    }}
                >
                    Detected Expression
                </p>

                <h2>
                    {expression}
                </h2>
            </div>

            {/* =====================================
          DETECT BUTTON
      ====================================== */}

            <button
                onClick={(d) => { detectExpression({ videoRef, faceLandmarkerRef, streamRef, setLoading, setError, setExpression }) }}
                disabled={
                    !cameraReady || loading
                }
                style={{
                    padding: "12px 25px",

                    border: "none",

                    borderRadius: "8px",

                    background:
                        !cameraReady || loading
                            ? "#aaa"
                            : "#1976d2",

                    color: "white",

                    fontSize: "16px",

                    fontWeight: "600",

                    cursor:
                        !cameraReady || loading
                            ? "not-allowed"
                            : "pointer"
                }}
            >
                {loading
                    ? "Detecting..."
                    : "Detect Expression"}
            </button>

        </div>
    );
};

export default FaceExpression;