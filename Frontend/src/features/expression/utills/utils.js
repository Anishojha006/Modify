import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

export function getScore(blendshapes, name) {
    const shape = blendshapes.find(
      (item) =>
        item.categoryName === name
    );

    if (shape) {
      return shape.score;
    }

    return 0;
  }

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
      (browDownLeft +
        browDownRight) / 2;

    if (smile > 0.5) {
      return "😊 Happy";
    }

    if (frown > 0.3) {
      return "😢 Sad";
    }

    if (
      jawOpen > 0.6 &&
      browUp > 0.3
    ) {
      return "😮 Surprised";
    }

    if (browDown > 0.5) {
      return "😠 Angry";
    }

    return "😐 Neutral";
  }

export function detectExpression({videoRef,faceLandmarkerRef,setLoading,setError,setExpression}) {
    if (!faceLandmarkerRef.current) {
      setError(
        "MediaPipe is not ready yet."
      );

      return;
    }

    if (!videoRef.current) {
      setError(
        "Video is not available."
      );

      return;
    }

    const video =
      videoRef.current;

    if (video.readyState < 2) {
      setError(
        "Camera is not ready yet."
      );

      return;
    }

    try {
      setLoading(true);

      setError("");

      const result =
        faceLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

      if (
        !result.faceBlendshapes ||
        result.faceBlendshapes.length === 0
      ) {
        setExpression(
          "👤 No face detected"
        );

        setLoading(false);

        return;
      }

      const blendshapes =
        result.faceBlendshapes[0]
          .categories;

      const detectedExpression =
        getExpression(
          blendshapes
        );

      setExpression(
        detectedExpression
      );

      setLoading(false);

    } catch (err) {
      console.error(
        "Expression detection error:",
        err
      );

      setError(
        "Failed to detect expression."
      );

      setLoading(false);
    }
  }

export async function setup({videoRef,faceLandmarkerRef,streamRef,setupToken,setError,setExpression,setCameraReady}) {
      let faceLandmarker;
      let stream;

      try {
        setError("");
  
        setExpression(
          "⏳ Loading MediaPipe..."
        );
  
        console.log(
          "Loading MediaPipe..."
        );
  
        const vision =
          await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
  
        console.log(
          "MediaPipe loaded"
        );

        if (setupToken.cancelled) {
          return;
        }
  
        faceLandmarker =
          await FaceLandmarker.createFromOptions(
            vision,
            {
              baseOptions: {
                modelAssetPath:
                  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  
                delegate: "GPU"
              },
  
              runningMode: "VIDEO",
  
              numFaces: 1,
  
              outputFaceBlendshapes: true,
  
              minFaceDetectionConfidence: 0.5,
  
              minFacePresenceConfidence: 0.5,
  
              minTrackingConfidence: 0.5
            }
          );

        if (setupToken.cancelled) {
          faceLandmarker.close();
          return;
        }
  
        console.log(
          "FaceLandmarker created"
        );
  
        faceLandmarkerRef.current =
          faceLandmarker;
  
        stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: {
                width: 640,
  
                height: 480,
  
                facingMode: "user"
              },
  
              audio: false
            }
          );

        if (setupToken.cancelled) {
          stream.getTracks().forEach((track) => track.stop());

          if (faceLandmarkerRef.current === faceLandmarker) {
            faceLandmarker.close();
            faceLandmarkerRef.current = null;
          }

          return;
        }
  
        console.log(
          "Camera access granted"
        );
  
        streamRef.current =
          stream;
  
        const video =
          videoRef.current;
  
        video.srcObject =
          stream;
  
        video.onloadedmetadata =
          () => {
            if (setupToken.cancelled) {
              return;
            }

            console.log(
              "Camera is ready"
            );
  
            setCameraReady(
              true
            );
  
            setExpression(
              "😐 Ready — click Detect Expression"
            );
          };
  
      } catch (err) {
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }

        if (
          faceLandmarker &&
          (!setupToken.cancelled ||
            faceLandmarkerRef.current === faceLandmarker)
        ) {
          faceLandmarker.close();
        }

        if (faceLandmarkerRef.current === faceLandmarker) {
          faceLandmarkerRef.current = null;
        }

        if (setupToken.cancelled) {
          return;
        }

        console.error(
          "Setup error:",
          err
        );
  
        setError(
          err.message ||
            "Unable to start camera or MediaPipe."
        );
  
        setExpression(
          "❌ Error"
        );
      }
    }