// Eye/Face Tracking Logic using MediaPipe Face Mesh
let isEyeTrackingActive = false;
const eyeToggleBtn = document.getElementById('eye-tracker-toggle');
let faceMesh = null;
let cameraForEyes = null; // Re-use camera object from gestures? No, camera_utils handles one stream usually, but let's see.

// We need to coordinate with gestures.js because only one camera stream can be active.
// For this portfolio, we either use Hand Tracking OR Eye Tracking, or we need to process the same stream.
// Simplest approach: Toggle between Hand and Eye modes, or use a shared Camera controller.
// Currently gestures.js owns the camera. We should modify gestures.js to support FaceMesh or create a shared state.

// Since I cannot modify gestures.js structure completely without breaking it, we will implement this as a mutually exclusive mode for simplicity.
// If Eye Tracking is ON, Hand Tracking is OFF.

if (eyeToggleBtn) {
    eyeToggleBtn.addEventListener('click', async () => {
        if (!isEyeTrackingActive) {
            await startEyeTracking();
            if (window.toggleVirtualCursor) window.toggleVirtualCursor(true);
        } else {
            stopEyeTracking();
            eyeToggleBtn.innerText = "Enable Eye Tracking";
            eyeToggleBtn.classList.remove('bg-orange-500', 'text-white'); // Changed from 900 to 500
            if (window.toggleVirtualCursor) window.toggleVirtualCursor(false);
        }
    });
}

async function startEyeTracking() {
    // 1. Enforce Exclusivity: Stop Hand Tracking if active
    if (window.appState && window.appState.isHandControlActive && typeof window.stopHandTracking === 'function') {
        console.log("Stopping Hand Tracking to enable Eye Tracking...");
        window.stopHandTracking();
    }

    isEyeTrackingActive = true;

    // Update UI Button State
    if (eyeToggleBtn) {
        eyeToggleBtn.innerText = "Disable Eye Tracking";
        eyeToggleBtn.classList.add('bg-orange-500', 'text-white');
    }

    document.getElementById('virtual-cursor').style.display = 'block';

    const videoElement = document.getElementById('input_video');
    document.getElementById('hand-preview').classList.remove('hidden'); // Re-use preview

    if (!faceMesh) {
        faceMesh = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        faceMesh.onResults(onFaceResults);
    }

    // Check if camera is already running (from gestures.js?)
    // If not, start it.

    if (window.cameraObjEyes) {
        window.cameraObjEyes.start();
    } else {
        window.cameraObjEyes = new Camera(videoElement, {
            onFrame: async () => {
                await faceMesh.send({ image: videoElement });
            },
            width: 320,
            height: 240
        });
        window.cameraObjEyes.start();
    }
}

function stopEyeTracking() {
    isEyeTrackingActive = false;
    eyeToggleBtn.innerText = "Enable Eye Tracking";
    eyeToggleBtn.classList.remove('bg-orange-900', 'text-white');

    if (window.cameraObjEyes) window.cameraObjEyes.stop();
    document.getElementById('hand-preview').classList.add('hidden');
    document.getElementById('virtual-cursor').style.display = 'none';
}
window.stopEyeTracking = stopEyeTracking;

function onFaceResults(results) {
    const canvasElement = document.getElementById('hand-canvas');
    const canvasCtx = canvasElement.getContext('2d');

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Draw mesh
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });

        // Simple Gaze/Nose Tracking to control cursor
        // Nose tip is index 1 or 4.
        const noseTip = landmarks[4];

        // Map Nose position to Screen Code (Similar to Hand Tracking)
        // Invert X for mirror effect
        let x = 1 - noseTip.x;
        let y = noseTip.y;

        // Apply sensitivity/scaling to make it easier to reach corners
        // Center is 0.5. Let's expand the range.
        x = (x - 0.5) * 2.5 + 0.5;
        y = (y - 0.5) * 2.5 + 0.5;

        // Clamp
        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        // Smooth update
        const smooth = 0.1;
        window.appState.cursorX = window.appState.cursorX + (x * window.innerWidth - window.appState.cursorX) * smooth;
        window.appState.cursorY = window.appState.cursorY + (y * window.innerHeight - window.appState.cursorY) * smooth;

        // Update Cursor UI
        const cursor = document.getElementById('virtual-cursor');
        cursor.style.left = `${window.appState.cursorX}px`;
        cursor.style.top = `${window.appState.cursorY}px`;

        // Update Global State for 3D Background parallax
        // Update Global State for 3D Background parallax
        window.appState.mouseX = (x - 0.5);
        window.appState.mouseY = (y - 0.5);

        // --- OptiKey Style Dwell Click Implementation ---
        checkDwellClick(window.appState.cursorX, window.appState.cursorY);

        // --- Gaze Scrolling Implementation ---
        handleGazeScroll(window.appState.cursorY);
    }
    canvasCtx.restore();
}

function handleGazeScroll(cursorY) {
    const scrollThreshold = 100; // Pixels from top/bottom
    const scrollSpeed = 15;

    const topIndicator = document.getElementById('scroll-indicator-top');
    const bottomIndicator = document.getElementById('scroll-indicator-bottom');

    if (cursorY < scrollThreshold) {
        // Scroll Up
        window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
        if (topIndicator) topIndicator.style.opacity = '1';
    } else {
        if (topIndicator) topIndicator.style.opacity = '0';
    }

    if (cursorY > window.innerHeight - scrollThreshold) {
        // Scroll Down
        window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
        if (bottomIndicator) bottomIndicator.style.opacity = '1';
    } else {
        if (bottomIndicator) bottomIndicator.style.opacity = '0';
    }
}

let dwellTimer = null;
let lastHoveredElement = null;
const DWELL_TIME_MS = 1200; // 1.2 seconds to click
const dwellIndicator = document.getElementById('dwell-indicator');

function checkDwellClick(x, y) {
    // Hide indicator by default
    if (!dwellIndicator) return;

    // Find element under cursor
    const element = document.elementFromPoint(x, y);

    // Check if element is clickable
    const isClickable = element && (
        element.tagName === 'A' ||
        element.tagName === 'BUTTON' ||
        element.onclick != null ||
        element.closest('a') ||
        element.closest('button')
    );

    const target = isClickable ? (element.closest('a') || element.closest('button') || element) : null;

    if (target) {
        if (target !== lastHoveredElement) {
            // New target found, start timer
            resetDwell();
            lastHoveredElement = target;

            // Start Animation
            dwellIndicator.style.display = 'block';
            // Reset animation
            dwellIndicator.style.animation = 'none';
            dwellIndicator.offsetHeight; /* trigger reflow */
            dwellIndicator.style.animation = `spin ${DWELL_TIME_MS}ms linear forwards`;

            dwellTimer = setTimeout(() => {
                // Time's up: CLICK!
                if (lastHoveredElement) {
                    lastHoveredElement.click();

                    // Visual feedback
                    const cursor = document.getElementById('virtual-cursor');
                    cursor.classList.add('clicking');
                    setTimeout(() => cursor.classList.remove('clicking'), 200);

                    resetDwell(); // Stop clicking repeatedly immediately
                }
            }, DWELL_TIME_MS);
        }
    } else {
        // Not hovering anything clickable
        resetDwell();
        lastHoveredElement = null;
    }
}

function resetDwell() {
    if (dwellTimer) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
    }
    if (dwellIndicator) {
        dwellIndicator.style.display = 'none';
        dwellIndicator.style.animation = 'none';
    }
}
