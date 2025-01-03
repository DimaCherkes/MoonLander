const menuView  = document.getElementById('menuView');
const rulesView = document.getElementById('rulesView');
const playBtn   = document.getElementById('playBtn');
const rulesBtn  = document.getElementById('rulesBtn');
const backBtn   = document.getElementById('backBtn');
const menuTitle = document.getElementById('menu-title');
const startNewGameBtn = document.getElementById('startNewGameBtn');
document.addEventListener('DOMContentLoaded', () => {
    showMenu();
    // Проверяем, есть ли прогресс
    const savedProgress = localStorage.getItem('moonLanderProgress');
    if (!savedProgress) {
        // Нет прогресса => disabled для playBtn
        playBtn.disabled = true;
    } else {
        // Есть прогресс => можно нажимать Play
        playBtn.disabled = false;
    }
});

// "Play" button => redirect to game.html
playBtn.addEventListener('click', () => {
    // Проверяем, поддерживается ли DeviceOrientationEvent
    if (typeof DeviceOrientationEvent !== 'undefined') {
        // Проверяем, требуется ли запрос разрешения (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then((permissionState) => {
                    if (permissionState === 'granted') {
                        // Разрешение получено => вешаем обработчик
                        window.addEventListener('deviceorientation', handleOrientation);
                        console.log('Гироскоп разрешён пользователем (iOS).');
                    } else {
                        alert("Gyroscope access was denied. Please enable it in device settings.");
                    }
                })
                .catch((err) => {
                    console.error("Ошибка при запросе разрешения на гироскоп:", err);
                });
        } else {
            // Android / Десктоп / iOS < 13 — разрешение не нужно
            window.addEventListener('deviceorientation', handleOrientation);
            console.log("DeviceOrientationEvent доступен без запроса разрешения.");
        }
    } else {
        console.log("DeviceOrientationEvent не поддерживается в этом браузере.");
    }
    window.location.href = 'game.html';
});

// "Rules" button => hide the menu, show the rules block
rulesBtn.addEventListener('click', () => {
    menuView.style.display  = 'none';
    menuTitle.style.display  = 'none';
    rulesView.style.display = 'block';
    // Прокрутка текста правил в начало
    const rulesTextElement = document.querySelector('.rules-text');
    rulesTextElement.scrollTo({ top: 0, behavior: 'smooth' });
});

// "Back" button => return to the menu block
backBtn.addEventListener('click', () => {
    showMenu();
});
startNewGameBtn.addEventListener('click', () => {
    // Проверяем, поддерживается ли DeviceOrientationEvent
    if (typeof DeviceOrientationEvent !== 'undefined') {
        // Проверяем, требуется ли запрос разрешения (iOS 13+)
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then((permissionState) => {
                    if (permissionState === 'granted') {
                        // Разрешение получено => вешаем обработчик
                        window.addEventListener('deviceorientation', handleOrientation);
                        console.log('Гироскоп разрешён пользователем (iOS).');
                    } else {
                        alert("Gyroscope access was denied. Please enable it in device settings.");
                    }
                })
                .catch((err) => {
                    console.error("Ошибка при запросе разрешения на гироскоп:", err);
                });
        } else {
            // Android / Десктоп / iOS < 13 — разрешение не нужно
            window.addEventListener('deviceorientation', handleOrientation);
            console.log("DeviceOrientationEvent доступен без запроса разрешения.");
        }
    } else {
        console.log("DeviceOrientationEvent не поддерживается в этом браузере.");
    }
    localStorage.removeItem('moonLanderProgress');
    localStorage.removeItem('moonLanderLevelsOrder');
    window.location.href = 'game.html';
});
function showMenu() {
    menuTitle.style.display  = 'block';
    menuView.style.display  = 'flex';
    rulesView.style.display = 'none';
}
