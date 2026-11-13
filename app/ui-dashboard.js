import { fsActions } from './firebase-sync.js';

const todayObj = new Date();
const todayDay = todayObj.getDate();
const todayMonth = todayObj.getMonth() + 1;
const todayYear = todayObj.getFullYear();
const dayLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const todayLetter = dayLetters[todayObj.getDay()];

export function calculateDailyScore() {
    const todayHabits = window.state.habits.filter(h => !h.frequencyDays || h.frequencyDays.includes(todayLetter));
    const completedHabits = todayHabits.filter(h => h.isCompleted).length;

    const todayTasks = window.state.tasks.filter(t => !t.isEvent && Number(t.day) === todayDay && Number(t.month) === todayMonth && Number(t.year) === todayYear);
    const completedTasks = todayTasks.filter(t => t.isCompleted).length;

    const todayIso = todayObj.toISOString().split('T')[0];
    const trainedToday = window.state.workout_sessions.some(s => String(s.date || '').startsWith(todayIso));

    const total = todayHabits.length + todayTasks.length + (trainedToday ? 1 : 0);
    const done = completedHabits + completedTasks + (trainedToday ? 1 : 0);
    const score = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
        score,
        todayHabits,
        todayTasks,
        habitPct: todayHabits.length ? Math.round((completedHabits / todayHabits.length) * 100) : 0,
        taskPct: todayTasks.length ? Math.round((completedTasks / todayTasks.length) * 100) : 0,
        workoutPct: trainedToday ? 100 : 0
    };
}

export function renderDashboard() {
    const ds = calculateDailyScore();
    document.getElementById('daily-score-pct').textContent = ds.score;

    // Renderizar Hábitos (Soporte Simple y Cuantitativo/Numérico)
    const habitsEl = document.getElementById('dashboard-habits-list');
    if (ds.todayHabits.length === 0) {
        habitsEl.innerHTML = `<p class="text-xs text-gray-400">Sin hábitos programados hoy (${todayLetter}).</p>`;
    } else {
        habitsEl.innerHTML = ds.todayHabits.map(h => {
            const isNumeric = h.type === 'numeric' || Number(h.targetValue || 0) > 1;
            const current = Number(h.currentValue || 0);
            const target = Number(h.targetValue || 1);
            const unit = h.unit || '';

            if (isNumeric) {
                return `
                    <div class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold ${h.isCompleted ? 'text-emerald-400' : ''}">${h.name}</span>
                            <div class="flex items-center space-x-1.5">
                                <button onclick="stepHabit('${h.id}', ${current}, -1, ${target}, ${h.xpReward || 15})" class="w-6 h-6 rounded-lg bg-[#181824] border border-[#28283C] text-xs font-bold hover:border-accent">-</button>
                                <span class="text-xs font-mono px-1.5">${current}/${target} ${unit}</span>
                                <button onclick="stepHabit('${h.id}', ${current}, 1, ${target}, ${h.xpReward || 15})" class="w-6 h-6 rounded-lg bg-accent text-white text-xs font-bold">+</button>
                                <button onclick="deleteDocItem('habits', '${h.id}')" class="text-xs text-gray-500 hover:text-red-400 ml-1">✕</button>
                            </div>
                        </div>
                        <div class="w-full h-1.5 bg-[#181824] rounded-full overflow-hidden">
                            <div class="h-full ${h.isCompleted ? 'bg-emerald-500' : 'bg-accent'} transition-all" style="width: ${Math.min(100, Math.round((current / target) * 100))}%"></div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                    <div class="flex items-center space-x-2.5">
                        <input type="checkbox" ${h.isCompleted ? 'checked' : ''} onchange="toggleHabit('${h.id}', ${!h.isCompleted}, ${h.xpReward || 15})" class="w-4 h-4 accent-purple-600 rounded cursor-pointer">
                        <span class="text-xs ${h.isCompleted ? 'line-through text-gray-500' : 'font-semibold'}">${h.name}</span>
                    </div>
                    <button onclick="deleteDocItem('habits', '${h.id}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
            `;
        }).join('');
    }

    // Agenda Hoy (Tareas con checkbox vs Eventos sin checkbox)
    const todayItems = window.state.tasks.filter(t => Number(t.day) === todayDay && Number(t.month) === todayMonth && Number(t.year) === todayYear);
    document.getElementById('dashboard-agenda-list').innerHTML = todayItems.length === 0
        ? `<p class="text-xs text-gray-400">Agenda despejada para hoy.</p>`
        : todayItems.map(t => t.isEvent ? `
            <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <span>📅</span>
                    <div>
                        <p class="text-xs font-bold text-blue-300">${t.title}</p>
                        <p class="text-[10px] text-gray-400">${t.time || 'Evento'}</p>
                    </div>
                </div>
                <button onclick="deleteDocItem('tasks', '${t.id}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
            </div>
        ` : `
            <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                    <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="toggleTask('${t.id}', ${!t.isCompleted})" class="w-4 h-4 accent-purple-600 rounded cursor-pointer">
                    <span class="text-xs ${t.isCompleted ? 'line-through text-gray-500' : 'font-semibold'}">${t.title}</span>
                </div>
                <button onclick="deleteDocItem('tasks', '${t.id}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
            </div>
        `).join('');
}

// Acciones de Hábitos (Simple y Numérico)
window.toggleHabit = async (id, state, xpReward) => {
    await fsActions.update('habits', id, { isCompleted: state, updatedAt: new Date().toISOString() });
    const nextXp = Math.max(0, Number(window.state.profile.xp || 0) + (state ? xpReward : -xpReward));
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
};

window.stepHabit = async (id, current, delta, target, xpReward) => {
    const nextVal = Math.max(0, current + delta);
    const wasDone = current >= target;
    const isNowDone = nextVal >= target;
    await fsActions.update('habits', id, {
        currentValue: nextVal,
        isCompleted: isNowDone,
        updatedAt: new Date().toISOString()
    });
    if (!wasDone && isNowDone) {
        const nextXp = Number(window.state.profile.xp || 0) + xpReward;
        await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
    }
};

window.openHabitModal = () => {
    window.openUniversalModal('Nuevo Hábito', `
        <form onsubmit="saveHabitForm(event)" class="space-y-3">
            <input id="h-name" required placeholder="Ej. Tomar agua, Leer, Creatina" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-sm">
            <select id="h-type" onchange="document.getElementById('h-numeric-fields').classList.toggle('hidden', this.value !== 'numeric')" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-sm">
                <option value="simple">Hábito Simple (Check diario)</option>
                <option value="numeric">Hábito Cuantitativo / Numérico (Meta y unidad)</option>
            </select>
            <div id="h-numeric-fields" class="hidden grid grid-cols-2 gap-2">
                <input id="h-target" type="number" min="1" value="8" placeholder="Meta (ej. 8)" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-sm">
                <input id="h-unit" placeholder="Unidad (ej. vasos, min, pág)" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-sm">
            </div>
            <input id="h-days" value="L,M,X,J,V,S,D" placeholder="Días (L,M,X,J,V,S,D)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-sm">
            <input id="h-xp" type="number" value="20" placeholder="XP Recompensa" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-sm">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-xs">Guardar Hábito</button>
        </form>
    `);
};

window.saveHabitForm = async (e) => {
    e.preventDefault();
    const type = document.getElementById('h-type').value;
    await fsActions.add('habits', {
        name: document.getElementById('h-name').value,
        type,
        currentValue: 0,
        targetValue: type === 'numeric' ? Number(document.getElementById('h-target').value || 1) : 1,
        unit: type === 'numeric' ? document.getElementById('h-unit').value : '',
        frequencyDays: document.getElementById('h-days').value.toUpperCase(),
        xpReward: Number(document.getElementById('h-xp').value) || 15,
        isCompleted: false,
        updatedAt: new Date().toISOString()
    });
    window.closeUniversalModal();
};
