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

// Координаты сторон ракеты
let rocketLeftX;
let rocketRightX;
let rocketTopY;
let rocketBottomY;

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
    TOP: "Collision with the top part.",
    LEFTENGINE: "You hit the left engine.",
    RIGHTENGINE: "You hit the right engine.",
    MIDDLEBOTTOM: "The rocket must touch the surface with all lower parts in the landing zone.",
    SIDE: "Collision with the side part.",
    SUCCESS: "Landing successful! Congratulations!",
    BADLANDING: "Hard landing. Speed was too high.",
    OUTSIDE: "Collision with the edge of the screen."
}
const rocketPoints = [];

let mapTriggers = [];
let developerMode = false;

const devModeToggle = document.getElementById('devModeToggle');
const devModeText = document.getElementById('devModeText'); // Reference the span for the text

devModeToggle.addEventListener('change', () => {
    developerMode = devModeToggle.checked; // Update the flag based on the checkbox state
    devModeText.textContent = developerMode ? 'DevMode ON' : 'DevMode OFF'; // Update the text
});
// Массивы уровней по сложностям
let easyLevels = [];
let mediumLevels = [];
let hardLevels = [];
let allLevelsArr = [];
let index = 0;
// Текущая сложность и индекс уровня в рамках этой сложности
let currentDifficulty = 'easy';  // Начинаем с легких
let currentLevelIndex = 0;
let levelPassed = false;         // флаг «уровень пройден или нет»
let allLevelsJson = null; // хранит загруженный JSON


async function main() {
    // 1) Подгружаем JSON (вместо terrain4.json можно любой другой):
    allLevelsJson = await loadData();

    if (!allLevelsJson) {
        console.error("Не удалось загрузить данные уровней.");
        return;
    }

    // 2) Разделяем уровни по сложностям и перемешиваем
    separateAndShuffleLevels(allLevelsJson);

    // Перед тем, как загрузить уровень, восстанавливаем прогресс
    const saved = loadGameProgress(); // функция из gameController.js
    if (saved) {
        currentDifficulty  = saved.currentDifficulty;
        currentLevelIndex  = saved.currentLevelIndex;
        levelPassed        = saved.levelPassed || false;
        index              = saved.index;
        console.log("Прогресс загружен:", saved);
    } else {
        console.log("Нет сохранённого прогресса, начинаем с easy[0].");
        currentDifficulty  = 'easy';
        currentLevelIndex  = 0;
        levelPassed        = false;
        index              = 0;
    }

    // 3) Загружаем уровень
    loadCurrentLevel();

    updateRocketPoints();
    gameLoop(); // Запускаем игровой цикл после загрузки данных
}

// entry point
main().catch(error => {
    console.error("Произошла ошибка в main:", error);
});
function saveShuffledLevelsToLocalStorage(easyArr, mediumArr, hardArr, allLevelsArr) {
    const storedData = {
        easy: easyArr,
        medium: mediumArr,
        hard: hardArr,
        all: allLevelsArr
    };
    localStorage.setItem('moonLanderLevelsOrder', JSON.stringify(storedData));
}

function loadShuffledLevelsFromLocalStorage() {
    const dataStr = localStorage.getItem('moonLanderLevelsOrder');
    if (!dataStr) return null;
    try {
        return JSON.parse(dataStr);
    } catch(e) {
        console.error("Ошибка парсинга moonLanderLevelsOrder:", e);
        return null;
    }
}

function separateAndShuffleLevels(jsonData) {
    // Проверяем, есть ли уже сохранённые массивы
    const stored = loadShuffledLevelsFromLocalStorage();
    if (stored) {
        // Если есть, восстанавливаем
        console.log("Используем уже сохранённый shuffle из localStorage");
        easyLevels   = stored.easy   || [];
        mediumLevels = stored.medium || [];
        hardLevels   = stored.hard   || [];
        allLevelsArr = stored.all    || [];
        return;
    }
    // Иначе — первый раз, формируем заново:
    let { levels } = jsonData;
    levels.forEach(lvl => {
        allLevelsArr.push(lvl);
        if (lvl.difficulty === 'easy') {
            easyLevels.push(lvl);
        } else if (lvl.difficulty === 'medium') {
            mediumLevels.push(lvl);
        } else if (lvl.difficulty === 'hard') {
            hardLevels.push(lvl);
        }
    });
    // Перемешиваем каждый массив, чтобы уровни шли в рандомном порядке
    shuffleArray(easyLevels);
    shuffleArray(mediumLevels);
    shuffleArray(hardLevels);
    // Сохраняем результат
    saveShuffledLevelsToLocalStorage(easyLevels, mediumLevels, hardLevels, allLevelsArr);
}

// Простая функция перемешивания массива (Fisher–Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
// ========================
//  ЗАГРУЗКА ТЕКУЩЕГО УРОВНЯ
// ========================
function loadCurrentLevel() {
    let levelData = getCurrentLevelData();
    if (!levelData) {
        console.warn("Уровней данной сложности не осталось или массив пуст.");
        return;
    }
    mapTriggers = [];
    terrainPointsDownside = [];
    terrainPointsUpside = [];

    // Вызываем transformData, но уже для конкретного уровня
    transformData(levelData);

    rocketLeftX = x - rocketWidth / 2 + 2;
    rocketRightX = x + rocketWidth / 2 - 2;
    rocketTopY = y - rocketHeight / 2;
    rocketBottomY = y + rocketHeight / 2;

    updateRocketPoints();

    calculateSquares("init");
    showMessageModal();
    updateLevelIndicator();
    resetGame();
}

// Возвращаем конкретный уровень из нужного массива, по индексу
function getCurrentLevelData() {
    if(currentDifficulty === 'easy') {
        if(easyLevels.length > 0){
            return easyLevels[currentLevelIndex];
        }
        else{
            currentDifficulty = 'medium';
        }
    }
    if(currentDifficulty === 'medium') {
        if(mediumLevels.length > 0){
            return mediumLevels[currentLevelIndex];
        }
        else{
            currentDifficulty = 'hard';
        }
    }
    if(currentDifficulty === 'hard') {
        if(hardLevels.length > 0){
            return hardLevels[currentLevelIndex];
        }
        else{
            return null;
        }
    }
}
function updateLevelIndicator() {
    const levelIndicator = document.getElementById('levelIndicator');
    if (!levelIndicator) return;
    // Устанавливаем текст в зависимости от текущей сложности
    levelIndicator.textContent = `${currentDifficulty.toUpperCase()} (${index+1}/${allLevelsArr.length})`;
    // Устанавливаем цвет в зависимости от текущей сложности
    switch (currentDifficulty) {
        case 'easy':
            levelIndicator.style.color = '#90EE90'; // Зеленый для легкого уровня
            break;
        case 'medium':
            levelIndicator.style.color = 'orange'; // Оранжевый для среднего уровня
            break;
        case 'hard':
            levelIndicator.style.color = 'red'; // Красный для сложного уровня
            break;
        default:
            levelIndicator.style.color = 'white'; // Белый по умолчанию
    }
}

async function loadData() {
    try {
        console.log("Начинаем запрос...");
        const response = await fetch('terrain.json');
        if (!response.ok) {
            throw new Error('Ошибка получения JSON');
        }

        const data = await response.json();
        console.log("Данные получены");

        return data;
    } catch (error) {
        console.error("Произошла ошибка: ", error);
        return null;
    }
}

function transformData(data) {
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
    rocketRightX = x + rocketWidth / 2 - 2;
    rocketTopY = y - rocketHeight / 2;
    rocketBottomY = y + rocketHeight / 2;

    updateRocketPoints();

    // Проверка столкновений
    checkCollision();
}

function checkCollision() {

    let messages = [];
    // здесь мы проходим по всем квадратам из массива mapTriggers
    // а затем проходим по массиву всех точек и проверяем нахождение точки в плоскости квадрата
    for (let i = 0; i < mapTriggers.length; i++) {
        // mapSquare = [
        // [x1, x2],  example -> [0, 15],
        // [y1, y2]              [345, 360]
        // ]
        for (let j = 0; j < rocketPoints.length; j++) {
            let squareCoords = mapTriggers[i];
            // проверка на то, что точка находится в площади игрового квадрата
            if (squareCoords[0][0] <= rocketPoints[j][0] + 1 &&
                squareCoords[0][1] >= rocketPoints[j][0] - 1 &&
                squareCoords[1][0] <= rocketPoints[j][1] &&
                squareCoords[1][1] >= rocketPoints[j][1] - 1) {

                // определяем с какой точкой было соприкосновение и записываем в массив
                switch (j) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        messages.push(collisionMessage.SIDE);
                        break;
                    case 4:
                    case 5:
                    case 6:
                        messages.push(collisionMessage.TOP);
                        break;
                    case 7:
                    case 8:
                        messages.push(collisionMessage.LEFTENGINE);
                        break;
                    case 9:
                    case 10:
                        messages.push(collisionMessage.RIGHTENGINE);
                        break;
                    case 11:
                        messages.push(collisionMessage.MIDDLEBOTTOM);
                        break;
                }
            }
        }
    }

    // проверка на starting zone
    if (checkStartingZone() && rocketBottomY >= terrainPointsDownside[startZone].y) {
        y = terrainPointsDownside[startZone].y - rocketHeight / 2;
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold) {
            showCollisionModal(collisionMessage.BADLANDING);
        }
        speedX = 0;
        speedY = 0;
        onGround = true;

        return 0;
    }
    // проверка на landing zone
    if (checkLandingZone() && rocketBottomY >= terrainPointsDownside[landingZone].y) {
        if (Math.abs(speedY) > landingSpeedThreshold || Math.abs(speedX) > landingSpeedThreshold)
            showCollisionModal(collisionMessage.BADLANDING);
        else
            handleSuccessfulLanding();
        return 0;
    }
    // Проверка боковых сторон
    if (rocketLeftX < 0 || rocketRightX > WIDTH) {
        showCollisionModal(collisionMessage.OUTSIDE);
        return 0;
    }
    // Проверка верхней стороны
    if (rocketTopY < 0) {
        showCollisionModal(collisionMessage.TOP);
        return 0;
    }

    // если хоть 1 точка пересеклась с ландшафтом, то вызываем сообщение для этой точки
    if (messages.length > 0) {
        if (messages.includes(collisionMessage.MIDDLEBOTTOM)){
            showCollisionModal(collisionMessage.MIDDLEBOTTOM);
        } else {
            showCollisionModal(messages[0]);
        }
    }
}

function handleSuccessfulLanding() {
    if (index >= allLevelsArr.length-1) {
        showCongratulationsModal("Congratulations! You've completed the game!");
    } else {
        showCollisionModal(collisionMessage.SUCCESS);
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
    ctx.strokeStyle = '#1af403';
    ctx.lineWidth = 4; // толщина зелёной линии
    ctx.stroke();
    ctx.closePath();

    // 3) Поверх рисуем startZone
    ctx.beginPath();
    // используем startZone и startZone + 1
    ctx.moveTo(terrainPointsDownside[startZone].x, terrainPointsDownside[startZone].y);
    ctx.lineTo(terrainPointsDownside[startZone + 1].x, terrainPointsDownside[startZone + 1].y);
    ctx.strokeStyle = '#16e1e1';
    ctx.lineWidth = 4; // толщина зелёной линии
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
    ctx.fillStyle = 'blue';
    for (let i = 0; i < rocketPoints.length; i++) {
        ctx.beginPath();
        ctx.arc(rocketPoints[i][0], rocketPoints[i][1], 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawFuelBar() {
    const barWidth = 200; // Ширина шкалы
    const barHeight = 20; // Высота шкалы
    const barX = WIDTH - 220; // Отступ от левого края
    const barY = HEIGHT - 50; // Отступ от верхнего края

    // Рамка шкалы
    ctx.strokeStyle = '#fff'; // Цвет рамки
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Заполненная часть шкалы
    const fuelWidth = (fuel / 100) * barWidth; // Пропорциональная ширина
    ctx.fillStyle = fuel > 70 ? '#0f0' : (fuel > 50) ? '#ffcb00' : (fuel > 20) ? '#ff7700' : '#f00'; // Цвет: зелёный, если топлива больше 20%, иначе красный
    ctx.fillRect(barX, barY, fuelWidth, barHeight);

    // Текст уровня топлива
    ctx.fillStyle = '#fff';
    ctx.font = '16px Audiowide';
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

// сохранение квадратов в mapTrigger + отрисовка этих квадратов
// ctx - canvas
// p1, p2 - points
// direction - string like "horizontal-lr"
// mode - init мод - используется 1 раз в начале для сохранения карты,
// потом эта функция используется только для графической отрисовки
// side - это или верхняя часть или нижняя часть карты (terrainPointsDownside/terrainPointsUpside)

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

function updateRocketPoints() {
    rocketPoints.length = 0; // обнуляем предыдущий массив с точками, потому что там старые координаты
    // пересчитываем координаты
    rocketPoints.push([x - 3 * oneRocketImagePixelWidth, y]);   // SIDE
    rocketPoints.push([x + 3 * oneRocketImagePixelWidth, y]);   // SIDE
    rocketPoints.push([x - 4 * oneRocketImagePixelWidth, y + 2 * oneRocketImagePixelHeight]);  // SIDE
    rocketPoints.push([x + 4 * oneRocketImagePixelWidth, y + 2 * oneRocketImagePixelHeight]);  // SIDE

    rocketPoints.push([x, y - 5 * oneRocketImagePixelHeight]);                                  // TOP
    rocketPoints.push([x - 3 * oneRocketImagePixelWidth, y - 3 * oneRocketImagePixelHeight]);   // TOP
    rocketPoints.push([x + 3 * oneRocketImagePixelWidth, y - 3 * oneRocketImagePixelHeight]);   // TOP

    rocketPoints.push([x - 5 * oneRocketImagePixelWidth, y + 5 * oneRocketImagePixelHeight]); // LEFT ENGINE
    rocketPoints.push([x - 5 * oneRocketImagePixelWidth, y + 3 * oneRocketImagePixelHeight]); // LEFT ENGINE

    rocketPoints.push([x + 5 * oneRocketImagePixelWidth, y + 5 * oneRocketImagePixelHeight]); // RIGHT ENGINE
    rocketPoints.push([x + 5 * oneRocketImagePixelWidth, y + 3 * oneRocketImagePixelHeight]); // RIGHT ENGINE

    rocketPoints.push([x, y + 5 * oneRocketImagePixelHeight]);  // MIDDLE BOTTOM
}
