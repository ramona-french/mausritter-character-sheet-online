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

// Character fields
function loadData() {
    const fields = [
        'character-name', 'character-background', 'character-description',
        'character-birthsign', 'character-coat', 'character-look',
        'stat-str-max', 'stat-str-current', 'stat-dex-max', 'stat-dex-current',
        'stat-wil-max', 'stat-wil-current', 'stat-hp-max', 'stat-hp-current',
        'pips-amount', 'character-level', 'character-xp', 'character-grit',
        'ignored-conditions', 'banked-items'
    ];
    fields.forEach(field => {
        const value = localStorage.getItem(field);
        if (value) document.getElementById(field).value = value;
    });
}

function saveData() {
    const fields = [
        'character-name', 'character-background', 'character-description',
        'character-birthsign', 'character-coat', 'character-look',
        'stat-str-max', 'stat-str-current', 'stat-dex-max', 'stat-dex-current',
        'stat-wil-max', 'stat-wil-current', 'stat-hp-max', 'stat-hp-current',
        'pips-amount', 'character-level', 'character-xp', 'character-grit',
        'ignored-conditions', 'banked-items'
    ];
    fields.forEach(field => {
        const value = document.getElementById(field).value;
        localStorage.setItem(field, value);
    });
}

// Event listeners
window.addEventListener('load', loadData);
window.addEventListener('input', saveData);
window.addEventListener('load', () => {
    loadItems();
    saveItems();
});

document.getElementById('item-pool').addEventListener('DOMSubtreeModified', saveItems);
document.querySelectorAll('.inventory-slot').forEach(slot => {
    slot.addEventListener('DOMSubtreeModified', saveItems);
});
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('usage-dot')) setTimeout(saveItems, 10);
});
const origCreateCustomItem = window.createCustomItem;
window.createCustomItem = function () {
    origCreateCustomItem();
    saveItems();
};
const origDeleteItem = window.deleteItem;
window.deleteItem = function (item) {
    origDeleteItem(item);
    saveItems();
};
document.querySelectorAll('.inventory-slot').forEach(slot => {
    slot.addEventListener('drop', () => setTimeout(saveItems, 10));
});