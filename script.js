(function () {
  "use strict";

  const DIFFICULTIES = {
    easy:   { count: 6,  speed: 40,  size: 70, score: 10, label: "Лёгкий"  },
    medium: { count: 10, speed: 65,  size: 58, score: 20, label: "Средний" },
    hard:   { count: 15, speed: 95,  size: 48, score: 30, label: "Сложный" }
  };

  let currentDiff = "easy";

  const screenStart = document.getElementById("screen-start");
  const screenPlay  = document.getElementById("screen-play");
  const screenEnd   = document.getElementById("screen-end");

  const field       = document.getElementById("field");
  const rocket      = document.getElementById("rocket");
  const scoreEl     = document.getElementById("score");
  const leftEl      = document.getElementById("left");

  const endTitle    = document.getElementById("end-title");
  const endText     = document.getElementById("end-text");
  const finalScore  = document.getElementById("final-score");

  const btnStart    = document.getElementById("btn-start");
  const btnRestart  = document.getElementById("btn-restart");
  const diffButtons = document.querySelectorAll(".diff-btn");

  const state = {
    running: false,
    asteroids: [],
    score: 0,
    remaining: 0,
    settings: null,
    lastTime: 0,
    rafId: 0,
    fieldW: 0,
    fieldH: 0
  };

  function showScreen(el) {
    [screenStart, screenPlay, screenEnd].forEach(s => s.classList.remove("screen--active"));
    el.classList.add("screen--active");
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function measureField() {
    const rect = field.getBoundingClientRect();
    state.fieldW = rect.width;
    state.fieldH = rect.height;
  }

  diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      diffButtons.forEach(b => b.classList.remove("diff-btn--active"));
      btn.classList.add("diff-btn--active");
      currentDiff = btn.dataset.diff;
    });
  });

  function startGame() {
    state.settings = DIFFICULTIES[currentDiff];
    state.score = 0;
    state.remaining = state.settings.count;
    state.asteroids = [];
    state.running = true;

    scoreEl.textContent = "0";
    leftEl.textContent = String(state.remaining);

    showScreen(screenPlay);

    requestAnimationFrame(() => {
      measureField();
      spawnAsteroids();
      state.lastTime = performance.now();
      cancelAnimationFrame(state.rafId);
      state.rafId = requestAnimationFrame(loop);
    });
  }

  function spawnAsteroids() {
    const size = state.settings.size;
    const speed = state.settings.speed;

    for (let i = 0; i < state.settings.count; i++) {
      const el = document.createElement("div");
      el.className = "asteroid";
      el.style.width = size + "px";
      el.style.height = size + "px";

      const x = rand(0, Math.max(1, state.fieldW - size));
      const y = -rand(size, state.fieldH * 0.8);

      const asteroid = {
        el,
        x,
        y,
        size,
        speed: speed + rand(-15, 15),
        alive: true
      };

      el.style.transform = `translate(${x}px, ${y}px)`;

      el.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
        hitAsteroid(asteroid);
      });

      field.appendChild(el);
      state.asteroids.push(asteroid);
    }
  }

  function loop(now) {
    if (!state.running) return;

    const dt = Math.min((now - state.lastTime) / 1000, 0.05);
    state.lastTime = now;

    for (const a of state.asteroids) {
      if (!a.alive) continue;
      a.y += a.speed * dt;

      if (a.y + a.size >= state.fieldH) {
        endGame(false);
        return;
      }

      a.el.style.transform = `translate(${a.x}px, ${a.y}px)`;
    }

    state.rafId = requestAnimationFrame(loop);
  }

  function hitAsteroid(asteroid) {
    if (!state.running || !asteroid.alive) return;

    asteroid.alive = false;
    asteroid.el.remove();

    state.score += state.settings.score;
    state.remaining -= 1;

    scoreEl.textContent = String(state.score);
    leftEl.textContent = String(Math.max(0, state.remaining));

    drawBeam(asteroid);

    if (state.remaining <= 0) {
      endGame(true);
    }
  }

  function drawBeam(asteroid) {
    const rocketRect = rocket.getBoundingClientRect();
    const fieldRect  = field.getBoundingClientRect();

    const rx = rocketRect.left - fieldRect.left + rocketRect.width / 2;
    const ry = rocketRect.top  - fieldRect.top  + rocketRect.height / 2;

    const ax = asteroid.x + asteroid.size / 2;
    const ay = asteroid.y + asteroid.size / 2;

    const dx = ax - rx;
    const dy = ay - ry;
    const dist = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;

    const beam = document.createElement("div");
    beam.className = "beam";
    beam.style.left = rx + "px";
    beam.style.top  = (ry - 2) + "px";
    beam.style.width = dist + "px";
    beam.style.transform = `rotate(${angle}deg)`;

    field.appendChild(beam);

    setTimeout(() => beam.remove(), 140);
  }

  function endGame(win) {
    state.running = false;
    cancelAnimationFrame(state.rafId);

    for (const a of state.asteroids) {
      if (a.el && a.el.parentNode) a.el.remove();
    }
    state.asteroids = [];

    finalScore.textContent = String(state.score);

    if (win) {
      endTitle.textContent = "Успех!";
      endText.textContent = "Все астеройды уничтожены. Курс на Луну свободен.";
    } else {
      endTitle.textContent = "Неудача";
      endText.textContent = "Астеройд долетел до ракеты. Попробуйте ещё раз.";
    }

    showScreen(screenEnd);
  }

  field.addEventListener("pointermove", (e) => {
    if (!state.running) return;
    const rect = field.getBoundingClientRect();
    const rx = rect.width / 2;
    const ry = rect.height - 30;
    const angle = Math.atan2(e.clientY - rect.top - ry, e.clientX - rect.left - rx) * 180 / Math.PI;
    const clamped = Math.max(-80, Math.min(80, angle + 90));
    rocket.style.transform = `rotate(${clamped - 90}deg)`;
  });

  window.addEventListener("resize", () => {
    if (state.running) measureField();
  });

  btnStart.addEventListener("click", startGame);
  btnRestart.addEventListener("click", () => {
    showScreen(screenStart);
  });
})();
