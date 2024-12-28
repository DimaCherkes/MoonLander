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
let onGround = true;
let gamePaused = false;

const terrainTexture = new Image();
terrainTexture.src = 'assets/surface.png'; // Путь к текстуре поверхности
const backgroundImage = new Image();
backgroundImage.src = 'assets/background_canvas.png'; //Путь к текстуре канваса

// Параметры ракеты
let rocketWidth = 50;  // Ширина ракеты
let rocketHeight = 60; // Высота ракеты
const rocketImage = new Image();
rocketImage.src = 'assets/rocket.png'; // Укажите путь к изображению ракеты
const oneRocketImagePixelWidth = rocketWidth / 10;
const oneRocketImagePixelHeight = rocketHeight / 10;

// Начальное положение ракеты (по центру сверху)
let x;
let y;

// Координаты сторон ракеты слева на право
let rocketLeftX = x - rocketWidth / 2 + 2;
// let rocketMiddleLeftX = x - rocketWidth / 4;
// let rocketMiddleRightX = x + rocketWidth / 4;
let rocketRightX = x + rocketWidth / 2 - 2;
let rocketTopY = y - rocketHeight / 2;
let rocketBottomY = y + rocketHeight / 2;

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
let terrainPointsDownside = [];
let terrainPointsUpside = [];
let landingZone;
let startZone;

// Порог скорости, при котором посадка считается мягкой
const landingSpeedThreshold = 2.0;

// Массив со всеми сообщениями для пользователя
let collisionMessage = {
    TOP: "Столкновение верхней частью.",
    LEFTBOTTOM: "Вы зацепили левый двигатель.",
    RIGHTBOTTOM: "Вы зацепили правый двигатель.",
    MIDDLEBOTTOM: "Ракета должна касаться поверхности всей нижней частью."
}

// const rocketPoints = [
//     [x, rocketTopY],
//     [rocketLeftX, rocketBottomY],
//     [rocketRightX, rocketBottomY],
//     [x, rocketBottomY]
// ];

let gameMessageArray = [
    'Посадка удалась! Поздравляем!',
    'Столкновение с краем экрана.',
    'Столкновение верхней частью.',
    'Жесткая посадка.',
    'Неправильное приземление. Ракета должна полностью сесть на поверхность.',
    'Столкновение с боковой частью ракеты!',
    'Посадка мимо посадочной зоны'
];

let mapTriggers = [];

const developerMode = true;

// Запуск игрового цикла
loadTerrain();

function loadTerrain() {
    fetch('terrain4.json')
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            terrainPointsDownside = data.terrain[0].map(point => ({
                x: point.x * SQUARE_SIZE,
                y: HEIGHT - point.y * SQUARE_SIZE
            }));

            terrainPointsUpside = data.terrain[1].map(point => ({
                x: point.x * SQUARE_SIZE,
                y: HEIGHT - point.y * SQUARE_SIZE
            }));

            landingZone = data.landingZone;
            startZone = data.startZone;

            // формула для расчета стартового положения ракеты
            x = terrainPointsDownside[startZone].x + (rocketWidth / 2) + 5;
            y = terrainPointsDownside[startZone].y - (rocketHeight / 2);
            calculateSquares("init");
            gameLoop(); // Запускаем игровой цикл после загрузки данных
        })
        .catch((error) => {
            console.error('Не удалось загрузить ландшафт:', error);
        });
}

// Логика физики
function updatePhysics() {
    if (!onGround) {
        speedY += gravity; // Применяем гравитацию
    }

    // Управление двигателем
    if ((upPressed || touchActive) && fuel > 0) {
        if (onGround)
            onGround = false;
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

    rocketLeftX = x - rocketWidth / 2 + 2;
    // rocketMiddleLeftX = x - rocketWidth / 4;
    // rocketMiddleRightX = x + rocketWidth / 4;
    rocketRightX = x + rocketWidth / 2 - 2;
    rocketTopY = y - rocketHeight / 2;
    rocketBottomY = y + rocketHeight / 2;

    // Проверка столкновений
    checkCollision();
}

function checkCollision() {

    let checkCollisionForAllRocketPoints = [
        [x, rocketTopY],
        [rocketLeftX, rocketBottomY],
        [rocketRightX, rocketBottomY],
        [x, rocketBottomY]
    ]

    let collisionIndexes = [];

    for (let i = 0; i < mapTriggers.length; i++) {
        // mapSquare = [
        // [x1, x2],    [0, 15],
        // [y1, y2]     [345, 360]
        // ]
        for (let j = 0; j < checkCollisionForAllRocketPoints.length; j++) {
            let mapSquare = mapTriggers[i];
            // проверка на то, что точка находится в площади игрового квадрата
            if (mapSquare[0][0] <= checkCollisionForAllRocketPoints[j][0] + 1  &&
                mapSquare[0][1] >= checkCollisionForAllRocketPoints[j][0] - 1 &&
                mapSquare[1][0] <= checkCollisionForAllRocketPoints[j][1] &&
                mapSquare[1][1] >= checkCollisionForAllRocketPoints[j][1] - 1) {

                // определяем с какой точкой было соприкосновение и записываем в массив
                switch (j) {
                    case 0:
                        collisionIndexes.push(collisionMessage.TOP); break;
                    case 1:
                        collisionIndexes.push(collisionMessage.LEFTBOTTOM); break;
                    case 2:
                        collisionIndexes.push(collisionMessage.RIGHTBOTTOM); break;
                    case 3:
                        collisionIndexes.push(collisionMessage.MIDDLEBOTTOM); break;
                }
            }
        }
    }

    // проверка на starting zone
    if (checkStartingZone() && rocketBottomY >= terrainPointsDownside[startZone].y) {
        y = terrainPointsDownside[startZone].y - rocketHeight / 2;
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
            showCollisionModal(gameMessageArray[3]);
        }
        speedX = 0;
        speedY = 0;
        onGround = true;

        return 6; // пока пусть возвращает 6
    }

    // проверка на landing zone
    if (checkLandingZone() && rocketBottomY >= terrainPointsDownside[landingZone].y) {
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold)
            showCollisionModal(gameMessageArray[3]);
        else
            showCollisionModal(gameMessageArray[0]);
        return 6;
    }

    // Проверка боковых сторон
    if (rocketLeftX < 0 || rocketRightX > WIDTH) {
        return 1;
    }
    // Проверка верхней стороны
    if (rocketTopY < 0) {
        return 2;
    }

    // если хоть 1 точка пересеклась с ландшафтом, то вызываем сообщение для этой точки
    if (collisionIndexes.length > 0) {
        showCollisionModal(collisionIndexes[0]);
    }
}

// Сброс игры
function resetGame() {
    x = terrainPointsDownside[startZone].x + (rocketWidth / 2) + 5;
    y = terrainPointsDownside[startZone].y - (rocketHeight / 2);
    onGround = true;
    speedX = 0;
    speedY = 0;
    fuel = 100;  // Восстанавливаем топливо
    angle = 0;   // Угол
    upPressed = false;    // Сбрасываем флаг нажатия "вверх"
    leftPressed = false;  // Сбрасываем флаг нажатия "влево"
    rightPressed = false; // Сбрасываем флаг нажатия "вправо"
    touchActive = false;  // Сбрасываем касание экрана
}

// Основной игровой цикл
function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground(); // Рисуем фон
    if (!gamePaused) {
        updatePhysics();// Обновляем физику
    }
    drawTerrain();   // Рисуем ландшафт
    drawRocket();    // Рисуем ракету
    drawFuelBar(); // Отрисовка шкалы топлива

    //
    ctx.beginPath();
    ctx.arc(5, 350, 3, 0, 2 * Math.PI);
    ctx.fill();
//
    requestAnimationFrame(gameLoop);
}

function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, WIDTH, HEIGHT); // Растягиваем фон на весь Canvas
}

// Функция для отрисовки ландшафта
function drawTerrain() {
    // 1) Сначала рисуем весь ландшафт белым цветом
    ctx.beginPath();
    ctx.moveTo(terrainPointsDownside[0].x, terrainPointsDownside[0].y);
    for (let i = 1; i < terrainPointsDownside.length; i++) {
        ctx.lineTo(terrainPointsDownside[i].x, terrainPointsDownside[i].y);
    }
    // Замыкаем линию и заполняем текстурой луны
    ctx.lineTo(terrainPointsDownside[terrainPointsDownside.length - 1].x, HEIGHT); // Линия вниз к нижней границе Canvas
    ctx.lineTo(terrainPointsDownside[0].x, HEIGHT); // Линия влево к начальной точке
    ctx.closePath(); // Замыкаем путь
    const terrainPattern = ctx.createPattern(terrainTexture, 'repeat');
    ctx.fillStyle = terrainPattern;
    ctx.fill(); // Заполняем область текстурой

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2; // толщина белой линии
    ctx.stroke();
    ctx.closePath();

    // 2) Поверх рисуем landingZone
    ctx.beginPath();
    // используем landingZone и landingZone + 1
    ctx.moveTo(terrainPointsDownside[landingZone].x, terrainPointsDownside[landingZone].y);
    ctx.lineTo(terrainPointsDownside[landingZone + 1].x, terrainPointsDownside[landingZone + 1].y);
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 3; // толщина зелёной линии
    ctx.stroke();
    ctx.closePath();

    // 3) Поверх рисуем startZone
    ctx.beginPath();
    // используем startZone и startZone + 1
    ctx.moveTo(terrainPointsDownside[startZone].x, terrainPointsDownside[startZone].y);
    ctx.lineTo(terrainPointsDownside[startZone + 1].x, terrainPointsDownside[startZone + 1].y);
    ctx.strokeStyle = '#16e1e1';
    ctx.lineWidth = 3; // толщина зелёной линии
    ctx.stroke();
    ctx.closePath();

    // 4) Рисуем верхнюю часть карты
    ctx.beginPath();
    ctx.moveTo(terrainPointsUpside[0].x, terrainPointsUpside[0].y);
    for (let i = 1; i < terrainPointsUpside.length; i++) {
        ctx.lineTo(terrainPointsUpside[i].x, terrainPointsUpside[i].y);
    }
    // Замыкаем линию и заполняем текстурой луны
    ctx.lineTo(terrainPointsUpside[terrainPointsUpside.length - 1].x, 0); // Линия вниз к нижней границе Canvas
    ctx.lineTo(terrainPointsUpside[0].x, 0); // Линия влево к начальной точке
    ctx.closePath(); // Замыкаем путь
    ctx.fillStyle = terrainPattern;
    ctx.fill(); // Заполняем область текстурой

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2; // толщина белой линии
    ctx.stroke();
    ctx.closePath();

    if (developerMode) {
        // рисуем сетку
        drawGrid(ctx, WIDTH, HEIGHT, SQUARE_SIZE);
        calculateSquares("developer");
    }
}

function drawGrid(ctx, width, height, cellSize) {
    ctx.strokeStyle = '#64b568'; // Цвет линий сетки
    ctx.lineWidth = 1; // Толщина линий

    // Рисуем вертикальные линии
    for (let x = 0; x <= width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // Рисуем горизонтальные линии
    for (let y = 0; y <= height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// Отрисовка ракеты
function drawRocket() {
    ctx.save();
    ctx.translate(x, y);  // Перемещение в координаты ракеты
    ctx.rotate(angle);    // Поворот ракеты

    ctx.drawImage(rocketImage, -rocketWidth / 2, -rocketHeight / 2, rocketWidth, rocketHeight);

    // Эффект огня при включённом двигателе
    if ((upPressed || touchActive) && fuel > 0 && !gamePaused) {
        ctx.fillStyle = 'orange';
        ctx.beginPath();

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

    if (developerMode) {
        // Визуализация углов ракеты
        drawRocketPoints();
    }
}

//Метод для отрисовки точек столкновения.
function drawRocketPoints() {

    // ctx.fillStyle = 'blue';
    // for (let i = 0; i < rocketPoints.length; i++) {
    //     ctx.beginPath();
    //     ctx.arc(rocketPoints[i][0], rocketPoints[i][1], 2, 0, 2 * Math.PI);
    //     ctx.fill();
    // }

    ctx.fillStyle = 'blue';
    // Верх
    ctx.beginPath();
    ctx.arc(rocketLeftX , rocketTopY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // точка 3/4 до верха
    ctx.beginPath();
    ctx.arc(rocketLeftX, rocketTopY, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rocketRightX, rocketTopY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // точка 1/2 до верха
    ctx.beginPath();
    ctx.arc(rocketLeftX, rocketTopY , 3, 0, 2 * Math.PI);
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

}

function drawFuelBar() {
    const barWidth = 200; // Ширина шкалы
    const barHeight = 20; // Высота шкалы
    const barX = WIDTH - 220; // Отступ от левого края
    const barY = HEIGHT - 50; // Отступ от верхнего края

    // Рамка шкалы
    ctx.strokeStyle = '#fff'; // Цвет рамки
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Заполненная часть шкалы
    const fuelWidth = (fuel / 100) * barWidth; // Пропорциональная ширина
    ctx.fillStyle = fuel > 70 ? '#0f0' : (fuel > 50) ? '#ffcb00' : (fuel > 20) ? '#ff7700' : '#f00'; // Цвет: зелёный, если топлива больше 20%, иначе красный
    ctx.fillRect(barX, barY, fuelWidth, barHeight);

    // Текст уровня топлива
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Fuel: ${Math.round(fuel)}%`, barX, barY - 5); // Текст над шкалой
}

// Проверка правильной посадочной зоны
function checkLandingZone() {
    // количество пикселей слева до начала посадочной зоны
    let x0 = terrainPointsDownside[landingZone].x;
    // количество пикселей слева до конца посадочной зоны
    let x1 = terrainPointsDownside[landingZone + 1].x;
    return !(rocketLeftX < x0 || rocketRightX > x1);
}

// Проверка правильной стартовой зоны
function checkStartingZone() {
    // количество пикселей слева до начала посадочной зоны
    let x0 = terrainPointsDownside[startZone].x;
    // количество пикселей слева до конца посадочной зоны
    let x1 = terrainPointsDownside[startZone + 1].x;
    return rocketLeftX > x0 && rocketRightX < x1;
}

function getSegmentDirection(x1, y1, x2, y2) {
    if (y1 === y2) {
        return (x2 > x1) ? "horizontal-lr" : "horizontal-rl";
    } else if (x1 === x2) {
        return (y2 > y1) ? "vertical-td" : "vertical-bu";
    }
    return "unknown";
}

function fillSquaresForSegment(ctx, p1, p2, direction, mode, side) {
    ctx.fillStyle = "rgba(222,6,246,0.47)"; // Полупрозрачный красный

    if (direction === "horizontal-lr") {
        // Горизонтальный слева направо
        // Закрашиваем квадратики «снизу» (по канве это больший Y),
        // но чтобы их верхняя граница совпадала с линией => cellPxY = yRow
        const yRow = p1.gridY;
        const xStart = Math.min(p1.gridX, p2.gridX);
        const xEnd = Math.max(p1.gridX, p2.gridX);

        for (let xCell = xStart; xCell < xEnd; xCell++) {
            const cellPxX = xCell * SQUARE_SIZE;
            let cellPxY;
            // для верхней части карты нужно взять противоположный квадрат относительно линии
            if (side === "down")
                cellPxY = yRow * SQUARE_SIZE;  // Ниже
            else
                cellPxY = (yRow - 1) * SQUARE_SIZE;  // Выше

            if (mode === "init") {
                let square = [[cellPxX, cellPxX + SQUARE_SIZE], [cellPxY, cellPxY + SQUARE_SIZE]];
                mapTriggers.push(square);
            } else if (mode === "developer") {
                ctx.fillRect(cellPxX, cellPxY, SQUARE_SIZE, SQUARE_SIZE)
            }
        }
    } else if (direction === "horizontal-rl") {
        // Горизонтальный справа налево
        // Квадратики рисуем сверху (т.е. их нижняя граница совпадает с линией).
        // Значит, если линия идёт по yRow, то клетка будет «выше» => cellPxY = (yRow - 1)
        const yRow = p1.gridY;
        const xStart = Math.min(p1.gridX, p2.gridX);
        const xEnd = Math.max(p1.gridX, p2.gridX);

        for (let xCell = xStart; xCell < xEnd; xCell++) {
            const cellPxX = xCell * SQUARE_SIZE;
            // для верхней части карты нужно взять противоположный квадрат относительно линии
            let cellPxY;
            if (side === "down")
                cellPxY = (yRow - 1) * SQUARE_SIZE; // Выше
            else
                cellPxY = yRow * SQUARE_SIZE; // Ниже

            if (mode === "init") {
                let square = [[cellPxX, cellPxX + SQUARE_SIZE], [cellPxY, cellPxY + SQUARE_SIZE]];
                mapTriggers.push(square);
            } else if (mode === "developer") {
                ctx.fillRect(cellPxX, cellPxY, SQUARE_SIZE, SQUARE_SIZE)
            }
        }
    } else if (direction === "vertical-td") {
        // Вертикальный сверху вниз
        // Линия идёт по столбцу xCol.
        // Квадратики слева от линии = xCol - 1, чтобы их правая граница совпадала с xCol.
        const xCol = p1.gridX;
        const yStart = Math.min(p1.gridY, p2.gridY);
        const yEnd = Math.max(p1.gridY, p2.gridY);

        for (let yCell = yStart; yCell < yEnd; yCell++) {
            let cellPxX;
            // для верхней части карты нужно взять противоположный квадрат относительно линии
            if (side === "down")
                cellPxX = (xCol - 1) * SQUARE_SIZE; // Слева
            else
                cellPxX = (xCol) * SQUARE_SIZE; // Справа

            const cellPxY = yCell * SQUARE_SIZE;
            if (mode === "init") {
                let square = [[cellPxX, cellPxX + SQUARE_SIZE], [cellPxY, cellPxY + SQUARE_SIZE]];
                mapTriggers.push(square);
            } else if (mode === "developer") {
                ctx.fillRect(cellPxX, cellPxY, SQUARE_SIZE, SQUARE_SIZE)
            }
        }
    } else if (direction === "vertical-bu") {
        // Вертикальный снизу вверх
        // Квадратики рисуем «справа» вплотную, значит их левая граница = xCol.
        const xCol = p1.gridX;
        const yStart = Math.min(p1.gridY, p2.gridY);
        const yEnd = Math.max(p1.gridY, p2.gridY);

        for (let yCell = yStart; yCell < yEnd; yCell++) {
            let cellPxX;
            // для верхней части карты нужно взять противоположный квадрат относительно линии
            if (side === "down")
                cellPxX = xCol * SQUARE_SIZE; // Справа
            else
                cellPxX = (xCol - 1) * SQUARE_SIZE;

            const cellPxY = yCell * SQUARE_SIZE;
            if (mode === "init") {
                let square = [[cellPxX, cellPxX + SQUARE_SIZE], [cellPxY, cellPxY + SQUARE_SIZE]];
                mapTriggers.push(square);
            } else if (mode === "developer") {
                ctx.fillRect(cellPxX, cellPxY, SQUARE_SIZE, SQUARE_SIZE)
            }
        }
    }
}

// mode: can be "init" mode (to calculate and save squares in mapTriggers)
function calculateSquares(mode) {
    // Для нижней части
    const scaledPoints = terrainPointsDownside.map(pt => ({
        x: pt.x,   // пиксели
        y: pt.y,   // пиксели
        gridX: pt.x / SQUARE_SIZE,                 // «ячейка» по X
        gridY: pt.y / SQUARE_SIZE                 // «ячейка» по Y
    }));

    for (let i = 0; i < scaledPoints.length - 1; i++) {
        const p1 = scaledPoints[i];
        const p2 = scaledPoints[i + 1];
        // Определяем направление
        const direction = getSegmentDirection(p1.gridX, p1.gridY, p2.gridX, p2.gridY);
        // закрашиваем «прилегающие» квадраты
        fillSquaresForSegment(ctx, p1, p2, direction, mode, "down");
    }

    // Для верхней части
    const scaledPointsUpside = terrainPointsUpside.map(pt => ({
        x: pt.x,   // пиксели
        y: pt.y,   // пиксели
        gridX: pt.x / SQUARE_SIZE,                 // «ячейка» по X
        gridY: pt.y / SQUARE_SIZE                 // «ячейка» по Y
    }));

    for (let i = 0; i < scaledPointsUpside.length - 1; i++) {
        const p1 = scaledPointsUpside[i];
        const p2 = scaledPointsUpside[i + 1];
        // Определяем направление
        const direction = getSegmentDirection(p1.gridX, p1.gridY, p2.gridX, p2.gridY);
        // закрашиваем «прилегающие» квадраты
        fillSquaresForSegment(ctx, p1, p2, direction, mode, "up");
    }
}
