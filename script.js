const audio = document.getElementById("bg-audio"),
  audioToggle = document.getElementById("audio-toggle");
let audioPlaying = false;
document.addEventListener(
  "click",
  function s() {
    audio
      .play()
      .then(() => {
        audioPlaying = true;
        audioToggle.textContent = "🔊";
      })
      .catch(() => {});
  },
  { once: true },
);
audioToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  audioPlaying
    ? (audio.pause(), (audioToggle.textContent = "🔇"), (audioPlaying = false))
    : (audio.play(), (audioToggle.textContent = "🔊"), (audioPlaying = true));
});
window.addEventListener("load", () =>
  setTimeout(
    () => document.getElementById("loader").classList.add("hidden"),
    1500,
  ),
);

const {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Mouse,
  MouseConstraint,
  Events,
  Body,
  Vector,
} = Matter;
const engine = Engine.create();
const world = engine.world;
const canvas = document.getElementById("physics-canvas");
const W = window.innerWidth,
  H = window.innerHeight;
canvas.width = W;
canvas.height = H;

const render = Render.create({
  canvas,
  engine,
  options: { width: W, height: H, wireframes: false, background: "#1A1A2E" },
});
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

const floor = Bodies.rectangle(W / 2, H + 25, W + 100, 50, {
  isStatic: true,
  render: { fillStyle: "#333" },
});
const wallL = Bodies.rectangle(-25, H / 2, 50, H, {
  isStatic: true,
  render: { fillStyle: "#333" },
});
const wallR = Bodies.rectangle(W + 25, H / 2, 50, H, {
  isStatic: true,
  render: { fillStyle: "#333" },
});
Composite.add(world, [floor, wallL, wallR]);

const colors = [
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#FF6B6B",
  "#C77DFF",
  "#FF9E00",
  "#00F5FF",
];
let selectedShape = "circle";
let objCount = 0;
let blackHoleActive = false;
let blackHolePos = { x: W / 2, y: H / 2 };

document.querySelectorAll(".shape-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    document
      .querySelectorAll(".shape-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedShape = btn.dataset.shape;
  });
});

function createBody(x, y) {
  const color = colors[Math.floor(Math.random() * colors.length)];
  const size = 15 + Math.random() * 25;
  let body;
  switch (selectedShape) {
    case "circle":
      body = Bodies.circle(x, y, size, {
        restitution: 0.7,
        render: { fillStyle: color },
      });
      break;
    case "rectangle":
      body = Bodies.rectangle(x, y, size * 2, size * 1.5, {
        restitution: 0.5,
        render: { fillStyle: color },
      });
      break;
    case "triangle":
      body = Bodies.polygon(x, y, 3, size, {
        restitution: 0.6,
        render: { fillStyle: color },
      });
      break;
    case "star":
      body = Bodies.polygon(x, y, 5, size, {
        restitution: 0.5,
        render: { fillStyle: color },
      });
      break;
  }
  Composite.add(world, body);
  objCount++;
  document.getElementById("obj-count").textContent = "Objects: " + objCount;
  return body;
}

canvas.addEventListener("click", (e) => {
  createBody(e.clientX, e.clientY);
});

const mouse = Mouse.create(canvas);
const mConstraint = MouseConstraint.create(engine, {
  mouse,
  constraint: { stiffness: 0.2, render: { visible: false } },
});
Composite.add(world, mConstraint);
render.mouse = mouse;

document.getElementById("gravity-select").addEventListener("change", (e) => {
  engine.world.gravity.y = parseFloat(e.target.value);
});

document.getElementById("explode-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  Composite.allBodies(world).forEach((b) => {
    if (!b.isStatic) {
      const force = { x: (Math.random() - 0.5) * 0.1, y: -Math.random() * 0.1 };
      Body.applyForce(b, b.position, force);
    }
  });
});

document.getElementById("blackhole-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  blackHoleActive = !blackHoleActive;
  e.target.textContent = blackHoleActive ? "🕳️ Stop" : "🕳️ Black Hole";
});

document.getElementById("reset-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  const bodies = Composite.allBodies(world).filter((b) => !b.isStatic);
  Composite.remove(world, bodies);
  objCount = 0;
  document.getElementById("obj-count").textContent = "Objects: 0";
});

Events.on(engine, "afterUpdate", () => {
  if (blackHoleActive) {
    Composite.allBodies(world).forEach((b) => {
      if (!b.isStatic) {
        const dx = blackHolePos.x - b.position.x;
        const dy = blackHolePos.y - b.position.y;
        const dist = Math.max(50, Math.sqrt(dx * dx + dy * dy));
        const force = 0.0005 / dist;
        Body.applyForce(b, b.position, { x: dx * force, y: dy * force });
      }
    });
  }
});

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma !== null && e.beta !== null) {
      engine.world.gravity.x = e.gamma / 90;
      engine.world.gravity.y = e.beta / 90;
    }
  });
}
