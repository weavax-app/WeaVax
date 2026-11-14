import { fsActions } from './firebase-sync.js?v=5';
import { requireProOrCheckLimit, FREE_LIMITS } from './weavax-pro.js?v=3';

let planTempReminders = []; // { mode: 'FIXED' | 'BEFORE', value: '09:00' | '30' }

const BEFORE_LABELS = {
    '10': '10 minutos antes',
    '30': '30 minutos antes',
    '60': '1 hora antes',
    '120': '2 horas antes',
    '1440': '1 día antes'
};

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
                    ${hasTasks ? '<span class="w-1.5 h-1.5 rounded-full bg-accent"></span>' : ''}
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

function formatPlanRemindersSummary(t) {
    const list = Array.isArray(t.reminders) ? t.reminders : [];
    if (list.length === 0) return '';
    return list.map(r => r.mode === 'FIXED' ? `⏰ ${r.value}` : `⏳ ${BEFORE_LABELS[r.value] || `${r.value} min antes`}`).join(' · ');
}

function renderPlanRow(t) {
    const remText = formatPlanRemindersSummary(t);
    if (t.isEvent) {
        return `
            <div class="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between gap-2">
                <div class="flex items-center space-x-3 min-w-0">
                    <span>📅</span>
                    <div class="min-w-0">
                        <p class="text-xs font-extrabold text-blue-300 truncate">${t.title}</p>
                        <p class="text-[10px] text-gray-400">${t.day}/${t.month}/${t.year} · ${t.time || 'Todo el día'}${t.endTime ? ' - ' + t.endTime : ''} ${t.location ? '· 📍 ' + t.location : ''}</p>
                        ${remText ? `<p class="text-[10px] text-accent mt-0.5">🔔 ${remText}</p>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0">
                    <button onclick="openTaskModal(true, '${t.docId}')" class="text-xs text-gray-400 hover:text-white" title="Editar">✎</button>
                    <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
            </div>
        `;
    }
    const prioColor = t.priority === 'Alta' ? 'text-red-400' : t.priority === 'Baja' ? 'text-gray-400' : 'text-amber-400';
    return `
        <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between gap-2">
            <div class="flex items-center space-x-3 min-w-0">
                <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="toggleTaskCheck('${t.docId}', ${!t.isCompleted})" class="w-4 h-4 rounded cursor-pointer shrink-0">
                <div class="min-w-0">
                    <p class="text-xs ${t.isCompleted ? 'line-through text-gray-500' : 'font-extrabold'} truncate">${t.title}</p>
                    <p class="text-[10px] text-gray-400">${t.day}/${t.month}/${t.year} ${t.time ? `· ${t.time}` : ''} · <span class="${prioColor}">${t.priority || 'Media'}</span> ${t.project ? '· 📁 ' + t.project : ''}</p>
                    ${remText ? `<p class="text-[10px] text-accent mt-0.5">🔔 ${remText}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <button onclick="openTaskModal(false, '${t.docId}')" class="text-xs text-gray-400 hover:text-white" title="Editar">✎</button>
                <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
            </div>
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

window.openTaskModal = (isEvent = false, existingDocId = null) => {
    const existing = existingDocId ? (window.state.tasks || []).find(x => String(x.docId) === String(existingDocId)) : null;
    planTempReminders = existing && Array.isArray(existing.reminders) ? [...existing.reminders] : [];

    const projOpts = (window.state.projects || []).map(p => `<option value="${p.name}" ${existing?.project === p.name ? 'selected' : ''}>${p.name}</option>`).join('');

    window.openUniversalModal(
        existing ? (isEvent ? '✎ Editar Evento' : '✎ Editar Tarea') : (isEvent ? '📅 Crear Evento' : '✅ Crear Tarea'),
        `
        <form onsubmit="saveTaskOrEvent(event, ${isEvent}, ${existing ? `'${existing.docId}'` : 'null'})" class="space-y-3 text-xs max-h-[78vh] overflow-y-auto pr-1">
            <input id="te-title" required value="${existing?.title || ''}" placeholder="${isEvent ? 'Nombre del evento' : 'Título de la tarea'}" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">
            
            <div class="grid grid-cols-3 gap-2">
                <input id="te-day" type="number" min="1" max="31" value="${existing?.day || window.state.selectedDay}" placeholder="Día" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="te-month" type="number" min="1" max="12" value="${existing?.month || (window.state.calMonth + 1)}" placeholder="Mes" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="te-year" type="number" value="${existing?.year || window.state.calYear}" placeholder="Año" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>

            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase">Hora Inicio</label>
                    <input id="te-time" type="time" value="${existing?.time || ''}" class="mt-1 w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
                <div>
                    <label class="text-[10px] text-gray-400 font-bold uppercase">Hora Fin (Opcional)</label>
                    <input id="te-end" type="time" value="${existing?.endTime || ''}" class="mt-1 w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
            </div>

            ${isEvent ? `
                <input id="te-loc" value="${existing?.location || ''}" placeholder="Ubicación (ej. Universidad, Gym)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            ` : `
                <div class="grid grid-cols-2 gap-2">
                    <select id="te-prio" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        <option value="Media" ${(!existing || existing?.priority === 'Media') ? 'selected' : ''}>Prioridad Media</option>
                        <option value="Alta" ${existing?.priority === 'Alta' ? 'selected' : ''}>Prioridad Alta</option>
                        <option value="Baja" ${existing?.priority === 'Baja' ? 'selected' : ''}>Prioridad Baja</option>
                    </select>
                    <select id="te-proj" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                        <option value="">Sin proyecto</option>
                        ${projOpts}
                    </select>
                </div>
                <label class="flex items-center space-x-2 text-gray-400">
                    <input type="checkbox" id="te-inbox" ${existing?.inInbox ? 'checked' : ''}> <span>Enviar a Bandeja de Entrada (Inbox)</span>
                </label>
            `}

            <!-- RECORDATORIOS: HORA FIJA O TIEMPO ANTES (Máximo 2 en Free, >2 con WeaVax Pro) -->
            <div class="p-3 rounded-2xl bg-[#0A0A0F] border border-[#28283C] space-y-2.5">
                <div class="flex items-center justify-between">
                    <span class="text-[11px] font-extrabold text-gray-300">🔔 Recordatorios (${planTempReminders.length})</span>
                    <select id="te-rem-mode" onchange="onPlanRemModeChange(this.value)" class="px-2 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-[11px] font-bold">
                        <option value="BEFORE">⏳ Tiempo antes</option>
                        <option value="FIXED">⏰ Hora fija</option>
                    </select>
                </div>

                <div class="flex items-center gap-2">
                    <select id="te-rem-before-val" class="flex-1 px-2.5 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-xs">
                        <option value="10">10 minutos antes</option>
                        <option value="30" selected>30 minutos antes</option>
                        <option value="60">1 hora antes</option>
                        <option value="120">2 horas antes</option>
                        <option value="1440">1 día antes</option>
                    </select>
                    <input type="time" id="te-rem-fixed-val" value="09:00" class="hidden flex-1 px-2.5 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-xs">
                    <button type="button" onclick="addPlanReminderItem()" class="px-3 py-1.5 rounded-lg bg-accent text-white font-bold">+ Añadir</button>
                </div>

                <div id="te-rem-chips" class="flex flex-wrap gap-1.5"></div>
            </div>

            <textarea id="te-notes" placeholder="Notas o detalles..." class="w-full px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">${existing?.notes || ''}</textarea>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-extrabold">Guardar</button>
        </form>
        `
    );
    renderPlanReminderChips();
};

window.onPlanRemModeChange = (mode) => {
    document.getElementById('te-rem-before-val')?.classList.toggle('hidden', mode !== 'BEFORE');
    document.getElementById('te-rem-fixed-val')?.classList.toggle('hidden', mode !== 'FIXED');
};

window.addPlanReminderItem = () => {
    const mode = document.getElementById('te-rem-mode')?.value || 'BEFORE';
    const value = mode === 'FIXED'
        ? document.getElementById('te-rem-fixed-val')?.value
        : document.getElementById('te-rem-before-val')?.value;
    if (!value) return;

    if (planTempReminders.some(r => r.mode === mode && r.value === value)) return;

    // Máximo 2 notificaciones por tarea o evento en Free; >2 con WeaVax Pro
    if (!requireProOrCheckLimit(
        'PLAN_REMINDERS',
        planTempReminders.length,
        2,
        'El plan Gratuito permite hasta 2 notificaciones por tarea o evento. Desbloquea recordatorios múltiples ilimitados con WeaVax Pro.'
    )) return;

    planTempReminders.push({ mode, value });
    renderPlanReminderChips();
};

window.removePlanReminderItem = (idx) => {
    planTempReminders.splice(idx, 1);
    renderPlanReminderChips();
};

function renderPlanReminderChips() {
    const box = document.getElementById('te-rem-chips');
    if (!box) return;
    if (planTempReminders.length === 0) {
        box.innerHTML = `<span class="text-[10px] text-gray-500">Sin notificaciones programadas</span>`;
        return;
    }
    box.innerHTML = planTempReminders.map((r, i) => {
        const text = r.mode === 'FIXED' ? `⏰ ${r.value}` : `⏳ ${BEFORE_LABELS[r.value] || `${r.value} min antes`}`;
        return `
            <span class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-[11px]">
                <span>${text}</span>
                <button type="button" onclick="removePlanReminderItem(${i})" class="text-gray-400 hover:text-red-400 ml-1">✕</button>
            </span>
        `;
    }).join('');
}

window.saveTaskOrEvent = async (e, isEvent, existingDocId = null) => {
    e.preventDefault();
    const existing = existingDocId ? (window.state.tasks || []).find(x => String(x.docId) === String(existingDocId)) : null;
    const id = existing ? Number(existing.id || existingDocId) : Math.floor(Date.now() / 1000);

    const firstFixed = planTempReminders.find(r => r.mode === 'FIXED');
    const firstBefore = planTempReminders.find(r => r.mode === 'BEFORE');

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
        reminders: planTempReminders,
        reminderEnabled: planTempReminders.length > 0,
        reminderTime: firstFixed ? firstFixed.value : '',
        reminderMinutesBefore: firstBefore ? Number(firstBefore.value) : 0,
        isEvent,
        isCompleted: existing ? Boolean(existing.isCompleted) : false,
        createdAt: existing?.createdAt || Date.now()
    });
    window.closeUniversalModal();
};

window.openProjectModal = () => {
    if (!requireProOrCheckLimit('PROJECTS', (window.state.projects || []).length, FREE_LIMITS.MAX_PROJECTS, 'El plan Gratuito permite 1 proyecto activo. Desbloquea proyectos ilimitados con WeaVax Pro.')) return;
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
    const id = Math.floor(Date.now() / 1000);
    await fsActions.setItem('projects', id, {
        name: document.getElementById('p-name').value.trim(),
        description: document.getElementById('p-desc').value.trim(),
        categories: document.getElementById('p-cats').value.trim(),
        status: 'active',
        deadline: Date.now() + 86400000 * 30,
        createdAt: Date.now()
    });
    window.closeUniversalModal();
};
