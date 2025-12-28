// Setup Scene
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// Optimize for mobile devices
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 2));
if (container) container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const spotLight = new THREE.SpotLight(0xffffff, 1);
spotLight.position.set(10, 20, 10);
spotLight.castShadow = true;
scene.add(spotLight);

const blueLight = new THREE.PointLight(0x00f3ff, 2, 50);
blueLight.position.set(-5, 0, 5);
scene.add(blueLight);

// Group to hold the object
const modelGroup = new THREE.Group();
scene.add(modelGroup);

// Load 3D Object (OBJ + Textures)
const textureLoader = new THREE.TextureLoader();
const basePath = 'assets/model/';

const loadTexture = (file) => {
    const tex = textureLoader.load(basePath + file);
    tex.encoding = THREE.sRGBEncoding;
    return tex;
};

const manager = new THREE.LoadingManager();
manager.onProgress = function (url, loaded, total) {
    if (window.updateLoader) {
        window.updateLoader((loaded / total) * 100);
    }
};

const loader = new THREE.OBJLoader(manager);

loader.load(basePath + 'base.obj', function (obj) {
    // 1. Auto-Center and Auto-Scale
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Reset center to (0,0,0)
    obj.position.x += (obj.position.x - center.x);
    obj.position.y += (obj.position.y - center.y);
    obj.position.z += (obj.position.z - center.z);

    // Scale to fit visually
    const maxAxis = Math.max(size.x, size.y, size.z);
    const scaleFactor = 5 / maxAxis;
    obj.scale.set(scaleFactor, scaleFactor, scaleFactor);
    obj.position.y = -2; // Move down slightly

    // 2. High-Quality Material
    const material = new THREE.MeshPhysicalMaterial({
        map: loadTexture('texture_diffuse_00.png'),
        normalMap: loadTexture('texture_normal_00.png'),
        roughnessMap: loadTexture('texture_roughness_00.png'),
        metalnessMap: loadTexture('texture_metallic_00.png'),
        metalness: 0.8,
        roughness: 0.8,
        clearcoat: 0.5,
        clearcoatRoughness: 0.1,
        envMapIntensity: 1
    });

    obj.traverse(function (child) {
        if (child.isMesh) {
            child.material = material;
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // 3. Add to scene and animate
    modelGroup.add(obj);

    // Initial State
    modelGroup.rotation.y = Math.PI * 0.25;

    // Smooth entry animation (Fade in)
    gsap.from(modelGroup.position, { y: 2, duration: 1.5, ease: "power2.out" });

    // Continuous Slow Rotation (Idle)
    gsap.to(modelGroup.rotation, {
        y: "+=" + (Math.PI * 2),
        duration: 35,
        repeat: -1,
        ease: "none"
    });

    // Apple-style Scroll Animation
    setupScrollAnimation();

}, undefined, function (error) {
    console.error('Error loading OBJ:', error);
    // Silent fail
});

// Starfield / Dust Effect
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 1000;
const starsPos = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount * 3; i++) {
    starsPos[i] = (Math.random() - 0.5) * 60; // Wider spread
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const starsMaterial = new THREE.PointsMaterial({
    size: 0.02,
    color: 0xffffff,
    transparent: true,
    opacity: 0.5
});
const starField = new THREE.Points(starsGeometry, starsMaterial);
scene.add(starField);

// Larger floating dust
const dustGeometry = new THREE.BufferGeometry();
const dustCount = 200;
const dustPos = new Float32Array(dustCount * 3);

for (let i = 0; i < dustCount * 3; i++) {
    dustPos[i] = (Math.random() - 0.5) * 50;
}

dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00f3ff, // Cyan tint
    transparent: true,
    opacity: 0.3
});
const dustField = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dustField);


// Scroll Animation Logic
function setupScrollAnimation() {
    gsap.registerPlugin(ScrollTrigger);

    // Smooth Scroll Effect
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 2
        }
    });

    // Sequence:
    // Move to side and float up, but MAINTAIN FORWARD ORIENTATION (mostly)
    // Removed large 'y' rotation addition.
    tl.to(modelGroup.position, { x: 3, y: 2, z: -5 }, 0.2)
        .to(modelGroup.rotation, { x: 0.2, y: "+=0.3", z: 0 }, 0.2); // Subtle look right, not turn around
}

// Global Function to Update Theme
window.updateBackgroundTheme = function (theme) {
    if (!starField || !dustField) return;

    const isLight = theme === 'light';

    // Starfield Color: White in Dark Mode, Black in Light Mode
    starField.material.color.setHex(isLight ? 0x000000 : 0xffffff);
    starField.material.opacity = isLight ? 0.3 : 0.5;

    // Dust Color: Dark Blue in Light Mode, Cyan in Dark Mode
    dustField.material.color.setHex(isLight ? 0x1e3a8a : 0x00f3ff);
};
// Interactive Mouse Movement for Home Page
function onMouseMove(event) {
    // Only apply if we are near the top of the page (Hero Section)
    if (modelGroup.children.length > 0 && window.scrollY < window.innerHeight) {
        // Map mouse X to -1 to 1
        const mx = (event.clientX / window.innerWidth) * 2 - 1;
        const my = -(event.clientY / window.innerHeight) * 2 + 1;

        // Full 360 manual rotation enabled by mouse X
        // This gives the user "ability to turn the robot"
        gsap.to(modelGroup.rotation, {
            y: mx * Math.PI, // -180 to +180 degrees
            x: my * 0.5,    // Tilt up/down confined
            overwrite: 'auto',
            duration: 0.5,  // Faster response
            ease: "power1.out"
        });
    }
}
window.addEventListener('mousemove', onMouseMove);





// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    const mx = window.appState ? window.appState.mouseX : 0;
    const my = window.appState ? window.appState.mouseY : 0;

    // Parallax
    modelGroup.rotation.y += 0.002;

    // Animate Particles
    if (starField) {
        starField.rotation.y = -mx * 0.05;
        starField.rotation.x = -my * 0.05;
    }
    if (dustField) {
        dustField.rotation.y = -mx * 0.1; // Move faster (closer)
        dustField.rotation.x = -my * 0.1;
    }

    renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1 : 2));

    // Adjust scale for mobile if needed
    if (modelGroup.children.length > 0) {
        const scale = window.innerWidth < 768 ? 0.08 : 0.15; // Example dynamic scale
        // Note: We used auto-scaling earlier, so we might just want to check if it's too big
    }
});