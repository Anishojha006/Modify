import {
    FaceLandmarker,
    FilesetResolver,
} from "@mediapipe/tasks-vision";

/**
 * Get the score of a particular facial blendshape.
 */
export function getScore(blendshapes, name) {
    if (!Array.isArray(blendshapes)) {
        return 0;
    }

    const shape = blendshapes.find(
        (item) => item.categoryName === name
    );

    return shape?.score ?? 0;
}

/**
 * Detect expression from MediaPipe blendshapes.
 *
 * Returns:
 * "happy"
 * "sad"
 * "surprised"
 * "angry"
 * "neutral"
 */
export function getExpression(blendshapes) {
    const smileLeft = getScore(
        blendshapes,
        "mouthSmileLeft"
    );

    const smileRight = getScore(
        blendshapes,
        "mouthSmileRight"
    );

    const smile =
        (smileLeft + smileRight) / 2;

    const frownLeft = getScore(
        blendshapes,
        "mouthFrownLeft"
    );

    const frownRight = getScore(
        blendshapes,
        "mouthFrownRight"
    );

    const frown =
        (frownLeft + frownRight) / 2;

    const jawOpen = getScore(
        blendshapes,
        "jawOpen"
    );

    const browUp = getScore(
        blendshapes,
        "browInnerUp"
    );

    const browDownLeft = getScore(
        blendshapes,
        "browDownLeft"
    );

    const browDownRight = getScore(
        blendshapes,
        "browDownRight"
    );

    const browDown =
        (browDownLeft + browDownRight) / 2;

    /*
     * Order is important.
     * We check stronger expressions first.
     */

    if (smile > 0.5) {
        return "happy";
    }

    if (frown > 0.3) {
        return "sad";
    }

    if (
        jawOpen > 0.6 &&
        browUp > 0.3
    ) {
        return "surprised";
    }

    if (browDown > 0.5) {
        return "angry";
    }

    return "neutral";
}

/**
 * Detect the expression from the current video frame.
 *
 * IMPORTANT:
 * This function RETURNS the detected expression.
 */
export async function detectExpression({
    videoRef,
    faceLandmarkerRef,
    setError,
    setExpression,
}) {
    if (!faceLandmarkerRef?.current) {
        setError("MediaPipe is not ready yet.");
        return null;
    }

    if (!videoRef?.current) {
        setError("Video is not available.");
        return null;
    }

    const video = videoRef.current;

    if (video.readyState < 2) {
        setError("Camera is not ready yet.");
        return null;
    }

    try {
        setError("");

        const result =
            faceLandmarkerRef.current.detectForVideo(
                video,
                performance.now()
            );

        /*
         * No face detected
         */
        if (
            !result.faceBlendshapes ||
            result.faceBlendshapes.length === 0
        ) {
            const expression = "no-face";

            setExpression(expression);

            return expression;
        }

        /*
         * Get first detected face.
         */
        const blendshapes =
            result.faceBlendshapes[0]?.categories ?? [];

        /*
         * Calculate expression.
         */
        const expression =
            getExpression(blendshapes);

        /*
         * Update React state.
         */
        setExpression(expression);

        /*
         * Return expression to caller.
         */
        return expression;

    } catch (error) {
        console.error(
            "Expression detection error:",
            error
        );

        setError(
            "Failed to detect expression."
        );

        return null;

    }
}

/**
 * Setup MediaPipe and camera.
 */
export async function setup({
    videoRef,
    faceLandmarkerRef,
    streamRef,
    setupToken,
    setError,
    setExpression,
    setCameraReady,
}) {
    let faceLandmarker = null;
    let stream = null;

    try {
        setError("");
        setCameraReady(false);

        setExpression(
            "Loading MediaPipe..."
        );

        console.log(
            "Loading MediaPipe..."
        );

        /*
         * Load MediaPipe WASM files.
         */
        const vision =
            await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
            );

        /*
         * Check whether setup was cancelled.
         */
        if (setupToken.cancelled) {
            return;
        }

        console.log(
            "MediaPipe loaded"
        );

        /*
         * Create FaceLandmarker.
         */
        faceLandmarker =
            await FaceLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",

                        delegate: "GPU",
                    },

                    runningMode: "VIDEO",

                    numFaces: 1,

                    outputFaceBlendshapes: true,

                    minFaceDetectionConfidence: 0.5,

                    minFacePresenceConfidence: 0.5,

                    minTrackingConfidence: 0.5,
                }
            );

        /*
         * Check cancellation again.
         */
        if (setupToken.cancelled) {
            faceLandmarker.close();
            return;
        }

        console.log(
            "FaceLandmarker created"
        );

        faceLandmarkerRef.current =
            faceLandmarker;

        /*
         * Request camera access.
         */
        stream =
            await navigator.mediaDevices.getUserMedia({
                video: {
                    width: 640,
                    height: 480,
                    facingMode: "user",
                },

                audio: false,
            });

        /*
         * Check cancellation after camera permission.
         */
        if (setupToken.cancelled) {
            stream
                .getTracks()
                .forEach((track) =>
                    track.stop()
                );

            faceLandmarker.close();

            if (
                faceLandmarkerRef.current ===
                faceLandmarker
            ) {
                faceLandmarkerRef.current =
                    null;
            }

            return;
        }

        console.log(
            "Camera access granted"
        );

        streamRef.current = stream;

        const video = videoRef.current;

        if (!video) {
            throw new Error(
                "Video element is not available."
            );
        }

        /*
         * Attach camera stream to video.
         */
        video.srcObject = stream;

        /*
         * Wait until video metadata is loaded.
         */
        video.onloadedmetadata = async () => {
            if (setupToken.cancelled) {
                return;
            }

            try {
                await video.play();
            } catch (error) {
                console.error(
                    "Video playback failed:",
                    error
                );
            }

            if (setupToken.cancelled) {
                return;
            }

            console.log(
                "Camera is ready"
            );

            setCameraReady(true);

            setExpression(
                "neutral"
            );
        };

    } catch (error) {
        console.error(
            "Setup error:",
            error
        );

        /*
         * Stop camera if setup fails.
         */
        if (stream) {
            stream
                .getTracks()
                .forEach((track) =>
                    track.stop()
                );
        }

        /*
         * Close MediaPipe.
         */
        if (faceLandmarker) {
            faceLandmarker.close();
        }

        if (
            faceLandmarkerRef.current ===
            faceLandmarker
        ) {
            faceLandmarkerRef.current =
                null;
        }

        if (
            streamRef.current ===
            stream
        ) {
            streamRef.current = null;
        }

        /*
         * Don't update UI if setup was cancelled.
         */
        if (setupToken.cancelled) {
            return;
        }

        /*
         * Better camera error messages.
         */
        if (
            error.name ===
            "NotAllowedError"
        ) {
            setError(
                "Camera permission was denied. Please allow camera access."
            );
        } else if (
            error.name ===
            "NotFoundError"
        ) {
            setError(
                "No camera was found on this device."
            );
        } else if (
            error.name ===
            "NotReadableError"
        ) {
            setError(
                "Camera is already being used by another application."
            );
        } else {
            setError(
                error.message ||
                    "Unable to start camera or MediaPipe."
            );
        }

        setCameraReady(false);

        setExpression(
            "error"
        );
    }
}