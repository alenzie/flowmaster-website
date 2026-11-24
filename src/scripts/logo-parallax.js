// Logo Parallax and Breathing Effects
// Activates after intro animation completes (~2250ms)

document.addEventListener('DOMContentLoaded', () => {
  const logoWrapper = document.querySelector('.logo-parallax-wrapper');
  if (!logoWrapper) return;

  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    logoWrapper.classList.add('animation-complete');
    return;
  }

  const maxDrift = 20; // pixels for container parallax
  const easing = 0.08; // smoothing factor (matches ThreeStepAnimation)
  const introAnimationDuration = 2250; // ms

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let animationStarted = false;

  // --- Per-square mouse tracking state ---
  const mouseHistory = [];
  const maxHistoryAge = 700; // ms - how far back to look for delayed squares
  const squareDelays = { red: 0, yellow: 140, green: 280 };
  const squareEasing = 0.04; // 4% attraction per frame - slow, floaty
  const maxSquareDrift = 12; // boundary constraint in pixels
  const squarePositions = {
    red: { x: 0, y: 0 },
    yellow: { x: 0, y: 0 },
    green: { x: 0, y: 0 }
  };

  // Helper: clamp value within bounds
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Helper: prune history entries older than maxHistoryAge
  function pruneOldHistory() {
    const cutoff = performance.now() - maxHistoryAge;
    while (mouseHistory.length > 0 && mouseHistory[0].timestamp < cutoff) {
      mouseHistory.shift();
    }
  }

  // Helper: get interpolated mouse position from msAgo milliseconds in the past
  function getPositionAtTime(msAgo) {
    if (mouseHistory.length === 0) {
      return { x: 0, y: 0 }; // No history = return to home
    }

    const targetTime = performance.now() - msAgo;

    // If target time is before our oldest entry, return oldest
    if (targetTime <= mouseHistory[0].timestamp) {
      return { x: mouseHistory[0].x, y: mouseHistory[0].y };
    }

    // If target time is after our newest entry, return newest
    const newest = mouseHistory[mouseHistory.length - 1];
    if (targetTime >= newest.timestamp) {
      return { x: newest.x, y: newest.y };
    }

    // Find the two entries to interpolate between
    for (let i = 0; i < mouseHistory.length - 1; i++) {
      const a = mouseHistory[i];
      const b = mouseHistory[i + 1];
      if (targetTime >= a.timestamp && targetTime <= b.timestamp) {
        const t = (targetTime - a.timestamp) / (b.timestamp - a.timestamp);
        return {
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t
        };
      }
    }

    // Fallback (shouldn't reach here)
    return { x: newest.x, y: newest.y };
  }

  // Pulse animation for squares using Web Animations API
  const redSquare = document.querySelector('.logo-red');
  const yellowSquare = document.querySelector('.logo-yellow');
  const greenSquare = document.querySelector('.logo-green');

  function triggerPulse(element) {
    if (!element) return;
    element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.08)' },
      { transform: 'scale(1)' }
    ], {
      duration: 850,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }

  function startPulseSequence() {
    // Red pulses first
    triggerPulse(redSquare);
    // Yellow pulses 330ms later
    setTimeout(() => triggerPulse(yellowSquare), 330);
    // Green pulses 330ms after yellow
    setTimeout(() => triggerPulse(greenSquare), 660);
  }

  function scheduleNextPulse() {
    // Random interval between 5-9 seconds
    const delay = 5000 + Math.random() * 4000;
    setTimeout(() => {
      if (animationStarted) {
        startPulseSequence();
      }
      scheduleNextPulse();
    }, delay);
  }

  // Wait for intro animation to complete, then enable breathing
  setTimeout(() => {
    logoWrapper.classList.add('animation-complete');
    animationStarted = true;
    // Start pulse cycle after intro completes
    scheduleNextPulse();

    // Enable per-square tracking
    [redSquare, yellowSquare, greenSquare].forEach(square => {
      if (square) square.classList.add('tracking-active');
    });
  }, introAnimationDuration);

  // Mouse parallax: only where there is a mouse to follow.

  if (window.matchMedia('(hover: hover) and (min-width: 768px)').matches) {
    document.addEventListener('mousemove', (e) => {
      if (!animationStarted) return;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;

      // Calculate offset from center (-1 to 1)
      const offsetX = (e.clientX - centerX) / centerX;
      const offsetY = (e.clientY - centerY) / centerY;

      targetX = offsetX * maxDrift;
      targetY = offsetY * maxDrift;

      // Record normalized position for per-square tracking
      const squareTargetX = offsetX * maxSquareDrift;
      const squareTargetY = offsetY * maxSquareDrift;
      mouseHistory.push({
        x: squareTargetX,
        y: squareTargetY,
        timestamp: performance.now()
      });
    });

    function animate() {
      // Container parallax
      currentX += (targetX - currentX) * easing;
      currentY += (targetY - currentY) * easing;

      logoWrapper.style.setProperty('--parallax-x', `${currentX}px`);
      logoWrapper.style.setProperty('--parallax-y', `${currentY}px`);

      // Per-square tracking (only after intro completes)
      if (animationStarted) {
        pruneOldHistory();

        // Update each square's position
        for (const [color, delay] of Object.entries(squareDelays)) {
          const target = getPositionAtTime(delay);
          const pos = squarePositions[color];

          // Ease toward target position
          pos.x += (target.x - pos.x) * squareEasing;
          pos.y += (target.y - pos.y) * squareEasing;

          // Apply boundary constraint
          pos.x = clamp(pos.x, -maxSquareDrift, maxSquareDrift);
          pos.y = clamp(pos.y, -maxSquareDrift, maxSquareDrift);

          // Apply to element via CSS custom properties
          const square = color === 'red' ? redSquare : color === 'yellow' ? yellowSquare : greenSquare;
          if (square) {
            square.style.setProperty('--square-x', `${pos.x}px`);
            square.style.setProperty('--square-y', `${pos.y}px`);
          }
        }
      }

      requestAnimationFrame(animate);
    }

    animate();
  }
});
