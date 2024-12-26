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

