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
            gamePaused = true;
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
            // Пока что уровней нет — просто alert
            // Позже можно сделать логику смены terrain.json
            alert('Переход на следующий уровень (пока не реализовано)');
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
            alert('Переход на следующий уровень (пока не реализовано)');
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

    // Если успех (gameMessageArray[0] = 'Посадка удалась!'), включаем nextLevelBtn
    if (message === gameMessageArray[0]) {
        nextLevelBtn.disabled = false;
    } else {
        // Иначе отключаем
        nextLevelBtn.disabled = true;
    }

    gamePaused = true;
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
    // Пока что не знаем, приземлились ли мы удачно — скорее всего нет,
    // значит nextLevelBtn = disabled. Либо хотите всегда разрешить.
    pauseNextLevelBtn.disabled = true; // например, пока отключим

    pauseModal.style.display = 'flex';
}

function hidePauseModal() {
    const pauseModal = document.getElementById('pauseModal');
    pauseModal.style.display = 'none';
    gamePaused = false;
}