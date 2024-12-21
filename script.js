// Получаем доступ к Canvas и контексту рисования
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры Canvas
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Параметры игры
let gravity = 0.1;     // Гравитация
let thrustPower = 0.2; // Сила основного двигателя (вертикаль)
let sidePower = 0.1;   // Сила боковых двигателей
let fuel = 100;        // Запас топлива (можно отключить)

// Параметры ракеты
let rocketWidth = 20;
let rocketHeight = 40;

// Начальное положение ракеты (по центру сверху)
let x = WIDTH / 2;
let y = 100;

// Скорости по осям
let speedX = 0;
let speedY = 0;

// Угол ракеты (опционально, если хотим вращать спрайт)
let angle = 0;

// Флаги нажатия клавиш
let upPressed = false;
let leftPressed = false;
let rightPressed = false;

// Простой массив точек ландшафта
const terrainPoints = [
    { x: 0,   y: HEIGHT - 50 },
    { x: 100, y: HEIGHT - 80 },
    { x: 200, y: HEIGHT - 60 },
    { x: 300, y: HEIGHT - 100 },
    { x: 400, y: HEIGHT - 90 },
    { x: 500, y: HEIGHT - 70 },
    { x: 600, y: HEIGHT - 60 },
];

// Порог скорости, при котором посадка считается мягкой
const landingSpeedThreshold = 2.0;

// Функция для отрисовки ландшафта
function drawTerrain() {
    ctx.beginPath();
    ctx.moveTo(terrainPoints[0].x, terrainPoints[0].y);
    for (let i = 1; i < terrainPoints.length; i++) {
        ctx.lineTo(terrainPoints[i].x, terrainPoints[i].y);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

// Функция для проверки высоты ландшафта в заданной x-координате
function getTerrainHeightAtX(xCoord) {
    // Упрощённый метод: идём по сегментам в массиве terrainPoints
    for (let i = 0; i < terrainPoints.length - 1; i++) {
        let p1 = terrainPoints[i];
        let p2 = terrainPoints[i + 1];

        // Если xCoord в пределах между p1.x и p2.x, интерполируем высоту
        if (xCoord >= p1.x && xCoord <= p2.x) {
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let ratio = (xCoord - p1.x) / dx;  // Доля отрезка
            return p1.y + dy * ratio;
        }
    }
    // Если вне диапазона, возвращаем высоту самой последней точки
    return terrainPoints[terrainPoints.length - 1].y;
}

// Отрисовка ракеты
function drawRocket() {
    ctx.save();
    ctx.translate(x, y);
    // Если хотим поворачивать ракету по углу:
    ctx.rotate(angle);

    // Тело ракеты (простая белая капсула)
    ctx.fillStyle = 'white';
    ctx.fillRect(-rocketWidth / 2, -rocketHeight / 2, rocketWidth, rocketHeight);

    // Простой «огонь» при нажатии вверх (для красоты)
    if (upPressed && fuel > 0) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(-rocketWidth / 4, rocketHeight / 2);
        ctx.lineTo(rocketWidth / 4, rocketHeight / 2);
        ctx.lineTo(0, rocketHeight / 2 + 10 + Math.random() * 5); // немножко рандома
        ctx.fill();
    }

    ctx.restore();
}

// Обработка нажатия клавиш
document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        upPressed = true;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        leftPressed = true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        rightPressed = true;
    }
});

// Обработка отпускания клавиш
document.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        upPressed = false;
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        leftPressed = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        rightPressed = false;
    }
});

// Основной игровой цикл
function gameLoop() {
    // Очищаем Canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Обновляем физику
    updatePhysics();

    // Рисуем ландшафт
    drawTerrain();

    // Рисуем ракету
    drawRocket();

    // Запрашиваем следующий кадр
    requestAnimationFrame(gameLoop);
}

// Логика физики, движение, гравитация и т.д.
function updatePhysics() {
    // Применяем гравитацию
    speedY += gravity;

    // Управление ракетой
    if (upPressed && fuel > 0) {
        speedY -= thrustPower;
        fuel -= 0.1; // расход топлива
    }
    if (leftPressed && fuel > 0) {
        speedX -= sidePower;
        fuel -= 0.05;
        angle = -0.1; // лёгкий наклон для эффекта
    } else if (rightPressed && fuel > 0) {
        speedX += sidePower;
        fuel -= 0.05;
        angle = 0.1;
    } else {
        // Если не жмём влево/вправо — угол восстанавливаем к 0
        angle *= 0.9;
    }

    // Обновляем координаты
    x += speedX;
    y += speedY;

    // Проверка границ экрана
    if (x < 0) {
        x = 0;
        speedX = 0;
    }
    if (x > WIDTH) {
        x = WIDTH;
        speedX = 0;
    }
    if (y < 0) {
        y = 0;
        speedY = 0;
    }

    // Проверка столкновения с ландшафтом:
    // Берём нижнюю точку ракеты (примерно y + rocketHeight / 2)
    let rocketBottomY = y + rocketHeight / 2;
    let terrainY = getTerrainHeightAtX(x);

    if (rocketBottomY >= terrainY) {
        // «Касание» поверхности — проверяем скорость
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
            // Считаем, что разбились
            alert('Вы разбились! Скорость была слишком велика.');
            resetGame();
        } else {
            // Мягкая посадка
            alert('Посадка удалась! Поздравляем!');
            resetGame();
        }
    }
}

// Сброс игры (перезапуск)
function resetGame() {
    x = WIDTH / 2;
    y = 100;
    speedX = 0;
    speedY = 0;
    fuel = 100;
    angle = 0;
}

// Запуск
gameLoop();
