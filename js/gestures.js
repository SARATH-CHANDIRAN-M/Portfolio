// --- Gesture Control Logic ---
let handModel = null;
let isHandTracking = false;
const videoElement = document.getElementById('input_video');
const handCanvas = document.getElementById('hand-canvas');
const handCtx = handCanvas ? handCanvas.getContext('2d') : null;

// Toggles
const handToggleBtn = document.getElementById('hand-scroll-toggle');
const previewDiv = document.getElementById('hand-preview');
const virtualCursor = document.getElementById('virtual-cursor');
const instructions = document.getElementById('gesture-instructions');
const closeInstructionsBtn = document.getElementById('close-instructions');

let cameraObj = null;
let clickCooldown = false;

// Smoothing variables
let targetX = window.innerWidth / 2;
let targetY = window.innerHeight / 2;
const smoothFactor = 0.1;

if (handToggleBtn) {
    handToggleBtn.addEventListener('click', async () => {
        if (!isHandTracking) {
            await startHandTracking();
        } else {
            stopHandTracking();
        }
    });
}

if (closeInstructionsBtn) {
    closeInstructionsBtn.addEventListener('click', () => {
        instructions.style.display = 'none';
    });
}

async function startHandTracking() {
    // 1. Enforce Exclusivity: Stop Eye Tracking if active
    if (window.stopEyeTracking && (typeof window.isEyeTrackingActive !== 'undefined' ? window.isEyeTrackingActive : true)) {
        // Note: isEyeTrackingActive might be scoped, but stopEyeTracking ensures it stops.
        // We'll just call it to be safe.
        window.stopEyeTracking();
    }

    isHandTracking = true;
    window.appState.isHandControlActive = true;

    if (handToggleBtn) {
        handToggleBtn.innerText = "Disable Gesture Control";
        handToggleBtn.classList.add('bg-red-500', 'text-white');
    }

    if (previewDiv) previewDiv.classList.remove('hidden');
    if (instructions) instructions.style.display = 'block';

    // Force Cursor Visibility via global toggle
    if (window.toggleVirtualCursor) window.toggleVirtualCursor(true);

    if (cameraObj) {
        await cameraObj.start();
    } else {
        cameraObj = new Camera(videoElement, {
            onFrame: async () => { await hands.send({ image: videoElement }); },
            width: 320, height: 240,
            facingMode: 'user' // IMPORTANT: Use front camera on mobile
        });
        await cameraObj.start();
    }
}

function stopHandTracking() {
    isHandTracking = false;
    window.appState.isHandControlActive = false;

    if (handToggleBtn) {
        handToggleBtn.innerText = "Enable Gesture Control";
        handToggleBtn.classList.remove('bg-red-500', 'text-white');
    }

    if (previewDiv) previewDiv.classList.add('hidden');
    if (instructions) instructions.style.display = 'none';

    // Hide Cursor
    if (window.toggleVirtualCursor) window.toggleVirtualCursor(false);

    if (cameraObj) cameraObj.stop();
}
window.stopHandTracking = stopHandTracking;

const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
});

hands.onResults(onResults);

function countFingers(lm) {
    // Tips: 8 (Index), 12 (Middle), 16 (Ring), 20 (Pinky)
    // PIPs: 6, 10, 14, 18
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    let count = 0;

    tips.forEach((tipIdx, i) => {
        if (lm[tipIdx].y < lm[pips[i]].y) count++;
    });

    // Thumb check
    const thumbTip = lm[4];
    const indexMCP = lm[5];
    const dist = Math.sqrt(Math.pow(thumbTip.x - indexMCP.x, 2) + Math.pow(thumbTip.y - indexMCP.y, 2));
    if (dist > 0.05) count++;

    return count;
}

function onResults(results) {
    if (!handCtx) return;

    // Update Canvas dimensions to match video
    if (handCanvas.width !== videoElement.videoWidth) {
        handCanvas.width = videoElement.videoWidth;
        handCanvas.height = videoElement.videoHeight;
    }

    handCtx.save();
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
    handCtx.drawImage(results.image, 0, 0, handCanvas.width, handCanvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const lm = results.multiHandLandmarks[0];
        drawConnectors(handCtx, lm, HAND_CONNECTIONS, { color: '#00f3ff', lineWidth: 2 });
        drawLandmarks(handCtx, lm, { color: '#ffffff', lineWidth: 1 });

        const fingerCount = countFingers(lm);
        const indexTip = lm[8];

        // 1. Move Cursor (updates global state)
        targetX = (1 - indexTip.x) * window.innerWidth;
        targetY = indexTip.y * window.innerHeight;

        window.appState.cursorX = window.appState.cursorX + (targetX - window.appState.cursorX) * smoothFactor;
        window.appState.cursorY = window.appState.cursorY + (targetY - window.appState.cursorY) * smoothFactor;

        // Update UI
        virtualCursor.style.left = `${window.appState.cursorX}px`;
        virtualCursor.style.top = `${window.appState.cursorY}px`;

        // Update 3D Background Interaction
        window.appState.mouseX = (window.appState.cursorX / window.innerWidth) - 0.5;
        window.appState.mouseY = (window.appState.cursorY / window.innerHeight) - 0.5;

        // 2. Click (3 fingers)
        if (fingerCount === 3) {
            virtualCursor.classList.add('clicking');
            if (!clickCooldown) {
                clickCooldown = true;
                virtualCursor.style.display = 'none';
                const el = document.elementFromPoint(window.appState.cursorX, window.appState.cursorY);
                virtualCursor.style.display = 'block';
                if (el) el.click();
                setTimeout(() => { clickCooldown = false; }, 500);
            }
        } else {
            virtualCursor.classList.remove('clicking');
        }

        // 3. Scroll Down (Fist / 0 fingers)
        // 3. Scroll Down (Fist / 0 fingers) - Smooth
        if (fingerCount === 0) window.scrollBy({ top: 15, behavior: 'auto' });

        // 4. Scroll Up (5 fingers) - Smooth
        if (fingerCount === 5) window.scrollBy({ top: -15, behavior: 'auto' });
    }
    handCtx.restore();
}