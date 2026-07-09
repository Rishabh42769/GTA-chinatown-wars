const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// World Configuration Map Settings
const WORLD_SIZE = 1600;
const keys = {};
let mouseX = 0;
let mouseY = 0;
const camera = { x: 0, y: 0 };

// Event Listeners
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

// Simple Static Map Objects (Buildings)
const buildings = [
    { x: 300, y: 200, w: 250, h: 200 },
    { x: 800, y: 150, w: 300, h: 400 },
    { x: 200, y: 700, w: 400, h: 200 },
    { x: 900, y: 800, w: 350, h: 300 }
];

// Player Entity Object
const player = {
    x: 150,
    y: 150,
    radius: 16,
    speed: 4,
    angle: 0,
    inVehicle: false,
    
    update() {
        if (this.inVehicle) {
            // Keep player tethered directly inside the car layout coordinates
            this.x = car.x;
            this.y = car.y;
            this.angle = car.angle;
            
            if (keys['f']) {
                this.inVehicle = false;
                this.x += Math.cos(car.angle + Math.PI/2) * 40; // Exit through passenger side frame
                keys['f'] = false;
            }
            return;
        }

        let mx = 0;
        let my = 0;
        if (keys['w'] || keys['arrowup']) my = -this.speed;
        if (keys['s'] || keys['arrowdown']) my = this.speed;
        if (keys['a'] || keys['arrowleft']) mx = -this.speed;
        if (keys['d'] || keys['arrowright']) mx = this.speed;

        this.x = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.x + mx));
        this.y = Math.max(this.radius, Math.min(WORLD_SIZE - this.radius, this.y + my));

        // Aim angle pointing directly toward the mouse cursor
        const sX = this.x - camera.x;
        const sY = this.y - camera.y;
        this.angle = Math.atan2(mouseY - sY, mouseX - sX);

        if (keys['f']) {
            let dist = Math.hypot(car.x - this.x, car.y - this.y);
            if (dist < 60) {
                this.inVehicle = true;
                keys['f'] = false;
            }
        }
    },

    draw() {
        if (this.inVehicle) return;

        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Retro Top-Down Character Model (Shoulders & Jacket)
        ctx.fillStyle = "#1ad1d7"; // Cyan track jacket
        ctx.strokeStyle = "#112";
        ctx.lineWidth = 3;
        
        // Shoulders
        ctx.fillRect(-10, -18, 16, 36);
        ctx.strokeRect(-10, -18, 16, 36);

        // Head
        ctx.fillStyle = "#ffdbac"; // Skin tone profile
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Gun Barrel Extender
        ctx.fillStyle = "#34495e";
        ctx.fillRect(8, 4, 14, 5);

        ctx.restore();
    }
};

// Sports Car Object
const car = {
    x: 450,
    y: 500,
    w: 70,
    h: 36,
    angle: 0,
    speed: 0,
    maxSpeed: 7,
    accel: 0.12,
    friction: 0.04,
    handling: 0.04,

    update() {
        if (!player.inVehicle) {
            if (this.speed > 0) this.speed = Math.max(0, this.speed - this.friction);
            if (this.speed < 0) this.speed = Math.min(0, this.speed + this.friction);
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
            return;
        }

        if (keys['a'] || keys['arrowleft']) this.angle -= this.handling;
        if (keys['d'] || keys['arrowright']) this.angle += this.handling;

        if (keys['w'] || keys['arrowup']) {
            this.speed = Math.min(this.maxSpeed, this.speed + this.accel);
        } else if (keys['s'] || keys['arrowdown']) {
            this.speed = Math.max(-this.maxSpeed / 2, this.speed - this.accel);
        } else {
            if (this.speed > 0) this.speed = Math.max(0, this.speed - this.friction);
            if (this.speed < 0) this.speed = Math.min(0, this.speed + this.friction);
        }

        this.x = Math.max(30, Math.min(WORLD_SIZE - 30, this.x + Math.cos(this.angle) * this.speed));
        this.y = Math.max(30, Math.min(WORLD_SIZE - 30, this.y + Math.sin(this.angle) * this.speed));
    },

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Main Car Frame
        ctx.fillStyle = "#f1c40f"; // Vibrant Yellow
        ctx.strokeStyle = "#222";
        ctx.lineWidth = 3;
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
        ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

        // Windshield windshield overlay
        ctx.fillStyle = "#2c3e50";
        ctx.fillRect(8, -this.h / 2 + 4, 12, this.h - 8);

        ctx.restore();
    }
};

// Pedestrian Enemy Triad NPC Class
class NPC {
    constructor() {
        this.x = Math.random() * (WORLD_SIZE - 300) + 150;
        this.y = Math.random() * (WORLD_SIZE - 300) + 150;
        this.radius = 15;
        this.speed = 1.2;
        this.angle = Math.random() * Math.PI * 2;
    }

    update() {
        // Run AI toward player position dynamically if within sight range
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 300 && !player.inVehicle) {
            this.angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        } else {
            // Idle Wander movement frame steps
            this.x += Math.cos(this.angle) * 0.3;
            this.y += Math.sin(this.angle) * 0.3;
            if (Math.random() < 0.02) this.angle = Math.random() * Math.PI * 2;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - camera.x, this.y - camera.y);
        ctx.rotate(this.angle);

        // Enemy Model Structure (Red Triad Tracksuits)
        ctx.fillStyle = "#e74c3c";
        ctx.strokeStyle = "#112";
        ctx.lineWidth = 3;

        // Enemy shoulders
        ctx.fillRect(-10, -16, 14, 32);
        ctx.strokeRect(-10, -16, 14, 32);

        // Enemy head
        ctx.fillStyle = "#ffdbac";
        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

// Gun Bullet Projectile Class
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.speed = 12;
        this.velX = Math.cos(angle) * this.speed;
        this.velY = Math.sin(angle) * this.speed;
        this.active = true;
    }

    update() {
        this.x += this.velX;
        this.y += this.velY;
        if (this.x < 0 || this.x > WORLD_SIZE || this.y < 0 || this.y > WORLD_SIZE) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(this.x - camera.x, this.y - camera.y, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Setup Array Pools Lists
let npcs = Array.from({ length: 12 }, () => new NPC());
let bullets = [];

// Trigger Gun Shots
window.addEventListener('mousedown', (e) => {
    if (e.button === 0 && !player.inVehicle) {
        bullets.push(new Bullet(player.x, player.y, player.angle));
    }
});

// core Game Engine Loop Pipeline Process
function gameLoop() {
    // 1. Logic Updates
    player.update();
    car.update();
    npcs.forEach(npc => npc.update());
    bullets.forEach(b => b.update());

    // Hit registration matching checks loop
    bullets = bullets.filter(b => b.active);
    bullets.forEach(b => {
        npcs.forEach((npc, idx) => {
            if (Math.hypot(b.x - npc.x, b.y - npc.y) < npc.radius + 4) {
                b.active = false;
                npcs.splice(idx, 1);
                npcs.push(new NPC()); // Infinite respawning loops pipeline
            }
        });
    });

    // 2. Camera follow script locking center position
    const followTarget = player.inVehicle ? car : player;
    camera.x = Math.max(0, Math.min(WORLD_SIZE - canvas.width, followTarget.x - canvas.width / 2));
    camera.y = Math.max(0, Math.min(WORLD_SIZE - canvas.height, followTarget.y - canvas.height / 2));

    // 3. Render Loop Graphics
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render Grid Background Map Details Lines
    ctx.strokeStyle = "#1d291f";
    ctx.lineWidth = 2;
    for (let x = 0; x < WORLD_SIZE; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x - camera.x, 0);
        ctx.lineTo(x - camera.x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < WORLD_SIZE; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y - camera.y);
        ctx.lineTo(canvas.width, y - camera.y);
        ctx.stroke();
    }

    // Render Static Map Buildings blocks
    ctx.fillStyle = "#556468";
    ctx.strokeStyle = "#2c3e50";
    ctx.lineWidth = 4;
    buildings.forEach(b => {
        ctx.fillRect(b.x - camera.x, b.y - camera.y, b.w, b.h);
        ctx.strokeRect(b.x - camera.x, b.y - camera.y, b.w, b.h);
    });

    // Draw Entities Pipeline Collection
    car.draw();
    player.draw();
    npcs.forEach(npc => npc.draw());
    bullets.forEach(b => b.draw());

    requestAnimationFrame(gameLoop);
}

// Fire up engine window instantly on page loading state validation
window.onload = () => {
    gameLoop();
};