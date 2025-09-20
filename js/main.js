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
            // Skip if slot is occupied by the item being moved
            if (slot.children.length > 0 && draggedItem && slot.children[0] === draggedItem) continue;
            if (slot.children.length > 0) return false;
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
    let dragging = false;
    let dragClone = null;
    let dragOffsetX = 0, dragOffsetY = 0;
    let isTouch = false;

    function updateClonePosition(x, y) {
        if (dragClone) {
            dragClone.style.left = (x - dragOffsetX) + 'px';
            dragClone.style.top = (y - dragOffsetY) + 'px';
        }
    }

    function dragStart(e) {
        isTouch = e.type.startsWith('touch');
        draggedItem = el;
        originalSlot = el.parentElement;
        dragging = true;
        let x, y;
        if (isTouch) {
            const touch = e.touches[0];
            x = touch.clientX;
            y = touch.clientY;
            const rect = el.getBoundingClientRect();
            dragOffsetX = x - (rect.left + rect.width / 2);
            dragOffsetY = y - (rect.top + rect.height / 2);
            dragClone = el.cloneNode(true);
            Object.assign(dragClone.style, {
                position: 'fixed',
                left: (x - dragOffsetX) + 'px',
                top: (y - dragOffsetY) + 'px',
                pointerEvents: 'none',
                opacity: '0.7',
                zIndex: '9999',
                width: rect.width + 'px',
                height: rect.height + 'px',
                margin: '0',
            });
            document.body.appendChild(dragClone);
        } else {
            setTimeout(() => el.classList.add('opacity-50'), 0);
        }
        el.classList.add('opacity-50');
    }

    function dragMove(e) {
        if (!dragging) return;
        let x, y;
        if (isTouch) {
            const touch = e.touches[0];
            x = touch.clientX;
            y = touch.clientY;
            updateClonePosition(x, y);
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        // Highlight slot under pointer
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            const rect = slot.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                const width = parseInt(draggedItem.getAttribute('data-width')) || 1;
                const height = parseInt(draggedItem.getAttribute('data-height')) || 1;
                if (canPlaceItem(slot, width, height)) slot.classList.add('bg-green-100');
                else slot.classList.add('bg-red-100');
            } else {
                slot.classList.remove('bg-green-100', 'bg-red-100');
            }
        });
        // Highlight item pool
        const pool = document.getElementById('item-pool');
        if (pool) {
            const rect = pool.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                pool.classList.add('bg-green-100');
            } else {
                pool.classList.remove('bg-green-100');
            }
        }
        if (isTouch) e.preventDefault();
    }

    function dragEnd(e) {
        if (!dragging) return;
        let x, y;
        if (isTouch) {
            const touch = (e.changedTouches && e.changedTouches[0]) || (e.touches && e.touches[0]);
            x = touch.clientX;
            y = touch.clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }
        let dropped = false;
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            const rect = slot.getBoundingClientRect();
            slot.classList.remove('bg-green-100', 'bg-red-100');
            if (!dropped && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                const width = parseInt(draggedItem.getAttribute('data-width')) || 1;
                const height = parseInt(draggedItem.getAttribute('data-height')) || 1;
                if (canPlaceItem(slot, width, height)) {
                    if (originalSlot && originalSlot.classList.contains('inventory-slot')) removeItemFromGrid(draggedItem);
                    placeItemInGrid(draggedItem, slot);
                    dropped = true;
                }
            }
        });
        const pool = document.getElementById('item-pool');
        if (pool) {
            pool.classList.remove('bg-green-100');
            const rect = pool.getBoundingClientRect();
            if (!dropped && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                if (originalSlot && originalSlot.classList.contains('inventory-slot')) {
                    removeItemFromGrid(draggedItem);
                }
                draggedItem.style.position = '';
                draggedItem.style.left = '';
                draggedItem.style.top = '';
                draggedItem.style.zIndex = '';
                pool.appendChild(draggedItem);
                dropped = true;
            }
        }
        if (dragClone) {
            document.body.removeChild(dragClone);
            dragClone = null;
        }
        if (draggedItem) draggedItem.classList.remove('opacity-50');
        draggedItem = null;
        originalSlot = null;
        dragging = false;
        if (typeof saveItems === "function") saveItems();
    }

    // Mouse events
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragend', dragEnd);
    // Touch events
    el.addEventListener('touchstart', dragStart, { passive: false });
    el.addEventListener('touchmove', dragMove, { passive: false });
    el.addEventListener('touchend', dragEnd);
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

// Allow dropping items back into the item pool even if it's empty
const itemPool = document.getElementById('item-pool');
if (itemPool) {
    // Always allow dropping, even if there are no children
    itemPool.addEventListener('dragover', e => {
        e.preventDefault();
        if (draggedItem) {
            itemPool.classList.add('bg-green-100');
        }
    });
    itemPool.addEventListener('dragleave', () => {
        itemPool.classList.remove('bg-green-100');
    });
    // Use event delegation to allow dropping on empty space
    itemPool.addEventListener('drop', e => {
        e.preventDefault();
        itemPool.classList.remove('bg-green-100');
        if (draggedItem) {
            // If item was in inventory, clean up grid state
            if (originalSlot && originalSlot.classList.contains('inventory-slot')) {
                removeItemFromGrid(draggedItem);
            }
            // Remove absolute positioning and styles
            draggedItem.style.position = '';
            draggedItem.style.left = '';
            draggedItem.style.top = '';
            draggedItem.style.zIndex = '';
            // Add to pool (works even if pool is empty)
            itemPool.appendChild(draggedItem);
            // Save after dropping into the pool
            if (typeof saveItems === "function") saveItems();
        }
    });
}
