// Shrink input font size if text overflows
function adjustInputFontSize(input, minFontSize = 10, maxFontSize = 16) {
    input.style.fontSize = maxFontSize + 'px';
    // Shrink font size until text fits or minFontSize reached
    while (input.scrollWidth > input.clientWidth && parseInt(input.style.fontSize) > minFontSize) {
        input.style.fontSize = (parseInt(input.style.fontSize) - 1) + 'px';
    }
}
function updateAllShrinkInputs() {
    document.querySelectorAll('.shrink-on-overflow').forEach(input => {
        adjustInputFontSize(input);
    });
}
document.querySelectorAll('.shrink-on-overflow').forEach(input => {
    input.addEventListener('input', function () {
        adjustInputFontSize(this);
    });
});
window.addEventListener('DOMContentLoaded', updateAllShrinkInputs);
window.addEventListener('load', updateAllShrinkInputs);