// --- ОБЩИЕ ПЕРЕМЕННЫЕ ---
const birdImg = new Image();
birdImg.src = 'goha-removebg-preview.png';

// --- ИГРА 1: FLAPPY ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 400; canvas.height = 600;

let score = 0;
let gameRunning = false;
let bird = { x: 50, y: 300, width: 45, height: 45, gravity: 0.4, lift: -8, velocity: 0 };
let pipes = [];

function resetFlappy() {
    bird.y = 300; bird.velocity = 0; pipes = []; score = 0;
    gameRunning = true;
    document.getElementById('score').innerText = "Счет: 0";
    document.getElementById('message').style.display = 'none';
    flappyLoop();
}

function flappyLoop() {
    if (!gameRunning) return;
    bird.velocity += bird.gravity;
    bird.y += bird.velocity;
    if (bird.y > canvas.height || bird.y < 0) gameRunning = false;

    if (pipes.length === 0 || pipes[pipes.length-1].x < 200) {
        pipes.push({ x: 400, top: Math.random()*250+50, passed: false });
    }
    pipes.forEach((p, i) => {
        p.x -= 3;
        if (bird.x < p.x+50 && bird.x+45 > p.x && (bird.y < p.top || bird.y+45 > p.top+160)) gameRunning = false;
        if (!p.passed && p.x < bird.x) { 
            score++; 
            p.passed = true; 
            document.getElementById('score').innerText = "Счет: " + score; 
        }
        if (p.x < -50) pipes.splice(i,1);
    });

    ctx.clearRect(0,0,400,600);
    ctx.drawImage(birdImg, bird.x, bird.y, 45, 45);
    ctx.fillStyle = "#f06292";
    pipes.forEach(p => { 
        ctx.fillRect(p.x, 0, 50, p.top); 
        ctx.fillRect(p.x, p.top+160, 50, 600); 
    });
    
    if (!gameRunning) {
        document.getElementById('message').innerHTML = `Конец! Счёт: ${score}<br>Жми Пробел!`;
        document.getElementById('message').style.display = 'block';
    } else {
        requestAnimationFrame(flappyLoop);
    }
}

// --- ИГРА 2: CATCH ---
const catchCanvas = document.getElementById('catchCanvas');
const cctx = catchCanvas.getContext('2d');
catchCanvas.width = 400; catchCanvas.height = 600;

let catchScore = 0;
let catchRunning = false;
let items = []; // Массив для сердец и бомб
let catcherX = 175;

function startCatch() {
    catchScore = 0;
    items = [];
    catchRunning = true;
    document.getElementById('catch-score').innerText = "Сердечек: 0";
    document.getElementById('catch-message').style.display = 'none';
    catchLoop();
}

function catchLoop() {
    if (!catchRunning) return;
    
    // Внутри catchLoop, перед отрисовкой сердечек/бомб:
cctx.fillStyle = "#fff"; // Цвет текста
cctx.strokeStyle = "#d81b60"; // Цвет обводки
cctx.lineWidth = 4;
cctx.lineJoin = "round";
cctx.font = "900 32px 'Montserrat', sans-serif"; // Жирный и четкий

// Если рисуешь текст "Счет" через Canvas:
cctx.strokeText("Счет: " + catchScore, 200, 50);
cctx.fillText("Счет: " + catchScore, 200, 50);

    cctx.clearRect(0,0,400,600);
    
    // Рисуем ловца
    cctx.drawImage(birdImg, catcherX, 520, 60, 60);

    // Создание предметов (сердца или бомбы)
    if (Math.random() < 0.04) {
        const isBomb = Math.random() < 0.2; // 20% шанс бомбы
        items.push({
            x: Math.random() * 370 + 15,
            y: -20,
            speed: 3 + Math.random() * 3,
            type: isBomb ? 'bomb' : 'heart'
        });
    }

    // Обработка предметов
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;

        // Рисуем эмодзи
        cctx.font = "30px Arial";
        cctx.textAlign = "center";
        cctx.fillText(item.type === 'heart' ? "❤️" : "💣", item.x, item.y);

        // Коллизия (столкновение с персонажем)
        if (item.y > 510 && item.y < 570 && item.x > catcherX && item.x < catcherX + 60) {
            if (item.type === 'heart') {
                catchScore++;
                document.getElementById('catch-score').innerText = "Сердечек: " + catchScore;
                items.splice(i, 1);
            } else {
                // ПОЙМАЛИ БОМБУ
                catchRunning = false;
                document.getElementById('catch-message').innerHTML = "БАБАХ! 💥<br>Счёт: " + catchScore + "<br>Нажми для рестарта";
                document.getElementById('catch-message').style.display = 'block';
            }
            continue;
        }

        // Удаление, если улетело вниз
        if (item.y > 620) items.splice(i, 1);
    }

    if (catchRunning) requestAnimationFrame(catchLoop);
}

// --- УПРАВЛЕНИЕ И ПЕРЕКЛЮЧЕНИЕ ---
function showGame(name) {
    // Сбрасываем состояния
    gameRunning = false;
    catchRunning = false;
    
    const flappyUI = document.getElementById('game-container');
    const catchUI = document.getElementById('catch-game-container');

    if (name === 'flappy') {
        flappyUI.style.display = 'block';
        catchUI.style.display = 'none';
        document.getElementById('message').style.display = 'block';
        document.getElementById('message').innerHTML = "Нажми Пробел!";
    } else {
        flappyUI.style.display = 'none';
        catchUI.style.display = 'block';
        document.getElementById('catch-message').style.display = 'block';
        document.getElementById('catch-message').innerHTML = "Лови сердца!<br>Обходи бомбы!";
    }
}

// Обработка клавиш
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        // Если открыта игра Flappy
        if (document.getElementById('game-container').style.display !== 'none') {
            if (!gameRunning) resetFlappy(); 
            else bird.velocity = bird.lift;
        }
    }
});

// Управление мышкой в Catch Game
catchCanvas.addEventListener('mousemove', (e) => {
    let rect = catchCanvas.getBoundingClientRect();
    catcherX = e.clientX - rect.left - 30;
    
    // Ограничение, чтобы не уходил за края
    if (catcherX < 0) catcherX = 0;
    if (catcherX > 340) catcherX = 340;
});

// Рестарт Catch Game по клику
catchCanvas.addEventListener('mousedown', () => { 
    if(!catchRunning && document.getElementById('catch-game-container').style.display !== 'none') {
        startCatch(); 
    }
});
