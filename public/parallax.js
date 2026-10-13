/**
 * Backdrop parallax.
 *
 * Drifts the three backdrop slices against the pointer at rates set by their
 * data-depth. The pointer target is eased toward rather than applied directly,
 * so the motion settles instead of snapping, and the whole thing is skipped
 * when the viewer has asked for reduced motion.
 */

const REACH = 26;   // px of travel at the nearest depth, at full deflection
const EASING = 0.06;

const motionOk = !matchMedia('(prefers-reduced-motion: reduce)').matches;
const layers = [...document.querySelectorAll('.backdrop__layer')];

if (motionOk && layers.length) {
    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };

    // Normalised to -1..1 from the centre of the viewport.
    addEventListener('pointermove', (event) => {
        target.x = (event.clientX / innerWidth) * 2 - 1;
        target.y = (event.clientY / innerHeight) * 2 - 1;
    }, { passive: true });

    // Resting the pointer outside the window should return the scene to centre.
    addEventListener('pointerleave', () => {
        target.x = 0;
        target.y = 0;
    });

    (function frame() {
        eased.x += (target.x - eased.x) * EASING;
        eased.y += (target.y - eased.y) * EASING;

        for (const layer of layers) {
            const depth = Number(layer.dataset.depth);
            // Negated so the scene drifts against the pointer, which is what
            // reads as depth rather than as the image following the cursor.
            layer.style.translate =
                `${-eased.x * REACH * depth}px ${-eased.y * REACH * depth * 0.5}px`;
        }

        requestAnimationFrame(frame);
    })();
}
