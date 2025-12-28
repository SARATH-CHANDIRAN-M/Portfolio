// --- Global State ---
window.appState = {
    mouseX: 0,
    mouseY: 0,
    isHandControlActive: false,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2
};

// Global Helper to toggle cursor visibility
window.toggleVirtualCursor = function (show) {
    const cursor = document.getElementById('virtual-cursor');
    if (cursor) {
        if (show) cursor.classList.add('active-cursor');
        else cursor.classList.remove('active-cursor');
    }
};

// Default Mouse Listener (updates state if hands are not active)
function updateMouseState(clientX, clientY) {
    if (!window.appState.isHandControlActive) {
        window.appState.mouseX = clientX / window.innerWidth - 0.5;
        window.appState.mouseY = clientY / window.innerHeight - 0.5;
    }
}

document.addEventListener('mousemove', (event) => {
    updateMouseState(event.clientX, event.clientY);
});

document.addEventListener('touchmove', (event) => {
    if (event.touches.length > 0) {
        updateMouseState(event.touches[0].clientX, event.touches[0].clientY);
    }
}, { passive: true }); // Passive to allow scrolling


// --- Theme Switching Logic ---
const themeToggleBtn = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

// Function to update 3D particles based on theme
function updateParticlesTheme(theme) {
    if (window.updateBackgroundTheme) {
        window.updateBackgroundTheme(theme);
    }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
htmlEl.setAttribute('data-theme', savedTheme);

if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);

        updateParticlesTheme(newTheme);
    });
}
// -----------------------------

// Loading Screen Logic
// Loading Logic
window.updateLoader = function (percent) {
    const loader = document.getElementById('loader');
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-text');

    if (bar) bar.style.width = percent + '%';

    if (percent >= 100) {
        if (text) {
            text.innerText = "SYSTEM ONLINE";
            text.classList.add('text-green-400');
        }
        setTimeout(() => {
            gsap.to(loader, { opacity: 0, duration: 0.8, onComplete: () => loader.style.display = 'none' });
        }, 800);
    } else {
        if (text) text.innerText = `LOADING MODULES... ${Math.round(percent)}%`;
    }
};

window.addEventListener('load', () => {
    // Fallback: If no 3D model loads within 3s, finish loading
    setTimeout(() => {
        if (document.getElementById('loader').style.display !== 'none') {
            window.updateLoader(100);
        }
    }, 5000);
});

// Mobile Menu Toggle
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
if (hamburger) {
    hamburger.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
    });
}

// GSAP Animations
document.addEventListener("DOMContentLoaded", (event) => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.gs-reveal').forEach(element => {
        gsap.fromTo(element,
            { opacity: 0, y: 50 },
            {
                opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                scrollTrigger: { trigger: element, start: 'top 85%' }
            }
        );
    });
});

// Render Projects
window.addEventListener('load', () => {
    if (window.renderProjects) {
        window.renderProjects();
    }

    // Add 3D Tilt Effect to Glass Cards
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max 5 deg
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
});