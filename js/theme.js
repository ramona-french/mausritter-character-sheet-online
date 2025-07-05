// Restore dark mode from localStorage on load
if (localStorage.getItem('dark-mode') === 'on') {
    document.documentElement.classList.add('invert-dark');
}

document.getElementById('dark-toggle').onclick = function () {
    document.documentElement.classList.toggle('invert-dark');
    // Save state to localStorage
    if (document.documentElement.classList.contains('invert-dark')) {
        localStorage.setItem('dark-mode', 'on');
    } else {
        localStorage.setItem('dark-mode', 'off');
    }
}