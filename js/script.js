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
const rocketImagePixelsInOneBlock = rocketWidth / 10;

// Начальное положение ракеты (по центру сверху)
let x;
let y;

// Координаты сторон ракеты слева на право
let rocketLeftX = x - rocketWidth / 2 + 2;
let rocketMiddleLeftX = x - rocketWidth / 4;
let rocketMiddleRightX = x + rocketWidth / 4;
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
let gameMessageArray = [
    'Посадка удалась! Поздравляем!',
    'Столкновение с краем экрана.',
    'Столкновение верхней частью.',
    'Жесткая посадка.',
    'Неправильное приземление. Ракета должна полностью сесть на поверхность.',
    'Столкновение с боковой частью ракеты!',
    'Посадка мимо посадочной зоны'
];

// Запуск игрового цикла
loadTerrain();

function loadTerrain() {
    fetch('terrain.json')
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
            onGround =  false;
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
    rocketMiddleLeftX = x - rocketWidth / 4;
    rocketMiddleRightX = x + rocketWidth / 4;
    rocketRightX = x + rocketWidth / 2 - 2;
    rocketTopY = y - rocketHeight / 2;
    rocketBottomY = y + rocketHeight / 2;

    // Проверка столкновений
    let collision = checkCollision();
    switch (collision) {
        case 0: // Удачная посадка
            if (checkLandingZone()) {
                showCollisionModal(gameMessageArray[0]); // «Посадка удалась! Поздравляем!»
            } else {
                showCollisionModal(gameMessageArray[6]); // «Посадка мимо посадочной зоны»
            }
            break;

        case 1: // Столкновение с краем экрана
            showCollisionModal(gameMessageArray[1]);
            break;

        case 2: // Столкновение верхней частью
            showCollisionModal(gameMessageArray[2]);
            break;

        case 3: // Жесткая посадка
            showCollisionModal(gameMessageArray[3]);
            break;

        case 4: // Неправильное приземление
            showCollisionModal(gameMessageArray[4]);
            break;

        case 5: // Столкновение с боковой частью ракеты
            showCollisionModal(gameMessageArray[5]);
            break;

        case 6:
            if (rocketBottomY >= terrainPointsDownside[startZone].y ) {
                y = terrainPointsDownside[startZone].y - rocketHeight / 2;
                if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
                    showCollisionModal(gameMessageArray[3]);
                }
                speedX = 0;
                speedY = 0;
                onGround = true;
            }
            break;
    }
}

function checkCollision() {
    // Проверка столкновения с ландшафтом для каждой стороны
    const leftTerrainHeight = getTerrainHeightForDownSideAtX(rocketLeftX);
    const rightTerrainHeight = getTerrainHeightForDownSideAtX(rocketRightX);
    const centerTerrainHeight = getTerrainHeightForDownSideAtX(x);
    //Это я сделал доп проверки на приземление, чтобы избежать неккоректной посадки
    const middleLeftTerrainHeight = getTerrainHeightForDownSideAtX(rocketMiddleLeftX);
    const middleRightTerrainHeight = getTerrainHeightForDownSideAtX(rocketMiddleRightX);


    // Проверка столкновения с верхом
    if (y - (rocketHeight / 2) <= getTerrainHeightForUpSideAtX(x) ||
        y - (rocketHeight / 4) <= getTerrainHeightForUpSideAtX(x - (rocketWidth / 4)) ||
        y - (rocketHeight / 4) <= getTerrainHeightForUpSideAtX(x + (rocketWidth / 4)) ||
        y + (rocketHeight / 4) <= getTerrainHeightForUpSideAtX(x - (rocketWidth / 2)) ||
        y + (rocketHeight / 4) <= getTerrainHeightForUpSideAtX(x + (rocketWidth / 2))) {
        return 2;
    }

    if (checkStartingZone() && rocketTopY > 0 && rocketBottomY < HEIGHT){
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
    // Проверка нижней стороны
    if (rocketBottomY >= centerTerrainHeight) {
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
            y = centerTerrainHeight - rocketHeight / 2;
            return 3;
        }
        else if(leftTerrainHeight !== rightTerrainHeight ||
            rightTerrainHeight !== centerTerrainHeight){
            return 4;
        }
        else {
            return 0;
        }
    }
    // Проверка столкновения левых и правых сторон
    if (rocketBottomY >= leftTerrainHeight || rocketBottomY >= rightTerrainHeight
        || rocketBottomY >= middleLeftTerrainHeight || rocketBottomY >= middleRightTerrainHeight) {
        return 5;
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
    drawFuelBar(); // Отрисовка шкалы топлива
    drawTerrain();   // Рисуем ландшафт
    drawRocket();    // Рисуем ракету

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
    // Визуализация углов ракеты
    // drawRocketPoints();
}

//Метод для отрисовки точек столкновения.
function drawRocketPoints() {

    ctx.fillStyle = 'blue';
    // Верх
    ctx.beginPath();
    ctx.arc(rocketLeftX + 5 * rocketImagePixelsInOneBlock, rocketTopY, 3, 0, 2 * Math.PI);
    ctx.fill();

    // точка 3/4 до верха
    ctx.beginPath();
    ctx.arc(rocketLeftX + 2 * rocketImagePixelsInOneBlock, rocketTopY + 3 * rocketImagePixelsInOneBlock, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rocketRightX - 2 * rocketImagePixelsInOneBlock, rocketTopY + 3 * rocketImagePixelsInOneBlock, 3, 0, 2 * Math.PI);
    ctx.fill();

    // точка 1/2 до верха
    ctx.beginPath();
    ctx.arc(rocketLeftX + rocketImagePixelsInOneBlock, rocketTopY + 6 * rocketImagePixelsInOneBlock, 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(rocketRightX - rocketImagePixelsInOneBlock, rocketTopY + 6 * rocketImagePixelsInOneBlock, 3, 0, 2 * Math.PI);
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

function drawFuelBar() {
    const barWidth = 200; // Ширина шкалы
    const barHeight = 20; // Высота шкалы
    const barX = WIDTH - 220; // Отступ от левого края
    const barY = 130; // Отступ от верхнего края

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

// Функция для проверки высоты нижнего ландшафта в заданной x-координате
function getTerrainHeightForDownSideAtX(xCoord) {
    for (let i = 0; i < terrainPointsDownside.length - 1; i++) {
        let p1 = terrainPointsDownside[i];
        let p2 = terrainPointsDownside[i + 1];
        if (xCoord >= p1.x && xCoord <= p2.x) {
            return p1.y;
        }
    }
}

// Функция для проверки высоты ландшафта в заданной x-координате
function getTerrainHeightForUpSideAtX(xCoord) {
    for (let i = 0; i < terrainPointsUpside.length - 1; i++) {
        let p1 = terrainPointsUpside[i];
        let p2 = terrainPointsUpside[i + 1];
        if (xCoord >= p1.x && xCoord <= p2.x) {
            return p1.y;
        }
    }
}

// Проверка правильной посадочной зоны
function checkLandingZone(){
    // количество пикселей слева до начала посадочной зоны
    let x0 = terrainPointsDownside[landingZone].x;
    // количество пикселей слева до конца посадочной зоны
    let x1 = terrainPointsDownside[landingZone + 1].x;
    return !(rocketLeftX < x0 || rocketRightX > x1);
}

// Проверка правильной стартовой зоны
function checkStartingZone(){
    // количество пикселей слева до начала посадочной зоны
    let x0 = terrainPointsDownside[startZone].x;
    // количество пикселей слева до конца посадочной зоны
    let x1 = terrainPointsDownside[startZone + 1].x;
    return rocketLeftX > x0 && rocketRightX < x1;
}


