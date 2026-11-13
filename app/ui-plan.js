import { fsActions } from './firebase-sync.js';

export function renderPlanModule() {
    const sub = window.state.planSubTab || 'calendar';
    ['calendar', 'tasks', 'events', 'inbox', 'projects'].forEach(t => {
        const view = document.getElementById(`plan-sub-${t}`);
        const btn = document.getElementById(`btn-plan-${t}`);
        if (view) view.classList.toggle('hidden', t !== sub);
        if (btn) {
            btn.classList.toggle('bg-accent', t === sub);
            btn.classList.toggle('text-white', t === sub);
        }
    });

    renderCalendarGrid();
    renderTasksAndEventsLists();
    renderProjectsBoard();
}

window.setPlanSubTab = (tab) => {
    window.state.planSubTab = tab;
    renderPlanModule();
};

function renderCalendarGrid() {
    const y = window.state.calYear;
    const m = window.state.calMonth;
    const first = new Date(y, m, 1);
    const label = document.getElementById('calendar-month-label');
    if (label) label.textContent = first.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const startDay = first.getDay();
    const totalDays = new Date(y, m + 1, 0).getDate();
    let html = '';

    for (let i = 0; i < startDay; i++) html += `<div class="h-12"></div>`;
    for (let d = 1; d <= totalDays; d++) {
        const items = (window.state.tasks || []).filter(t => !t.inInbox && Number(t.day) === d && Number(t.month) === (m + 1) && Number(t.year) === y);
        const hasEvents = items.some(i => i.isEvent);
        const hasTasks = items.some(i => !i.isEvent);
        const isSel = d === window.state.selectedDay;

        html += `
            <button onclick="selectCalDay(${d})" class="h-12 rounded-xl border ${isSel ? 'border-accent bg-accent/20 text-white' : 'border-[#28283C] bg-[#0A0A0F] text-gray-300'} flex flex-col items-center justify-center text-xs font-bold">
                <span>${d}</span>
                <div class="flex space-x-1 mt-1">
                    ${hasTasks ? '<span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>' : ''}
                    ${hasEvents ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>' : ''}
                </div>
            </button>
        `;
    }
    const grid = document.getElementById('calendar-grid-days');
    if (grid) grid.innerHTML = html;

    const selItems = (window.state.tasks || []).filter(t => !t.inInbox && Number(t.day) === window.state.selectedDay && Number(t.month) === (m + 1) && Number(t.year) === y);
    const selBox = document.getElementById('calendar-selected-day-items');
    if (selBox) {
        selBox.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="text-xs font-bold text-gray-400">Agenda del ${window.state.selectedDay}/${m + 1}/${y}</span>
                <div class="space-x-2">
                    <button onclick="openTaskModal(false)" class="text-xs font-bold text-accent">+ Tarea</button>
                    <button onclick="openTaskModal(true)" class="text-xs font-bold text-blue-400">+ Evento</button>
                </div>
            </div>
            ${selItems.length === 0 ? '<p class="text-xs text-gray-500">Sin elementos programados este día.</p>' : selItems.map(renderPlanRow).join('')}
        `;
    }
}

function renderPlanRow(t) {
    if (t.isEvent) {
        return `
            <div class="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <span>📅</span>
                    <div>
                        <p class="text-xs font-bold text-blue-300">${t.title}</p>
                        <p class="text-[10px] text-gray-400">${t.day}/${t.month}/${t.year} · ${t.time || 'Todo el día'}${t.endTime ? ' - ' + t.endTime : ''} ${t.location ? '· 📍 ' + t.location : ''}</p>
                    </div>
                </div>
                <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
            </div>
        `;
    }
    const prioColor = t.priority === 'Alta' ? 'text-red-400' : t.priority === 'Baja' ? 'text-gray-400' : 'text-amber-400';
    return `
        <div class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="toggleTaskCheck('${t.docId}', ${!t.isCompleted})" class="w-4 h-4 accent-purple-600 rounded cursor-pointer">
                <div>
                    <p class="text-xs ${t.isCompleted ? 'line-through text-gray-500' : 'font-semibold'}">${t.title}</p>
                    <p class="text-[10px] text-gray-400">${t.day}/${t.month}/${t.year} · <span class="${prioColor}">${t.priority || 'Media'}</span> ${t.project ? '· 📁 ' + t.project : ''}</p>
                </div>
            </div>
            <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
        </div>
    `;
}

function renderTasksAndEventsLists() {
    const tasksList = window.state.tasks || [];
    const onlyTasks = tasksList.filter(t => !t.isEvent && !t.inInbox);
    const onlyEvents = tasksList.filter(t => t.isEvent);
    const inboxTasks = tasksList.filter(t => t.inInbox);

    const tBox = document.getElementById('plan-tasks-container');
    const eBox = document.getElementById('plan-events-container');
    const iBox = document.getElementById('plan-inbox-container');

    if (tBox) tBox.innerHTML = onlyTasks.length === 0 ? '<p class="text-xs text-gray-400">No hay tareas pendientes.</p>' : onlyTasks.map(renderPlanRow).join('');
    if (eBox) eBox.innerHTML = onlyEvents.length === 0 ? '<p class="text-xs text-gray-400">No hay eventos registrados.</p>' : onlyEvents.map(renderPlanRow).join('');
    if (iBox) iBox.innerHTML = inboxTasks.length === 0 ? '<p class="text-xs text-gray-400">Bandeja de entrada vacía.</p>' : inboxTasks.map(renderPlanRow).join('');
}

function renderProjectsBoard() {
    const el = document.getElementById('plan-projects-grid');
    if (!el) return;
    const projs = window.state.projects || [];
    if (projs.length === 0) {
        el.innerHTML = `<p class="text-xs text-gray-400 col-span-3">Sin proyectos creados. Pulsa "+ Proyecto" para organizar tus tareas.</p>`;
        return;
    }
    el.innerHTML = projs.map(p => {
        const projTasks = (window.state.tasks || []).filter(t => t.project === p.name);
        const done = projTasks.filter(t => t.isCompleted).length;
        const pct = projTasks.length ? Math.round((done / projTasks.length) * 100) : 0;
        return `
            <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-3">
                <div class="flex justify-between items-start">
                    <div>
                        <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/15 text-accent">${p.categories || 'General'}</span>
                        <h4 class="text-base font-extrabold mt-1">${p.name}</h4>
                        <p class="text-xs text-gray-400">${p.description || ''}</p>
                    </div>
                    <button onclick="deleteDocItem('projects', '${p.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
                <div>
                    <div class="flex justify-between text-[11px] font-bold mb-1">
                        <span>${done}/${projTasks.length} tareas</span>
                        <span>${pct}%</span>
                    </div>
                    <div class="w-full h-2 bg-[#0A0A0F] rounded-full overflow-hidden">
                        <div class="h-full bg-accent" style="width:${pct}%"></div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.changeCalendarMonth = (delta) => {
    window.state.calMonth += delta;
    if (window.state.calMonth < 0) { window.state.calMonth = 11; window.state.calYear--; }
    if (window.state.calMonth > 11) { window.state.calMonth = 0; window.state.calYear++; }
    renderCalendarGrid();
};

window.selectCalDay = (d) => { window.state.selectedDay = d; renderCalendarGrid(); };

window.openTaskModal = (isEvent = false) => {
    const projOpts = (window.state.projects || []).map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    window.openUniversalModal(isEvent ? 'Crear Evento de Calendario' : 'Crear Tarea', `
        <form onsubmit="saveTaskOrEvent(event, ${isEvent})" class="space-y-3 text-xs">
            <input id="te-title" required placeholder="${isEvent ? 'Nombre del evento' : 'Título de la tarea'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-3 gap-2">
                <input id="te-day" type="number" value="${window.state.selectedDay}" placeholder="Día" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="te-month" type="number" value="${window.state.calMonth + 1}" placeholder="Mes" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="te-year" type="number" value="${window.state.calYear}" placeholder="Año" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <div class="grid grid-cols-2 gap-2">
                <input id="te-time" placeholder="Hora inicio (ej. 10:00)" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="te-end" placeholder="Hora fin (ej. 11:30)" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            ${isEvent ? `
                <input id="te-loc" placeholder="Ubicación" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            ` : `
                <div class="grid grid-cols-2 gap-2">
                    <select id="te-prio" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        <option value="Media">Prioridad Media</option>
                        <option value="Alta">Prioridad Alta</option>
                        <option value="Baja">Prioridad Baja</option>
                    </select>
                    <select id="te-proj" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        <option value="">Sin proyecto</option>
                        ${projOpts}
                    </select>
                </div>
                <label class="flex items-center space-x-2 text-gray-400">
                    <input type="checkbox" id="te-inbox"> <span>Enviar a Bandeja de Entrada (Inbox)</span>
                </label>
            `}
            <textarea id="te-notes" placeholder="Notas o subtareas..." class="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]"></textarea>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold">Guardar</button>
        </form>
    `);
};

window.saveTaskOrEvent = async (e, isEvent) => {
    e.preventDefault();
    const id = Date.now();
    await fsActions.setItem('tasks', id, {
        title: document.getElementById('te-title').value.trim(),
        day: Number(document.getElementById('te-day').value),
        month: Number(document.getElementById('te-month').value),
        year: Number(document.getElementById('te-year').value),
        time: document.getElementById('te-time').value.trim(),
        endTime: document.getElementById('te-end').value.trim(),
        location: isEvent ? document.getElementById('te-loc').value.trim() : '',
        priority: isEvent ? 'Media' : document.getElementById('te-prio').value,
        project: isEvent ? 'Agenda' : document.getElementById('te-proj').value,
        inInbox: isEvent ? false : document.getElementById('te-inbox').checked,
        notes: document.getElementById('te-notes').value.trim(),
        isEvent,
        isCompleted: false,
        createdAt: id
    });
    window.closeUniversalModal();
};

window.openProjectModal = () => {
    window.openUniversalModal('Nuevo Proyecto', `
        <form onsubmit="saveProjectForm(event)" class="space-y-3 text-xs">
            <input id="p-name" required placeholder="Nombre del proyecto" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="p-desc" placeholder="Descripción" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="p-cats" value="Diseño, Desarrollo" placeholder="Categorías separadas por coma" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold">Crear Proyecto</button>
        </form>
    `);
};

window.saveProjectForm = async (e) => {
    e.preventDefault();
    const id = Date.now();
    await fsActions.setItem('projects', id, {
        name: document.getElementById('p-name').value.trim(),
        description: document.getElementById('p-desc').value.trim(),
        categories: document.getElementById('p-cats').value.trim(),
        status: 'active',
        deadline: Date.now() + 86400000 * 30,
        createdAt: id
    });
    window.closeUniversalModal();
};
