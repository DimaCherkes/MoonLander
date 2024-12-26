const menuView  = document.getElementById('menuView');
const rulesView = document.getElementById('rulesView');
const playBtn   = document.getElementById('playBtn');
const rulesBtn  = document.getElementById('rulesBtn');
const backBtn   = document.getElementById('backBtn');

// On load: show the menu, hide the rules
document.addEventListener('DOMContentLoaded', () => {
    showMenu();
});

// "Play" button => redirect to game.html
playBtn.addEventListener('click', () => {
    window.location.href = 'game.html';
});

// "Rules" button => hide the menu, show the rules block
rulesBtn.addEventListener('click', () => {
    menuView.style.display  = 'none';
    rulesView.style.display = 'block';
});

// "Back" button => return to the menu block
backBtn.addEventListener('click', () => {
    showMenu();
});

function showMenu() {
    menuView.style.display  = 'block';
    rulesView.style.display = 'none';
}
