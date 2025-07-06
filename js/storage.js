function serializeItem(item) {
    let slot = null;
    if (item.parentElement.classList.contains('inventory-slot')) {
        slot = item.parentElement.getAttribute('data-slot');
    }
    const usageDots = Array.from(item.querySelectorAll('.usage-dot')).map(dot => dot.getAttribute('data-used') === 'true');
    const extraDiv = item.querySelector('div[contenteditable]');
    return {
        title: item.querySelector('.text-base.font-semibold')?.textContent || '',
        usage: usageDots.length,
        usageDots,
        extra: extraDiv ? extraDiv.textContent : '',
        type: item.querySelector('.text-xs.font-bold')?.textContent || '',
        size: item.getAttribute('data-width') + 'x' + item.getAttribute('data-height'),
        slot,
    };
}

function saveItems() {
    const items = [];
    document.querySelectorAll('#item-pool .draggable-item').forEach(item => items.push(serializeItem(item)));
    document.querySelectorAll('.inventory-slot .draggable-item').forEach(item => items.push(serializeItem(item)));
    localStorage.setItem('inventory-items', JSON.stringify(items));
}

function createItemFromData(data) {
    const item = document.createElement('div');
    let sizeClasses = "w-36 h-36";
    if (data.size === "1x2") sizeClasses = "w-36 h-72";
    else if (data.size === "2x1") sizeClasses = "w-72 h-36";
    else if (data.size === "2x2") sizeClasses = "w-72 h-72";
    item.className = `draggable-item border border-black ${sizeClasses} p-2 text-sm flex flex-col bg-white relative`;
    item.setAttribute("draggable", "true");
    const [width, height] = data.size.split('x').map(Number);
    item.setAttribute("data-width", width);
    item.setAttribute("data-height", height);

    // Usage dots as a 3x2 grid
    let usageDots = '<div class="grid grid-cols-3 grid-rows-2 gap-1">';
    for (let i = 0; i < 6; i++) {
        if (i < data.usage) {
            const used = data.usageDots && data.usageDots[i];
            usageDots += `<span class="usage-dot inline-block w-4 h-4 border border-black rounded-full ${used ? 'bg-black' : 'bg-white'}" data-used="${!!used}"></span>`;
        } else {
            usageDots += `<span class="inline-block w-4 h-4"></span>`;
        }
    }
    usageDots += '</div>';

    // Only show extra if not empty
    const extraHtml = (data.extra && data.extra.trim() !== '')
        ? `<div class="border border-black px-1 min-w-[2.5rem] text-right ml-2 font-pt-sans-narrow font-bold" contenteditable="true" style="min-height:1.5rem;">${data.extra}</div>`
        : `<div class="min-w-[2.5rem] ml-2 font-pt-sans-narrow font-bold"></div>`;

    item.innerHTML = `
        <div class="text-base font-semibold mb-0.5 text-left font-germania">${data.title || ''}</div>
        <hr class="border-black w-full my-1">
        <div class="flex flex-row items-center mb-2 font-pt-sans-narrow font-bold">
            <div class="flex-shrink-0">${usageDots}</div>
            <div class="flex-1 flex justify-end items-center h-full">
                ${extraHtml}
            </div>
        </div>
        <div class="flex justify-between items-end mt-auto font-pt-sans-narrow font-bold">
            <div class="text-xs font-bold">${data.type || ''}</div>
            <button onclick="deleteItem(this.parentElement.parentElement)" class="text-red-600 hover:text-red-800 text-lg">&times;</button>
        </div>
    `;
    attachUsageDotHandlers(item);
    makeDraggable(item);
    return item;
}

function loadItems() {
    document.querySelectorAll('.draggable-item').forEach(item => item.remove());
    document.querySelectorAll('.inventory-slot').forEach(slot => {
        slot.style.visibility = 'visible';
        slot.textContent = slot.getAttribute('data-label');
    });
    const items = JSON.parse(localStorage.getItem('inventory-items') || '[]');
    for (const data of items) {
        const item = createItemFromData(data);
        if (data.slot !== null && data.slot !== undefined) {
            const slot = document.querySelector(`.inventory-slot[data-slot="${data.slot}"]`);
            if (slot) placeItemInGrid(item, slot);
            else document.getElementById('item-pool').appendChild(item);
        } else {
            document.getElementById('item-pool').appendChild(item);
        }
    }
}

// --- Sheet Management ---
function getSheets() {
    return JSON.parse(localStorage.getItem('character-sheets') || '{}');
}
function setSheets(sheets) {
    localStorage.setItem('character-sheets', JSON.stringify(sheets));
}
function getCurrentSheetId() {
    return localStorage.getItem('current-sheet-id');
}
function setCurrentSheetId(id) {
    localStorage.setItem('current-sheet-id', id);
}
function getCurrentSheet() {
    const sheets = getSheets();
    return sheets[getCurrentSheetId()];
}
function saveCurrentSheetData() {
    const sheets = getSheets();
    const id = getCurrentSheetId();
    if (!id) return;
    sheets[id] = {
        name: document.getElementById('character-name').value || 'Unnamed',
        data: getSheetData(),
        items: getSheetItems()
    };
    setSheets(sheets);
}
function loadSheetToUI(sheet) {
    if (!sheet) return;
    setSheetData(sheet.data || {});
    setSheetItems(sheet.items || []);
}
function getSheetData() {
    const fields = [
        'character-name', 'character-background', 'character-description',
        'character-birthsign', 'character-coat', 'character-look',
        'stat-str-max', 'stat-str-current', 'stat-dex-max', 'stat-dex-current',
        'stat-wil-max', 'stat-wil-current', 'stat-hp-max', 'stat-hp-current',
        'pips-amount', 'character-level', 'character-xp', 'character-grit',
        'ignored-conditions', 'banked-items'
    ];
    const data = {};
    fields.forEach(field => {
        const el = document.getElementById(field);
        if (el) data[field] = el.value;
    });
    return data;
}
function setSheetData(data) {
    Object.entries(data).forEach(([field, value]) => {
        const el = document.getElementById(field);
        if (el) el.value = value;
    });
}
function getSheetItems() {
    const items = [];
    document.querySelectorAll('#item-pool .draggable-item').forEach(item => items.push(serializeItem(item)));
    document.querySelectorAll('.inventory-slot .draggable-item').forEach(item => items.push(serializeItem(item)));
    return items;
}
function setSheetItems(items) {
    document.querySelectorAll('.draggable-item').forEach(item => item.remove());
    document.querySelectorAll('.inventory-slot').forEach(slot => {
        slot.style.visibility = 'visible';
        slot.textContent = slot.getAttribute('data-label');
    });
    for (const data of items) {
        const item = createItemFromData(data);
        if (data.slot !== null && data.slot !== undefined) {
            const slot = document.querySelector(`.inventory-slot[data-slot="${data.slot}"]`);
            if (slot) placeItemInGrid(item, slot);
            else document.getElementById('item-pool').appendChild(item);
        } else {
            document.getElementById('item-pool').appendChild(item);
        }
    }
}

// --- Sheet Selector UI ---
function updateSheetSelector() {
    const selector = document.getElementById('sheet-selector');
    const sheets = getSheets();
    const currentId = getCurrentSheetId();
    selector.innerHTML = '';
    Object.entries(sheets).forEach(([id, sheet]) => {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = sheet.name || 'Unnamed';
        if (id === currentId) opt.selected = true;
        selector.appendChild(opt);
    });
}
function createNewSheet() {
    const id = 'sheet-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    const sheets = getSheets();
    sheets[id] = {
        name: 'New Character',
        data: {}, // ensure blank
        items: [] // ensure blank
    };
    setSheets(sheets);
    setCurrentSheetId(id);
    updateSheetSelector();
    // Clear UI to blank for new sheet
    setSheetData({});
    setSheetItems([]);
    // Reset all input fields and textareas
    document.querySelectorAll('input, textarea').forEach(el => {
        if (el.type === 'checkbox' || el.type === 'radio') {
            el.checked = false;
        } else {
            el.value = '';
        }
    });
}
function deleteCurrentSheet() {
    const id = getCurrentSheetId();
    if (!id) return;
    const sheets = getSheets();
    if (Object.keys(sheets).length <= 1) {
        alert("You must have at least one sheet.");
        return;
    }
    if (!confirm("Delete this character sheet? This cannot be undone.")) return;
    delete sheets[id];
    const nextId = Object.keys(sheets)[0];
    setSheets(sheets);
    setCurrentSheetId(nextId);
    updateSheetSelector();
    loadSheetToUI(sheets[nextId]);
}
function switchSheet(id) {
    saveCurrentSheetData();
    setCurrentSheetId(id);
    updateSheetSelector();
    const sheet = getSheets()[id];
    loadSheetToUI(sheet);
}
function exportCurrentSheet() {
    saveCurrentSheetData();
    const sheet = getCurrentSheet();
    if (!sheet) return;
    const blob = new Blob([JSON.stringify(sheet, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const name = (sheet.name || 'character') + '.mcs';
    a.download = name.replace(/[\\/:*?"<>|]+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
function importSheet(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const sheet = JSON.parse(e.target.result);
            if (!sheet || typeof sheet !== 'object' || !sheet.data) throw new Error();
            const id = 'sheet-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
            const sheets = getSheets();
            sheets[id] = {
                name: sheet.name || 'Imported Character',
                data: sheet.data,
                items: sheet.items || []
            };
            setSheets(sheets);
            setCurrentSheetId(id);
            updateSheetSelector();
            loadSheetToUI(sheets[id]);
        } catch {
            alert("Invalid .mcs file.");
        }
    };
    reader.readAsText(file);
}

// --- Patch UI events ---
window.addEventListener('DOMContentLoaded', () => {
    // Sheet selector
    const selector = document.getElementById('sheet-selector');
    selector.addEventListener('change', e => switchSheet(e.target.value));
    document.getElementById('sheet-add').onclick = createNewSheet;
    document.getElementById('sheet-delete').onclick = deleteCurrentSheet;
    document.getElementById('sheet-export').onclick = exportCurrentSheet;
    document.getElementById('sheet-import').addEventListener('change', function () {
        if (this.files && this.files[0]) importSheet(this.files[0]);
        this.value = '';
    });

    // Update sheet name instantly when character name changes
    const nameInput = document.getElementById('character-name');
    if (nameInput) {
        nameInput.addEventListener('input', () => {
            updateSheetSelectorName();
        });
    }

    document.getElementById('sheet-add').onclick = createNewSheet;
    
    // If no sheets, create one
    let sheets = getSheets();
    if (!Object.keys(sheets).length) {
        createNewSheet();
        sheets = getSheets();
    }
    // Set current sheet if not set
    if (!getCurrentSheetId() || !sheets[getCurrentSheetId()]) {
        setCurrentSheetId(Object.keys(sheets)[0]);
    }
    updateSheetSelector();
    loadSheetToUI(getCurrentSheet());
});

// Save on input
window.addEventListener('input', () => {
    saveCurrentSheetData();
    updateSheetSelectorName();
});
window.addEventListener('load', () => {
    saveCurrentSheetData();
    updateSheetSelectorName();
});
function updateSheetSelectorName() {
    // Update sheet name if character name changes
    const id = getCurrentSheetId();
    if (!id) return;
    const sheets = getSheets();
    const name = document.getElementById('character-name').value || 'Unnamed';
    if (sheets[id] && sheets[id].name !== name) {
        sheets[id].name = name;
        setSheets(sheets);
        updateSheetSelector();
    }
}

// Save items on DOM changes
document.getElementById('item-pool').addEventListener('DOMSubtreeModified', saveCurrentSheetData);
document.querySelectorAll('.inventory-slot').forEach(slot => {
    slot.addEventListener('DOMSubtreeModified', saveCurrentSheetData);
});
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('usage-dot')) setTimeout(saveCurrentSheetData, 10);
});
const origCreateCustomItem = window.createCustomItem;
window.createCustomItem = function () {
    origCreateCustomItem();
    saveCurrentSheetData();
};
const origDeleteItem = window.deleteItem;
window.deleteItem = function (item) {
    origDeleteItem(item);
    saveCurrentSheetData();
};
document.querySelectorAll('.inventory-slot').forEach(slot => {
    slot.addEventListener('drop', () => setTimeout(saveCurrentSheetData, 10));
});

// --- Legacy compatibility: override load/saveItems/data ---
window.saveItems = saveCurrentSheetData;
window.loadItems = function () {
    // No-op: handled by sheet switching
};
window.saveData = saveCurrentSheetData;
window.loadData = function () {
    // No-op: handled by sheet switching
};