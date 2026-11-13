import { fsActions } from './firebase-sync.js';

const today = new Date();
const todayDay = today.getDate();
const todayMonth = today.getMonth() + 1;
const todayYear = today.getFullYear();
const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const todayChar = dayMap[today.getDay()];

export function isHabitScheduledToday(h) {
    const freq = String(h.frequency || 'Diario').trim().toLowerCase();
    const dow = today.getDay();
    if (freq === 'diario') return true;
    if (freq === 'lun a vie') return dow >= 1 && dow <= 5;
    if (freq === 'fines de semana') return dow === 0 || dow === 6;
    return String(h.frequencyDays || 'L,M,X,J,V,S,D').toUpperCase().includes(todayChar);
}

export function calculateDailyScore() {
    const habitsList = window.state.habits || [];
    const tasksList = window.state.tasks || [];
    const sessionsList = window.state.workout_sessions || [];

    const todayHabits = habitsList.filter(h => isHabitScheduledToday(h));
    const completedHabits = todayHabits.filter(h => h.isCompleted).length;

    const todayTasks = tasksList.filter(t => !t.isEvent && !t.inInbox && Number(t.day) === todayDay && Number(t.month) === todayMonth && Number(t.year) === todayYear);
    const completedTasks = todayTasks.filter(t => t.isCompleted).length;

    const startOfToday = new Date(todayYear, todayMonth - 1, todayDay).getTime();
    const trainedToday = sessionsList.some(s => Number(s.startedAt || 0) >= startOfToday && s.isCompleted);

    const total = todayHabits.length + todayTasks.length + (trainedToday ? 1 : 0);
    const done = completedHabits + completedTasks + (trainedToday ? 1 : 0);
    const score = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
        score,
        todayHabits,
        todayTasks,
        trainedToday,
        habitPct: todayHabits.length ? Math.round((completedHabits / todayHabits.length) * 100) : 0,
        taskPct: todayTasks.length ? Math.round((completedTasks / todayTasks.length) * 100) : 0,
        workoutPct: trainedToday ? 100 : 0
    };
}

export function renderDashboard() {
    const ds = calculateDailyScore();
    const scoreEl = document.getElementById('daily-score-pct');
    if (scoreEl) scoreEl.textContent = ds.score;

    const habitsEl = document.getElementById('dashboard-habits-list');
    if (habitsEl) {
        if (ds.todayHabits.length === 0) {
            habitsEl.innerHTML = `<p class="text-xs text-gray-400">Sin hábitos para hoy (${todayChar}).</p>`;
        } else {
            habitsEl.innerHTML = ds.todayHabits.map(h => {
                const isQuant = h.type === 'quantity' || h.type === 'duration' || h.type === 'counter' || h.type === 'numeric' || Number(h.targetValue || 1) > 1;
                const cur = Number(h.currentValue || 0);
                const tar = Number(h.targetValue || 1);
                const badgeColor = h.importance === 'Esencial' ? 'text-red-400 bg-red-500/10' : h.importance === 'Ligero' ? 'text-blue-400 bg-blue-500/10' : 'text-purple-400 bg-purple-500/10';

                if (isQuant) {
                    const pct = Math.min(100, Math.round((cur / tar) * 100));
                    return `
                        <div class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-2">
                            <div class="flex items-center justify-between">
                                <div>
                                    <span class="text-xs font-bold ${h.isCompleted ? 'line-through text-gray-500' : ''}">${h.name}</span>
                                    <span class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${badgeColor}">${h.importance || 'Normal'}</span>
                                </div>
                                <div class="flex items-center space-x-1.5">
                                    <button onclick="stepHabitVal('${h.docId}', ${cur}, -1, ${tar}, ${h.xpReward || 20})" class="w-6 h-6 rounded-lg bg-[#181824] border border-[#28283C] text-xs font-bold">-</button>
                                    <span class="text-xs font-mono">${cur}/${tar} ${h.unit || ''}</span>
                                    <button onclick="stepHabitVal('${h.docId}', ${cur}, 1, ${tar}, ${h.xpReward || 20})" class="w-6 h-6 rounded-lg bg-accent text-white text-xs font-bold">+</button>
                                    <button onclick="deleteDocItem('habits', '${h.docId}')" class="text-xs text-gray-500 hover:text-red-400 ml-1">✕</button>
                                </div>
                            </div>
                            <div class="w-full h-1.5 bg-[#181824] rounded-full overflow-hidden">
                                <div class="h-full ${h.isCompleted ? 'bg-emerald-500' : 'bg-accent'}" style="width:${pct}%"></div>
                            </div>
                        </div>
                    `;
                }

                return `
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        <div class="flex items-center space-x-2.5">
                            <input type="checkbox" ${h.isCompleted ? 'checked' : ''} onchange="toggleHabitCheck('${h.docId}', ${!h.isCompleted}, ${h.xpReward || 20})" class="w-4 h-4 accent-purple-600 rounded cursor-pointer">
                            <div>
                                <span class="text-xs ${h.isCompleted ? 'line-through text-gray-500' : 'font-semibold'}">${h.name}</span>
                                <span class="ml-1.5 text-[10px] px-1.5 py-0.5 rounded ${badgeColor}">${h.importance || 'Normal'}</span>
                            </div>
                        </div>
                        <button onclick="deleteDocItem('habits', '${h.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                    </div>
                `;
            }).join('');
        }
    }

    const agendaEl = document.getElementById('dashboard-agenda-list');
    if (agendaEl) {
        const todayItems = (window.state.tasks || []).filter(t => !t.inInbox && Number(t.day) === todayDay && Number(t.month) === todayMonth && Number(t.year) === todayYear);
        agendaEl.innerHTML = todayItems.length === 0
            ? `<p class="text-xs text-gray-400">Agenda libre para hoy.</p>`
            : todayItems.map(t => t.isEvent ? `
                <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <span>📅</span>
                        <div>
                            <p class="text-xs font-bold text-blue-300">${t.title}</p>
                            <p class="text-[10px] text-gray-400">${t.time || 'Todo el día'}${t.endTime ? ' - ' + t.endTime : ''} ${t.location ? '· 📍 ' + t.location : ''}</p>
                        </div>
                    </div>
                    <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
            ` : `
                <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
                    <div class="flex items-center space-x-2.5">
                        <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="toggleTaskCheck('${t.docId}', ${!t.isCompleted})" class="w-4 h-4 accent-purple-600 rounded cursor-pointer">
                        <div>
                            <p class="text-xs ${t.isCompleted ? 'line-through text-gray-500' : 'font-semibold'}">${t.title}</p>
                            <p class="text-[10px] text-gray-400">${t.priority || 'Media'} ${t.project ? '· 📁 ' + t.project : ''}</p>
                        </div>
                    </div>
                    <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
            `).join('');
    }

    const progMods = [
        { label: 'Hábitos del Día', pct: ds.habitPct },
        { label: 'Tareas del Día', pct: ds.taskPct },
        { label: 'Entrenamiento', pct: ds.workoutPct }
    ].filter(m => m.pct > 0);

    const progEl = document.getElementById('progress-bars-container');
    if (progEl) {
        progEl.innerHTML = progMods.length === 0
            ? `<p class="text-xs text-gray-400">Completa al menos un hábito, tarea o entrenamiento hoy para mostrar la distribución.</p>`
            : progMods.map(m => `
                <div>
                    <div class="flex justify-between text-xs font-bold mb-1"><span>${m.label}</span><span>${m.pct}%</span></div>
                    <div class="w-full h-2.5 bg-gray-200 dark:bg-[#0A0A0F] rounded-full overflow-hidden">
                        <div class="h-full bg-accent" style="width:${m.pct}%"></div>
                    </div>
                </div>
            `).join('');
    }
}

window.toggleHabitCheck = async (docId, state, xpReward) => {
    await fsActions.updateItem('habits', docId, { isCompleted: state, currentValue: state ? 1 : 0 });
    const nextXp = Math.max(0, Number(window.state.profile.xp || 0) + (state ? xpReward : -xpReward));
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
};

window.stepHabitVal = async (docId, cur, delta, target, xpReward) => {
    const nextVal = Math.max(0, cur + delta);
    const completed = nextVal >= target;
    await fsActions.updateItem('habits', docId, { currentValue: nextVal, isCompleted: completed });
    if (cur < target && completed) {
        const nextXp = Number(window.state.profile.xp || 0) + xpReward;
        await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
    }
};

window.openHabitModal = () => {
    window.openUniversalModal('Crear Hábito', `
        <form onsubmit="saveHabitForm(event)" class="space-y-3 text-xs">
            <input id="h-name" required placeholder="Nombre del hábito (ej. Tomar creatina, Tomar agua)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="h-type" onchange="document.getElementById('h-quant-box').classList.toggle('hidden', this.value === 'simple')" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="simple">Simple (Check)</option>
                    <option value="quantity">Cantidad (Vasos, pág)</option>
                    <option value="duration">Duración (Minutos)</option>
                    <option value="counter">Contador</option>
                </select>
                <select id="h-importance" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Normal">Importancia: Normal</option>
                    <option value="Esencial">Esencial (x3)</option>
                    <option value="Ligero">Ligero (x1)</option>
                </select>
            </div>
            <div id="h-quant-box" class="hidden grid grid-cols-2 gap-2">
                <input id="h-target" type="number" min="1" value="8" placeholder="Meta diaria" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <input id="h-unit" placeholder="Unidad (vasos, min, ml)" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <select id="h-freq" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                <option value="Diario">Diario</option>
                <option value="Lun a Vie">Lunes a Viernes</option>
                <option value="Fines de semana">Fines de semana</option>
                <option value="Personalizado">Personalizado</option>
            </select>
            <input id="h-days" value="L,M,X,J,V,S,D" placeholder="Días (L,M,X,J,V,S,D)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold">Guardar Hábito</button>
        </form>
    `);
};

window.saveHabitForm = async (e) => {
    e.preventDefault();
    const id = Date.now();
    const type = document.getElementById('h-type').value;
    await fsActions.setItem('habits', id, {
        name: document.getElementById('h-name').value.trim(),
        type,
        importance: document.getElementById('h-importance').value,
        frequency: document.getElementById('h-freq').value,
        frequencyDays: document.getElementById('h-days').value.toUpperCase(),
        currentValue: 0,
        targetValue: type === 'simple' ? 1 : Number(document.getElementById('h-target').value || 1),
        unit: type === 'simple' ? '' : document.getElementById('h-unit').value.trim(),
        isCompleted: false,
        streak: 0,
        xpReward: 20,
        visibleInMiDia: true
    });
    window.closeUniversalModal();
};
