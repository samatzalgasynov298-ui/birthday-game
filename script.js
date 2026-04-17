const birdImg = new Image();
birdImg.src = 'goha-removebg-preview.png';

let currentPlayer = "Гость";

// --- ЛОГИКА ИМЕНИ И РЕКОРДОВ ---
document.getElementById('start-game-btn').onclick = function() {
    let nameInput = document.getElementById('player-name').value;
    if (nameInput.trim() !== "") {
        currentPlayer = nameInput;
        document.getElementById('name-modal').style.display = 'none';
        updateLeaderboard();
    }
};

function saveRecord(finalScore) {
    let records = JSON.parse(localStorage.getItem('gohaRecords')) || [];
    records.push({ name: currentPlayer, score: finalScore });
    records.sort((a, b) => b.score - a.score);
    records = records.slice(0, 5); // Только топ-5
    localStorage.setItem('gohaRecords', JSON.stringify(records));
    updateLeaderboard();
}

function updateLeaderboard() {
    const list = document.getElementById('score-list');
    const records = JSON.parse(localStorage.getItem('gohaRecords')) || [];
    list.innerHTML = records.map(r => `<li><span>${r.name}</span> <b>${r.score}</b></li>`).join('');
}

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

    if (bird.y > canvas.height || bird.y < 0) {
        gameRunning = false;
        saveRecord(score); // СОХРАНЯЕМ РЕКОРД
    }

    if (pipes.length === 0 || pipes[pipes.length-1].x < 200) {
        pipes.push({ x: 400, top: Math.random()*250+50, passed: false });
    }

    pipes.forEach((p, i) => {
        p.x -= 3;
        if (bird.x < p.x+50 && bird.x+45 > p.x && (bird.y < p.top || bird.y+45 > p.top+160)) {
            gameRunning = false;
            saveRecord(score); // СОХРАНЯЕМ РЕКОРД
        }
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
        document.getElementById('message').innerHTML = `Конец! Счёт: ${score}<br>Нажми Пробел!`;
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
let items = [];
let catcherX = 175;

function startCatch() {
    catchScore = 0; items = []; catchRunning = true;
    document.getElementById('catch-score').innerText = "Сердечек: 0";
    document.getElementById('catch-message').style.display = 'none';
    catchLoop();
}

function catchLoop() {
    if (!catchRunning) return;
    cctx.clearRect(0,0,400,600);
    cctx.drawImage(birdImg, catcherX, 520, 60, 60);

    if (Math.random() < 0.04) {
        const isBomb = Math.random() < 0.2;
        items.push({ x: Math.random()*370+15, y: -20, speed: 3 + Math.random()*3, type: isBomb ? 'bomb' : 'heart' });
    }

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;
        cctx.font = "30px Arial";
        cctx.fillText(item.type === 'heart' ? "❤️" : "💣", item.x, item.y);

        if (item.y > 510 && item.y < 570 && item.x > catcherX && item.x < catcherX + 60) {
            if (item.type === 'heart') {
                catchScore++;
                document.getElementById('catch-score').innerText = "Сердечек: " + catchScore;
                items.splice(i, 1);
            } else {
                catchRunning = false;
                saveRecord(catchScore); // СОХРАНЯЕМ РЕКОРД
                document.getElementById('catch-message').innerHTML = "БАБАХ! 💥<br>Счёт: " + catchScore + "<br>Клик для рестарта";
                document.getElementById('catch-message').style.display = 'block';
            }
        }
        if (item.y > 620) items.splice(i, 1);
    }
    if (catchRunning) requestAnimationFrame(catchLoop);
}

// --- УПРАВЛЕНИЕ ---
function showGame(name) {
    gameRunning = false; catchRunning = false;
    document.getElementById('game-container').style.display = name === 'flappy' ? 'block' : 'none';
    document.getElementById('catch-game-container').style.display = name === 'catch' ? 'block' : 'none';
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (document.getElementById('game-container').style.display !== 'none') {
            if (!gameRunning) resetFlappy(); else bird.velocity = bird.lift;
        }
    }
});

// Для мобилок - тап
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!gameRunning) resetFlappy(); else bird.velocity = bird.lift;
});

catchCanvas.addEventListener('mousemove', (e) => {
    let rect = catchCanvas.getBoundingClientRect();
    catcherX = e.clientX - rect.left - 30;
});

// Для мобилок в Catch
catchCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    let rect = catchCanvas.getBoundingClientRect();
    catcherX = e.touches[0].clientX - rect.left - 30;
});

catchCanvas.addEventListener('mousedown', () => { 
    if(!catchRunning && document.getElementById('catch-game-container').style.display !== 'none') startCatch(); 
});

updateLeaderboard(); // Показать топ при загрузке
