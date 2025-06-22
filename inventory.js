function attachUsageDotHandlers(context = document) {
    context.querySelectorAll('.usage-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const used = dot.getAttribute('data-used') === 'true';
            dot.setAttribute('data-used', !used);
            dot.classList.toggle('bg-black', !used);
            dot.classList.toggle('bg-white', used);
        });
    });
}

function createCustomItem() {
    const title = document.getElementById('item-title').value.trim();
    const usage = parseInt(document.getElementById('item-usage').value, 10);
    const extra = document.getElementById('item-extra').value.trim();
    const type = document.getElementById('item-type').value.trim();
    const size = document.getElementById('item-size').value;
    if (!title || isNaN(usage) || usage < 0 || usage > 6) return alert("Please fill all fields properly.");
    const item = document.createElement('div');
    const [width, height] = size.split('x').map(Number);
    let sizeClasses = "w-36 h-36";
    if (size === "1x2") sizeClasses = "w-36 h-72";
    else if (size === "2x1") sizeClasses = "w-72 h-36";
    else if (size === "2x2") sizeClasses = "w-72 h-72";
    item.className = `draggable-item border border-black ${sizeClasses} p-2 text-sm flex flex-col justify-between cursor-move bg-white relative`;
    item.setAttribute("draggable", "true");
    item.setAttribute("data-width", width);
    item.setAttribute("data-height", height);

    // Usage dots as a 3x2 grid
    let usageDots = '<div class="grid grid-cols-3 grid-rows-2 gap-1">';
    for (let i = 0; i < 6; i++) {
        if (i < usage) {
            usageDots += `<span class="usage-dot inline-block w-4 h-4 border border-black rounded-full bg-white" data-used="false"></span>`;
        } else {
            usageDots += `<span class="inline-block w-4 h-4"></span>`;
        }
    }
    usageDots += '</div>';

    // Only show extra if not empty
    const extraHtml = (extra && extra.trim() !== '')
        ? `<div class="border border-black px-1 min-w-[2.5rem] text-right ml-2" contenteditable="true" style="min-height:1.5rem;">${extra}</div>`
        : `<div class="min-w-[2.5rem] ml-2"></div>`;

    item.innerHTML = `
        <div class="text-base font-semibold mb-0.5 text-left">${title}</div>
        <hr class="border-gray-300 my-1">
        <div class="flex flex-row items-center mb-2">
            <div class="flex-shrink-0">${usageDots}</div>
            <div class="flex-1 flex justify-end items-center h-full">
                ${extraHtml}
            </div>
        </div>
        <div class="flex justify-between items-end mt-auto">
            <div class="text-xs font-bold">${type}</div>
            <button onclick="deleteItem(this.parentElement.parentElement)" class="text-red-600 hover:text-red-800 text-lg">&times;</button>
        </div>
    `;
    document.getElementById('item-pool').appendChild(item);
    attachUsageDotHandlers(item);
    makeDraggable(item);
    // Clear form
    document.getElementById('item-title').value = '';
    document.getElementById('item-usage').value = '';
    document.getElementById('item-extra').value = '';
    document.getElementById('item-type').value = '';
    document.getElementById('item-size').value = '1x1';
}

function deleteItem(item) {
    if (item.parentElement.classList.contains('inventory-slot')) removeItemFromGrid(item);
    item.remove();
}