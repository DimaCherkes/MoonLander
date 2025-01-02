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
// Обработка гироскопа для горизонтальной ориентации
if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
        // Получаем ориентацию устройства
        const orientationType = screen.orientation?.type || 'portrait-primary';

        if (orientationType.includes('landscape')) {
            // Горизонтальная ориентация
            if (orientationType === 'landscape-primary') {
                // Ландшафтная ориентация (левая сторона сверху)
                tiltX = event.beta;  // Наклон вверх/вниз
                tiltY = -event.gamma; // Наклон влево/вправо
            } else if (orientationType === 'landscape-secondary') {
                // Ландшафтная ориентация (правая сторона сверху)
                tiltX = -event.beta; // Инвертируем направление
                tiltY = event.gamma; // Наклон влево/вправо
            }
        } else {
            // Вертикальная ориентация
            tiltX = event.gamma; // Наклон влево/вправо
            tiltY = event.beta;  // Наклон вверх/вниз
        }

        // Ограничиваем значения для устойчивости
        tiltX = Math.max(-45, Math.min(45, tiltX));
        tiltY = Math.max(-45, Math.min(45, tiltY));
    });
}
function handleOrientation(event) {
    // Получаем ориентацию устройства
    const orientationType = screen.orientation?.type || 'portrait-primary';

    if (orientationType.includes('landscape')) {
        // Горизонтальная ориентация
        if (orientationType === 'landscape-primary') {
            // Ландшафтная ориентация (левая сторона сверху)
            tiltX = event.beta;    // Наклон вверх/вниз
            tiltY = -event.gamma;  // Наклон влево/вправо
        } else {
            // 'landscape-secondary'
            tiltX = -event.beta;   // Инверсия
            tiltY = event.gamma;   // Наклон
        }
    } else {
        // Вертикальная ориентация
        tiltX = event.gamma;  // Наклон влево/вправо
        tiltY = event.beta;   // Наклон вверх/вниз
    }

    // Ограничиваем значения (стабилизация)
    tiltX = Math.max(-45, Math.min(45, tiltX));
    tiltY = Math.max(-45, Math.min(45, tiltY));
}
// Обработка касания
document.addEventListener('touchstart', (e) => {
    const topPanel = document.querySelector('.top-panel');
    if (!topPanel.contains(e.target)) {
        touchActive = true; // Включаем флаг при касании, если это не в top-panel
    }
});

document.addEventListener('touchend', (e) => {
    const topPanel = document.querySelector('.top-panel');
    if (!topPanel.contains(e.target)) {
        touchActive = false; // Выключаем флаг при завершении касания, если это не в top-panel
    }
});

