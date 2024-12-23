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
let rocketHeight = 60; // Высота ракеты
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
let terrainPoints = [];
function loadTerrain() {
    fetch('terrain.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            terrainPoints = data.terrain.map(point => ({
                x: point.x * SQUARE_SIZE,
                y: HEIGHT - point.y * SQUARE_SIZE
            }));
            gameLoop(); // Запускаем игровой цикл после загрузки данных
        })
        .catch((error) => {
            console.error('Не удалось загрузить ландшафт:', error);
        });
}

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
/*    ctx.fillStyle = 'red';
    ctx.fillRect(-rocketWidth / 2, -rocketHeight / 2, rocketWidth, rocketHeight);*/
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
    // Визуализация углов ракеты
    //drawRocketPoints();
}
//Метод для отрисовки точек столкновения.
function drawRocketPoints() {
    // Углы нашей ракеты
    const rocketLeftX = x - rocketWidth / 2 + 2;
    const rocketRightX = x + rocketWidth / 2 - 2 ;
    const rocketTopY = y - rocketHeight / 2;
    const rocketBottomY = y + rocketHeight / 2;
    const rocketMiddleLeftX = x - rocketWidth / 4;
    const rocketMiddleRightX = x + rocketWidth / 4;
    ctx.fillStyle = 'blue';
    // Верхний левый угол
    ctx.beginPath();
    ctx.arc(rocketLeftX, rocketTopY, 3, 0, 2 * Math.PI);
    ctx.fill();
    // Верхний правый угол
    ctx.beginPath();
    ctx.arc(rocketRightX, rocketTopY, 3, 0, 2 * Math.PI);
    ctx.fill();
    // Нижний левый угол
    ctx.beginPath();
    ctx.arc(rocketLeftX, rocketBottomY, 3, 0, 2 * Math.PI);
    ctx.fill();
    // Нижний правый угол
    ctx.beginPath();
    ctx.arc(rocketRightX, rocketBottomY, 3, 0, 2 * Math.PI);
    ctx.fill();
    // Центральная нижняя точка
    ctx.beginPath();
    ctx.arc(x, rocketBottomY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // Точка между левым нижним углом и нижней центральной точкой
    ctx.beginPath();
    ctx.arc(rocketMiddleLeftX, rocketBottomY, 3, 0, 2 * Math.PI);
    ctx.fill();
    // Точка между правым нижним углом и нижней центральной точкой
    ctx.beginPath();
    ctx.arc(rocketMiddleRightX, rocketBottomY, 3, 0, 2 * Math.PI);
    ctx.fill();
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
    drawFuelBar(); // Отрисовка шкалы топлива
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
    if ((tiltX < -5 || leftPressed) && fuel > 0 && (upPressed || touchActive)) {
        speedX -= sidePower;
        fuel -= 0.05;
        angle = -0.1; // Наклон влево
    } else if ((tiltX > 5 || rightPressed) && fuel > 0 && (upPressed || touchActive)) {
        speedX += sidePower;
        fuel -= 0.05;
        angle = 0.1; // Наклон вправо
    } else {
        angle *= 0.9; // Плавное восстановление угла
    }

    x += speedX; // Обновляем положение по X
    y += speedY; // Обновляем положение по Y

    // Проверка столкновений
    checkCollision();
}
function checkCollision() {
    // Координаты сторон ракеты
    const rocketLeftX = x - rocketWidth / 2 + 2;
    const rocketRightX = x + rocketWidth / 2 - 2;
    const rocketTopY = y - rocketHeight / 2;
    const rocketBottomY = y + rocketHeight / 2;

    // Проверка столкновения с ландшафтом для каждой стороны
    const leftTerrainHeight = getTerrainHeightAtX(rocketLeftX);
    const rightTerrainHeight = getTerrainHeightAtX(rocketRightX);
    const centerTerrainHeight = getTerrainHeightAtX(x);
    //Это я сделал доп проверки на приземление, чтобы избежать неккоректной посадки
    const rocketMiddleLeftX = x - rocketWidth / 4;
    const rocketMiddleRightX = x + rocketWidth / 4;
    const middleLeftTerrainHeight = getTerrainHeightAtX(rocketMiddleLeftX);
    const middleRightTerrainHeight = getTerrainHeightAtX(rocketMiddleRightX);

    // Проверка боковых сторон
    if (rocketLeftX < 0 || rocketRightX > WIDTH) {
        alert('Столкновение с краем экрана.');
        resetGame();
        return;
    }

    // Проверка верхней стороны
    if (rocketTopY < 0) {
        alert('Столкновение верхней частью.');
        resetGame();
        return;
    }

    // Проверка нижней стороны
    if (rocketBottomY >= centerTerrainHeight) {
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
            alert('Неправильное приземление.');
        }
        else if(leftTerrainHeight !== rightTerrainHeight ||
            rightTerrainHeight !== centerTerrainHeight){
            alert('Неправильное приземление. Ракета должна полностью сесть на поверхность.');
        }
        else {
            alert('Посадка удалась! Поздравляем!');
        }
        resetGame();
        return;
    }

    // Проверка столкновения левых и правых сторон
    if (rocketBottomY >= leftTerrainHeight || rocketBottomY >= rightTerrainHeight
        || rocketBottomY >= middleLeftTerrainHeight || rocketBottomY >= middleRightTerrainHeight) {
        alert('Столкновение!');
        resetGame();
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
    upPressed = false;    // Сбрасываем флаг нажатия "вверх"
    leftPressed = false;  // Сбрасываем флаг нажатия "влево"
    rightPressed = false; // Сбрасываем флаг нажатия "вправо"
    touchActive = false;  // Сбрасываем касание экрана
}
function drawFuelBar() {
    const barWidth = 200; // Ширина шкалы
    const barHeight = 20; // Высота шкалы
    const barX = 20; // Отступ от левого края
    const barY = 20; // Отступ от верхнего края

    // Рамка шкалы
    ctx.strokeStyle = '#fff'; // Цвет рамки
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Заполненная часть шкалы
    const fuelWidth = (fuel / 100) * barWidth; // Пропорциональная ширина
    ctx.fillStyle = fuel > 70 ? '#0f0' : (fuel >50)?'#ffcb00':(fuel >20)?'#ff7700':'#f00'; // Цвет: зелёный, если топлива больше 20%, иначе красный
    ctx.fillRect(barX, barY, fuelWidth, barHeight);

    // Текст уровня топлива
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Fuel: ${Math.round(fuel)}%`, barX, barY - 5); // Текст над шкалой
}

// Запуск игрового цикла
loadTerrain();
