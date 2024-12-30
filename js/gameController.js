window.addEventListener('DOMContentLoaded', () => {
    // DOM полностью загрузился, ищем кнопки
    const playAgainBtn     = document.getElementById('playAgainBtn');
    const menuModalBtn     = document.getElementById('menuModalBtn');
    const nextLevelBtn     = document.getElementById('nextLevelBtn');

    const pausePlayAgainBtn   = document.getElementById('pausePlayAgainBtn');
    const pauseMenuBtn        = document.getElementById('pauseMenuBtn');
    const pauseNextLevelBtn   = document.getElementById('pauseNextLevelBtn');

    const menuBtn         = document.getElementById('menuBtn'); // сверху
    const pauseBtn        = document.getElementById('pauseBtn'); // сверху
    const pauseResumeBtn      = document.getElementById('pauseResumeBtn');

    // "Пауза" (кнопка в верхней панели)
    if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
            showPauseModal();
        });
    }
    // "В меню" (кнопка в верхней панели)
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    // КНОПКИ ВНУТРИ ОКНА ПРИ СТОЛКНОВЕНИИ
    // Столкновение - Кнопка "Попробовать снова"
    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', () => {
            hideCollisionModal();
            resetGame();
        });
    }

    //Столкновение - Кнопка "Главное меню"
    if (menuModalBtn) {
        menuModalBtn.addEventListener('click', () => {
            // Переход на index.html
            window.location.href = 'index.html';
        });
    }

    // Столкновение - Кнопка "Следующий уровень"
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            goToNextLevel();
        });
    }
    // КНОПКИ ВНУТРИ ОКНА ПАУЗЫ
    // Пауза — кнопка «Вернуться в игру»
    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', () => {
            hidePauseModal();
        });
    }
    // // Пауза — «Попробовать снова»
    if (pausePlayAgainBtn) {
        pausePlayAgainBtn.addEventListener('click', () => {
            hidePauseModal();
            resetGame();
        });
    }
    // Пауза — «Главное меню»
    if (pauseMenuBtn) {
        pauseMenuBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
    // Пауза — «Следующий уровень»
    if (pauseNextLevelBtn) {
        pauseNextLevelBtn.addEventListener('click', () => {
            goToNextLevel();
        });
    }
});

// Переопределяем showCollisionModal, чтобы включать/выключать кнопку "Следующий уровень"
function showCollisionModal(message) {
    const modal = document.getElementById('collisionModal');
    const collisionText = document.getElementById('collisionText');
    const nextLevelBtn  = document.getElementById('nextLevelBtn');
    collisionText.textContent = message;
    modal.style.display = 'flex';

    if (message === collisionMessage.SUCCESS) {
        // Уровень пройден
        levelPassed = true;
        nextLevelBtn.disabled = false;
    } else {
        nextLevelBtn.disabled = !levelPassed;
    }
    gamePaused = true;
}


// Всякий раз, когда вызываем то проверяем:
// 1) Если текущий пройден, тогда переходим к следующему индексу в текущей сложности.
// 2) Если уровни текущей сложности закончились, переключаемся на следующую.
// 3) Загружаем этот уровень (loadCurrentLevel).
function goToNextLevel() {
    if (!levelPassed) {
        // Нельзя переходить к следующему уровню, если текущий не прошли
        alert("Сначала пройдите текущий уровень.");
        return;
    }

    // Переходим к следующему индексу
    currentLevelIndex++;

    // Проверяем, не вышли ли за пределы массива:
    if (currentDifficulty === 'easy' && currentLevelIndex >= easyLevels.length) {
        // Переходим на medium
        currentDifficulty = 'medium';
        currentLevelIndex = 0;
    }
    if (currentDifficulty === 'medium' && currentLevelIndex >= mediumLevels.length) {
        // Переходим на hard
        currentDifficulty = 'hard';
        currentLevelIndex = 0;
    }

    // Если мы дошли до hard и её прошли — теоретически это финал
    if (currentDifficulty === 'hard' && currentLevelIndex >= hardLevels.length) {
        alert("Вы прошли все уровни! Игра окончена.");
        // Можно вернуть в меню или обнулить всё
    }
    levelPassed = false;
    // Грузим новый уровень
    hidePauseModal();
    hideCollisionModal();
    loadCurrentLevel();
}


function hideCollisionModal() {
    const modal = document.getElementById('collisionModal');
    modal.style.display = 'none';
    gamePaused = false;
}

// Пауза
function showPauseModal() {
    const pauseModal = document.getElementById('pauseModal');
    const pauseNextLevelBtn = document.getElementById('pauseNextLevelBtn');
    pauseNextLevelBtn.disabled = !levelPassed;
    pauseModal.style.display = 'flex';
    gamePaused = true;
}

function hidePauseModal() {
    const pauseModal = document.getElementById('pauseModal');
    pauseModal.style.display = 'none';
    gamePaused = false;
}
// Создание модального окна для сообщения
function showMessageModal() {
    const modal = document.getElementById('messageModal');
    const levelTitle = document.getElementById('levelTitle');
    const levelMessage = document.getElementById('levelMessage');

    const levelData = getCurrentLevelData();
    if (!levelData) return;
    gamePaused = true;
    // Заголовок - сложность уровня
    levelTitle.textContent = levelData.difficulty.toUpperCase();
    // Сообщение из JSON
    levelMessage.textContent = levelData.message;

    modal.style.display = 'flex';
}
function hideMessageModal() {
    const modal = document.getElementById('messageModal');
    modal.style.display = 'none';
    gamePaused = false;
}
// Добавляем обработчик для кнопки "?"
const helpBtn = document.getElementById('helpBtn');
if (helpBtn) {
    helpBtn.addEventListener('click', showMessageModal);
}