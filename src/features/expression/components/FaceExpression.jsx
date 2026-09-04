import { useEffect, useRef, useState } from "react";
import {
  FaceLandmarker,
  FilesetResolver
} from "@mediapipe/tasks-vision";

const FaceExpression = () => {
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const streamRef = useRef(null);

  const [expression, setExpression] = useState("Loading...");
  const [error, setError] = useState("");
  let mounted = true;

   const setup = async () => {
      try {
        // 1. Load MediaPipe vision files
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        // 2. Create Face Landmarker
        const faceLandmarker =
          await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",

              delegate: "GPU"
            },

            outputFaceBlendshapes: true,

            runningMode: "VIDEO",

            numFaces: 1
          });

        if (!mounted) return;

        faceLandmarkerRef.current = faceLandmarker;

        // 3. Ask user for camera permission
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: 640,
              height: 480
            },
            audio: false
          });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        // 4. Connect camera stream to video
        videoRef.current.srcObject = stream;

        // 5. Start detection after video starts
        videoRef.current.onloadeddata = () => {
          detectExpression();
        };
      } catch (err) {
        console.error(err);

        if (mounted) {
          setError(
            "Unable to access camera or initialize MediaPipe."
          );
        }
    }
};


  useEffect(() => {
    // ------------------------------------
    // Detect facial expression
    // ------------------------------------
    const detectExpression = () => {
      if (
        !videoRef.current ||
        !faceLandmarkerRef.current
      ) {
        return;
      }

      const video = videoRef.current;

      // Make sure video has actually started
      if (video.readyState < 2) {
        animationRef.current =
          requestAnimationFrame(detectExpression);

        return;
      }

      const result =
        faceLandmarkerRef.current.detectForVideo(
          video,
          performance.now()
        );

      // Check whether a face exists
      if (
        result.faceBlendshapes &&
        result.faceBlendshapes.length > 0
      ) {
        const blendshapes =
          result.faceBlendshapes[0].categories;

        const detectedExpression =
          getExpression(blendshapes);

        if (mounted) {
          setExpression(detectedExpression);
        }
      } else {
        if (mounted) {
          setExpression("No face detected");
        }
      }

      animationRef.current =
        requestAnimationFrame(detectExpression);
    };

    setup();

    // ------------------------------------
    // Cleanup
    // ------------------------------------
    return () => {
      mounted = false;

      // Stop animation
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Stop camera
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      // Close MediaPipe
      if (faceLandmarkerRef.current) {
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  // ------------------------------------
  // Get individual blendshape score
  // ------------------------------------
  const getScore = (blendshapes, name) => {
    const shape = blendshapes.find(
      (item) => item.categoryName === name
    );

    return shape ? shape.score : 0;
  };

  // ------------------------------------
  // Determine expression
  // ------------------------------------
  const getExpression = (blendshapes) => {
    // Smile
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

    // Frown
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

    // Jaw
    const jawOpen = getScore(
      blendshapes,
      "jawOpen"
    );

    // Eyebrows
    const browUp = getScore(
      blendshapes,
      "browInnerUp"
    );

    // Brows down
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

    // ----------------------------
    // Expression rules
    // ----------------------------
  
    console.log(frown);
  
    if (smile > 0.5) {
      return "😊 Happy";
    }

    if (frown > 0.01) {
      return "😢 Sad";
    }
  
    if (jawOpen > 0.2 &&     browUp > 0.4) {
      return "😮 Surprised";
    }

    if (browDown > 0.3) {
      return "😠 Angry";
    }

    return "😐 Neutral";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px"
      }}
    >
      <h1>Face Expression Detector</h1>

      {error && (
        <p style={{ color: "red" }}>
          {error}
        </p>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        width="640"
        height="480"
        style={{
          borderRadius: "12px",
          objectFit: "cover"
        }}
      />

      <div>
        <h2>
          Expression: {expression}
        </h2>
      </div>
    </div>
  );
};

export default FaceExpression;