import { fsActions } from './firebase-sync.js';

export function renderPlanView(container) {
    const todayIso = new Date().toISOString().split('T')[0];
    const tasks = window.state?.tasks || [];

    const carriedOverTasks = tasks.filter(t => !t.isCompleted && t.dueDate && t.dueDate < todayIso);
    const todayTasks = tasks.filter(t => !t.dueDate || t.dueDate === todayIso);
    const upcomingTasks = tasks.filter(t => t.dueDate && t.dueDate > todayIso);

    container.innerHTML = `
        <div class="space-y-6" style="font-variant-numeric: tabular-nums;">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="text-2xl font-black tracking-tight text-white">Plan Diario y Enfoque</h3>
                    <p class="text-xs text-gray-400 mt-1">Organiza tu día sin fricción ni penalizaciones</p>
                </div>
                <button type="button" onclick="openNewTaskModal()" class="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold">+ Nueva Tarea</button>
            </div>

            <!-- Reinicio Diario Sin Culpa (Solo en Plan, tonos suaves ámbar/obsidiana) -->
            ${carriedOverTasks.length > 0 ? `
                <details open class="p-4 rounded-2xl bg-[#121216] border border-amber-500/40 space-y-3">
                    <summary class="cursor-pointer flex flex-wrap items-center justify-between gap-2 text-xs font-extrabold text-amber-300">
                        <span>🌿 Reinicio Diario Sin Culpa: Ayer quedaron ${carriedOverTasks.length} pendiente${carriedOverTasks.length > 1 ? 's' : ''}. ¿Mover a hoy, reprogramar o archivar?</span>
                    </summary>
                    <div class="pt-2 border-t border-[#1F1F26] flex flex-wrap gap-2">
                        <button type="button" onclick="batchRescheduleCarriedTasks('TODAY')" class="px-3.5 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold">Mover todas a hoy</button>
                        <button type="button" onclick="batchRescheduleCarriedTasks('TOMORROW')" class="px-3.5 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-amber-400 text-amber-300 text-xs font-bold">Reprogramar para mañana</button>
                        <button type="button" onclick="batchRescheduleCarriedTasks('ARCHIVE')" class="px-3.5 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-gray-400 text-xs font-bold">Archivar pendientes</button>
                    </div>
                </details>
            ` : ''}

            <!-- Tareas de Hoy -->
            <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-3">
                <h4 class="text-sm font-black text-white">Hoy (${todayTasks.length})</h4>
                ${todayTasks.length === 0 ? `<p class="text-xs text-gray-400">No hay tareas pendientes para hoy. Usa "+ Nueva Tarea" o Ctrl+K.</p>` : `
                    <div class="space-y-2">
                        ${todayTasks.map(t => renderTaskRow(t)).join('')}
                    </div>
                `}
            </div>

            <!-- Próximos días -->
            ${upcomingTasks.length > 0 ? `
                <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-3">
                    <h4 class="text-sm font-black text-white">Próximos Días (${upcomingTasks.length})</h4>
                    <div class="space-y-2">
                        ${upcomingTasks.map(t => renderTaskRow(t)).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderTaskRow(t) {
    return `
        <div class="p-3.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] flex items-center justify-between gap-3">
            <label class="flex items-center space-x-3 cursor-pointer flex-1 min-w-0">
                <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="toggleTaskItem('${t.docId || t.id}', ${!t.isCompleted})" class="w-4 h-4 accent-[#10B981] rounded">
                <div class="min-w-0">
                    <p class="text-xs font-bold ${t.isCompleted ? 'line-through text-gray-500' : 'text-white'} truncate">${t.title}</p>
                    ${t.dueTime ? `<span class="text-[10px] text-[#8B5CF6] font-bold">🕒 ${t.dueTime}</span>` : ''}
                </div>
            </label>
            <button type="button" onclick="deleteTaskItem('${t.docId || t.id}')" class="text-xs text-gray-500 hover:text-amber-400 px-2">Eliminar</button>
        </div>
    `;
}

window.batchRescheduleCarriedTasks = async (mode) => {
    const todayIso = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const carried = (window.state?.tasks || []).filter(t => !t.isCompleted && t.dueDate && t.dueDate < todayIso);

    for (const t of carried) {
        const docId = t.docId || t.id;
        if (mode === 'TODAY') await fsActions.updateItem('tasks', docId, { dueDate: todayIso });
        else if (mode === 'TOMORROW') await fsActions.updateItem('tasks', docId, { dueDate: tomorrow });
        else if (mode === 'ARCHIVE') await fsActions.removeItem('tasks', docId);
    }
    if (window.renderPlan) window.renderPlan();
};

window.toggleTaskItem = async (docId, nextVal) => {
    await fsActions.updateItem('tasks', docId, { isCompleted: nextVal });
    if (window.renderPlan) window.renderPlan();
};

window.deleteTaskItem = async (docId) => {
    await fsActions.removeItem('tasks', docId);
    if (window.renderPlan) window.renderPlan();
};

window.openNewTaskModal = () => {
    const todayIso = new Date().toISOString().split('T')[0];
    window.openUniversalModal('📝 Nueva Tarea', `
        <form onsubmit="saveNewTaskForm(event)" class="space-y-3 text-xs">
            <input id="nt-title" required placeholder="¿Qué vas a hacer?" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
            <div class="grid grid-cols-2 gap-2">
                <input id="nt-date" type="date" value="${todayIso}" class="px-3 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
                <input id="nt-time" type="time" class="px-3 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Guardar Tarea</button>
        </form>
    `);
};

window.saveNewTaskForm = async (e) => {
    e.preventDefault();
    const id = Math.floor(Date.now() / 1000);
    await fsActions.setItem('tasks', id, {
        title: document.getElementById('nt-title').value.trim(),
        dueDate: document.getElementById('nt-date').value,
        dueTime: document.getElementById('nt-time').value,
        isCompleted: false,
        createdAt: Date.now()
    });
    window.closeUniversalModal();
    if (window.renderPlan) window.renderPlan();
};
