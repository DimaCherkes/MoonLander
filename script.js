// Получаем доступ к Canvas и контексту рисования
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Размеры Canvas
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const SQUARE_SIZE = 15;

// Параметры игры
let gravity = 0.1;     // Гравитация
let thrustPower = 0.2; // Сила основного двигателя (вертикаль)
let sidePower = 0.1;   // Сила боковых двигателей
let fuel = 100;        // Запас топлива (можно отключить)

// Параметры ракеты
let rocketWidth = 50;  // Ширина ракеты
let rocketHeight = 80; // Высота ракеты
const rocketImage = new Image();
rocketImage.src = 'assets/rocket_without_power.png'; // Укажите путь к изображению ракеты

// Начальное положение ракеты (по центру сверху)
let x = WIDTH / 2;
let y = 100;

// Скорости по осям
let speedX = 0; // Горизонтальная скорость
let speedY = 0; // Вертикальная скорость

// Угол ракеты (для наклона)
let angle = 0;

// Флаги нажатия клавиш
let upPressed = false;    // Вверх
let leftPressed = false;  // Влево
let rightPressed = false; // Вправо

// Управление гироскопом
let tiltX = 0; // Наклон по горизонтали
let tiltY = 0; // Наклон по вертикали
let touchActive = false; // Флаг удержания касания на экране

// Простой массив точек ландшафта
const terrainPoints =  [
    { x: 0 * SQUARE_SIZE, y: HEIGHT - 4 * SQUARE_SIZE },
    { x: 1 * SQUARE_SIZE, y: HEIGHT - 4 * SQUARE_SIZE },
    { x: 1 * SQUARE_SIZE, y: HEIGHT - 3 * SQUARE_SIZE },
    { x: 2 * SQUARE_SIZE, y: HEIGHT - 3 * SQUARE_SIZE },
    { x: 2 * SQUARE_SIZE, y: HEIGHT - 5 * SQUARE_SIZE },
    { x: 3 * SQUARE_SIZE, y: HEIGHT - 5 * SQUARE_SIZE },
    { x: 3 * SQUARE_SIZE, y: HEIGHT - 3 * SQUARE_SIZE },
    { x: 5 * SQUARE_SIZE, y: HEIGHT - 3 * SQUARE_SIZE },
    { x: 5 * SQUARE_SIZE, y: HEIGHT - 6 * SQUARE_SIZE },
    { x: 5 * SQUARE_SIZE, y: HEIGHT - 7 * SQUARE_SIZE },
    { x: 6 * SQUARE_SIZE, y: HEIGHT - 7 * SQUARE_SIZE },
    { x: 6 * SQUARE_SIZE, y: HEIGHT - 10 * SQUARE_SIZE },
    { x: 8 * SQUARE_SIZE, y: HEIGHT - 10 * SQUARE_SIZE },
    { x: 8 * SQUARE_SIZE, y: HEIGHT - 9 * SQUARE_SIZE },
    { x: 9 * SQUARE_SIZE, y: HEIGHT - 9 * SQUARE_SIZE },
    { x: 9 * SQUARE_SIZE, y: HEIGHT - 12 * SQUARE_SIZE },
    { x: 10 * SQUARE_SIZE, y: HEIGHT - 12 * SQUARE_SIZE },
    { x: 10 * SQUARE_SIZE, y: HEIGHT - 11 * SQUARE_SIZE },
    { x: 12 * SQUARE_SIZE, y: HEIGHT - 11 * SQUARE_SIZE },
    { x: 12 * SQUARE_SIZE, y: HEIGHT - 10 * SQUARE_SIZE },
    { x: 13 * SQUARE_SIZE, y: HEIGHT - 10 * SQUARE_SIZE },
    { x: 13 * SQUARE_SIZE, y: HEIGHT - 9 * SQUARE_SIZE },
    { x: 14 * SQUARE_SIZE, y: HEIGHT - 9 * SQUARE_SIZE },
    { x: 14 * SQUARE_SIZE, y: HEIGHT - 8 * SQUARE_SIZE },
    { x: 22 * SQUARE_SIZE, y: HEIGHT - 8 * SQUARE_SIZE },
    { x: 22 * SQUARE_SIZE, y: HEIGHT - 10 * SQUARE_SIZE },
    { x: 24 * SQUARE_SIZE, y: HEIGHT - 10 * SQUARE_SIZE },
    { x: 24 * SQUARE_SIZE, y: HEIGHT - 7 * SQUARE_SIZE },
    { x: 25 * SQUARE_SIZE, y: HEIGHT - 7 * SQUARE_SIZE },
    { x: 25 * SQUARE_SIZE, y: HEIGHT - 6 * SQUARE_SIZE },
    { x: 27 * SQUARE_SIZE, y: HEIGHT - 6 * SQUARE_SIZE },
    { x: 27 * SQUARE_SIZE, y: HEIGHT - 9 * SQUARE_SIZE },
    { x: 29 * SQUARE_SIZE, y: HEIGHT - 9 * SQUARE_SIZE },
    { x: 29 * SQUARE_SIZE, y: HEIGHT - 13 * SQUARE_SIZE },
    { x: 30 * SQUARE_SIZE, y: HEIGHT - 13 * SQUARE_SIZE },
    { x: 30 * SQUARE_SIZE, y: HEIGHT - 14 * SQUARE_SIZE },
    { x: 31 * SQUARE_SIZE, y: HEIGHT - 14 * SQUARE_SIZE },
    { x: 31 * SQUARE_SIZE, y: HEIGHT - 16 * SQUARE_SIZE },
    { x: 33 * SQUARE_SIZE, y: HEIGHT - 16 * SQUARE_SIZE },
    { x: 33 * SQUARE_SIZE, y: HEIGHT - 17 * SQUARE_SIZE },
    { x: 35 * SQUARE_SIZE, y: HEIGHT - 17 * SQUARE_SIZE },
    { x: 35 * SQUARE_SIZE, y: HEIGHT - 15 * SQUARE_SIZE },
    { x: 36 * SQUARE_SIZE, y: HEIGHT - 15 * SQUARE_SIZE },
    { x: 36 * SQUARE_SIZE, y: HEIGHT - 11 * SQUARE_SIZE },
    { x: 38 * SQUARE_SIZE, y: HEIGHT - 11 * SQUARE_SIZE },
    { x: 38 * SQUARE_SIZE, y: HEIGHT - 12 * SQUARE_SIZE },
    { x: 39 * SQUARE_SIZE, y: HEIGHT - 12 * SQUARE_SIZE },
    { x: 39 * SQUARE_SIZE, y: HEIGHT - 13 * SQUARE_SIZE },
    { x: 40 * SQUARE_SIZE, y: HEIGHT - 13 * SQUARE_SIZE }
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
    for (let i = 0; i < terrainPoints.length - 1; i++) {
        let p1 = terrainPoints[i];
        let p2 = terrainPoints[i + 1];
        if (xCoord >= p1.x && xCoord <= p2.x) {
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let ratio = (xCoord - p1.x) / dx;  // Доля отрезка
            return p1.y + dy * ratio; // Интерполяция высоты
        }
    }
    return terrainPoints[terrainPoints.length - 1].y; // Если за пределами, возвращаем последнюю высоту
}

// Отрисовка ракеты
function drawRocket() {
    ctx.save();
    ctx.translate(x, y);  // Перемещение в координаты ракеты
    ctx.rotate(angle);    // Поворот ракеты
    ctx.fillStyle = 'white';
    //ctx.fillRect(-rocketWidth / 2, -rocketHeight / 2, rocketWidth, rocketHeight); // Рисуем ракету
    ctx.drawImage(rocketImage, -rocketWidth / 2, -rocketHeight / 2, rocketWidth, rocketHeight);

    // Эффект огня при включённом двигателе
    if ((upPressed || touchActive) && fuel > 0) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
/*        ctx.moveTo(-rocketWidth / 2, rocketHeight / 2);
        ctx.lineTo(0, rocketHeight / 2);
        ctx.lineTo(-rocketWidth / 4, rocketHeight / 2 + 10 + Math.random() * 5); // Эффект пламени*/

        //Левый
        ctx.moveTo((-rocketWidth / 2) + 2, rocketHeight / 2);
        ctx.lineTo(-2, rocketHeight / 2);
        ctx.lineTo(-rocketWidth / 4, rocketHeight / 2 + 10 + Math.random() * 5);
        ctx.fill();
        //Правый
        ctx.beginPath();
        ctx.moveTo((rocketWidth / 2) - 2, rocketHeight / 2);
        ctx.lineTo(2, rocketHeight / 2);
        ctx.lineTo(rocketWidth / 4, rocketHeight / 2 + 10 + Math.random() * 5);
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

// Обработка гироскопа
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
        tiltX = event.gamma; // Наклон влево/вправо
        tiltY = event.beta;  // Наклон вверх/вниз
    });
}

// Обработка касания
document.addEventListener('touchstart', () => {
    touchActive = true; // Включаем флаг при касании
});

document.addEventListener('touchend', () => {
    touchActive = false; // Выключаем флаг при завершении касания
});

// Основной игровой цикл
function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT); // Очищаем Canvas
    updatePhysics(); // Обновляем физику
    drawTerrain();   // Рисуем ландшафт
    drawRocket();    // Рисуем ракету
    requestAnimationFrame(gameLoop); // Следующий кадр
}

// Логика физики
function updatePhysics() {
    speedY += gravity; // Применяем гравитацию

    // Управление двигателем
    if ((upPressed || touchActive) && fuel > 0) {
        speedY -= thrustPower;
        fuel -= 0.1; // Расход топлива
    }

    // Управление боковыми двигателями
    if ((tiltX < -5 || leftPressed) && fuel > 0) {
        speedX -= sidePower;
        fuel -= 0.05;
        angle = -0.1; // Наклон влево
    } else if ((tiltX > 5 || rightPressed) && fuel > 0) {
        speedX += sidePower;
        fuel -= 0.05;
        angle = 0.1; // Наклон вправо
    } else {
        angle *= 0.9; // Плавное восстановление угла
    }

    x += speedX; // Обновляем положение по X
    y += speedY; // Обновляем положение по Y

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

    // Проверка столкновения с ландшафтом
    let rocketBottomY = y + rocketHeight / 2; // Нижняя точка ракеты
    let terrainY = getTerrainHeightAtX(x);   // Высота ландшафта

    if (rocketBottomY >= terrainY) {
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
            alert('Вы разбились! Скорость была слишком велика.'); // Неудачная посадка
            resetGame();
        } else {
            alert('Посадка удалась! Поздравляем!'); // Успешная посадка
            resetGame();
        }
    }
}

// Сброс игры
function resetGame() {
    x = WIDTH / 2; // Сбрасываем положение ракеты
    y = 100;
    speedX = 0;
    speedY = 0;
    fuel = 100;  // Восстанавливаем топливо
    angle = 0;   // Угол
}

// Запуск игрового цикла
gameLoop();
