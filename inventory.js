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
    item.className = `draggable-item border border-black ${sizeClasses} p-2 text-sm flex flex-col justify-between cursor-move bg-white relative`;
    item.setAttribute("draggable", "true");
    item.setAttribute("data-width", width);
    item.setAttribute("data-height", height);
    let usageDots = "";
    for (let i = 0; i < usage; i++) {
        usageDots += `<span class="usage-dot inline-block w-4 h-4 border border-black rounded-full mr-1 bg-white" data-used="false"></span>`;
    }
    item.innerHTML = `
        <div class="flex justify-between items-start mb-1">
            <div class="flex flex-wrap">${usageDots}</div>
            <div class="border border-black px-1" contenteditable="true">${extra}</div>
        </div>
        <div class="text-xs font-bold">${type}</div>
        <div class="text-base font-semibold truncate">${title}</div>
        <button onclick="deleteItem(this.parentElement)" class="absolute bottom-1 right-1 text-red-600 hover:text-red-800">&times;</button>
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