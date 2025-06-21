function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    drawer.classList.toggle('translate-x-full');
}

let draggedItem = null;
let originalSlot = null;
const GRID_COLS = 5;
const GRID_ROWS = 2;

function getSlotPosition(slot) {
    return {
        row: parseInt(slot.getAttribute('data-row')),
        col: parseInt(slot.getAttribute('data-col'))
    };
}

function getSlotByPosition(row, col) {
    return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
}

function canPlaceItem(startSlot, width, height) {
    const pos = getSlotPosition(startSlot);
    if (pos.col + width > GRID_COLS || pos.row + height > GRID_ROWS) return false;
    for (let r = pos.row; r < pos.row + height; r++) {
        for (let c = pos.col; c < pos.col + width; c++) {
            const slot = getSlotByPosition(r, c);
            if (!slot) return false;
            for (let child of slot.children) {
                if (child !== draggedItem && child.classList.contains('draggable-item')) return false;
            }
            if (slot.style.visibility === 'hidden') return false;
        }
    }
    return true;
}

function placeItemInGrid(item, startSlot) {
    const width = parseInt(item.getAttribute('data-width'));
    const height = parseInt(item.getAttribute('data-height'));
    const pos = getSlotPosition(startSlot);
    for (let r = pos.row; r < pos.row + height; r++) {
        for (let c = pos.col; c < pos.col + width; c++) {
            const slot = getSlotByPosition(r, c);
            if (slot) {
                const hadLabel = slot.textContent === slot.getAttribute('data-label');
                while (slot.firstChild) slot.removeChild(slot.firstChild);
                if (hadLabel) slot.textContent = '';
            }
        }
    }
    startSlot.appendChild(item);
    item.style.position = 'absolute';
    item.style.zIndex = '10';
    const slotRect = startSlot.getBoundingClientRect();
    const gridRect = startSlot.parentElement.getBoundingClientRect();
    item.style.left = (slotRect.left - gridRect.left) + 'px';
    item.style.top = (slotRect.top - gridRect.top) + 'px';
    startSlot.parentElement.style.position = 'relative';
    if (width === 2 && height === 1) item.style.left = (slotRect.left - gridRect.left) + 'px';
    else if (width === 1 && height === 2) item.style.top = (slotRect.top - gridRect.top) + 'px';
    for (let r = pos.row; r < pos.row + height; r++) {
        for (let c = pos.col; c < pos.col + width; c++) {
            if (r !== pos.row || c !== pos.col) {
                const slot = getSlotByPosition(r, c);
                if (slot) slot.style.visibility = 'hidden';
            }
        }
    }
}

function removeItemFromGrid(item) {
    const parentSlot = item.parentElement;
    if (!parentSlot || !parentSlot.classList.contains('inventory-slot')) return;
    const width = parseInt(item.getAttribute('data-width'));
    const height = parseInt(item.getAttribute('data-height'));
    const pos = getSlotPosition(parentSlot);
    for (let r = pos.row; r < pos.row + height; r++) {
        for (let c = pos.col; c < pos.col + width; c++) {
            const slot = getSlotByPosition(r, c);
            if (slot) {
                slot.style.visibility = 'visible';
                const label = slot.getAttribute('data-label');
                if (label) slot.textContent = label;
            }
        }
    }
    item.style.gridColumn = '';
    item.style.gridRow = '';
}

function makeDraggable(el) {
    el.addEventListener('dragstart', (e) => {
        draggedItem = el;
        originalSlot = el.parentElement;
        setTimeout(() => el.classList.add('opacity-50'), 0);
    });
    el.addEventListener('dragend', () => {
        if (originalSlot && originalSlot.classList.contains('inventory-slot')) {
            if (draggedItem && draggedItem.parentElement === originalSlot) {
                const label = originalSlot.getAttribute('data-label');
                if (label && originalSlot.children.length === 0) originalSlot.textContent = label;
            }
        }
        if (draggedItem) draggedItem.classList.remove('opacity-50');
        draggedItem = null;
        originalSlot = null;
    });
}

document.querySelectorAll('.draggable-item').forEach(item => makeDraggable(item));
const slots = document.querySelectorAll('.inventory-slot');
slots.forEach(slot => {
    slot.addEventListener('dragover', e => {
        e.preventDefault();
        if (draggedItem) {
            const width = parseInt(draggedItem.getAttribute('data-width')) || 1;
            const height = parseInt(draggedItem.getAttribute('data-height')) || 1;
            if (canPlaceItem(slot, width, height)) slot.classList.add('bg-green-100');
            else slot.classList.add('bg-red-100');
        }
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('bg-green-100', 'bg-red-100'));
    slot.addEventListener('drop', e => {
        e.preventDefault();
        slot.classList.remove('bg-green-100', 'bg-red-100');
        if (draggedItem) {
            const width = parseInt(draggedItem.getAttribute('data-width')) || 1;
            const height = parseInt(draggedItem.getAttribute('data-height')) || 1;
            if (canPlaceItem(slot, width, height)) {
                if (originalSlot && originalSlot.classList.contains('inventory-slot')) removeItemFromGrid(draggedItem);
                placeItemInGrid(draggedItem, slot);
                draggedItem.setAttribute('draggable', true);
            }
        }
    });
});