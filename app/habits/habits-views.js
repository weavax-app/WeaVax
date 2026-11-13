import { fsActions } from '../firebase-sync.js?v=5';

export const HABIT_ICONS = {
    star: '⭐', water: '💧', fitness: '💪', book: '📖', brain: '🧠',
    meditation: '🧘', sleep: '🌙', code: '💻', pill: '💊', run: '🏃',
    salad: '🥗', music: '🎵', money: '💰', clean: '🧹', fire: '🔥'
};

export const hState = {
    mode: 'MI_DIA', // 'MI_DIA' | 'ALL_HABITS' | 'DETAIL'
    filter: 'TODOS', // 'TODOS' | 'HOY'
    selectedHabitDocId: null,
    activeTimerId: null,
    timerSeconds: 0,
    timerInterval: null
};

const today = new Date();
const dayMap = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
export const todayChar = dayMap[today.getDay()];

export function getHabitIcon(iconKey) {
    if (!iconKey) return '⭐';
    return HABIT_ICONS[iconKey] || iconKey;
}

export function isHabitScheduledToday(h) {
    const freq = String(h.frequency || 'Diario').trim().toLowerCase();
    const dow = today.getDay();
    if (freq === 'diario') return true;
    if (freq === 'lun a vie') return dow >= 1 && dow <= 5;
    if (freq === 'fines de semana') return dow === 0 || dow === 6;
    return String(h.frequencyDays || 'L,M,X,J,V,S,D').toUpperCase().includes(todayChar);
}

export function getReminderTimesList(h) {
    if (!h.reminderEnabled || !h.reminderTime) return [];
    return String(h.reminderTime).split(',').map(s => s.trim()).filter(Boolean);
}

export function getSortedHabits() {
    return [...(window.state.habits || [])].sort((a, b) => {
        const orderDiff = Number(a.displayOrder || 0) - Number(b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        return Number(a.id || 0) - Number(b.id || 0);
    });
}

// 1. LISTA COMPACTA EN MI DÍA (100% limpia, sin badges ni colores distintos al tema)
export function renderMiDiaHabitsCard() {
    const box = document.getElementById('dashboard-habits-list');
    if (!box) return;

    const allScheduledToday = getSortedHabits().filter(h => isHabitScheduledToday(h) && h.visibleInMiDia !== false);
    const miDiaList = allScheduledToday.slice(0, 5);

    const headerActions = `
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-[#28283C]">
            <span class="text-[11px] font-bold text-gray-400">${allScheduledToday.filter(h => h.isCompleted).length}/${allScheduledToday.length} completados hoy</span>
            <button onclick="openAllHabitsScreen()" class="text-xs font-extrabold text-accent hover:underline">Ver todos (${(window.state.habits || []).length}) →</button>
        </div>
    `;

    if (miDiaList.length === 0) {
        box.innerHTML = `
            ${headerActions}
            <p class="text-xs text-gray-400 py-3">No tienes hábitos visibles programados para hoy (${todayChar}).</p>
        `;
        return;
    }

    box.innerHTML = headerActions + miDiaList.map(h => renderHabitCompactRow(h)).join('');
}

function renderHabitCompactRow(h) {
    const isQuant = ['quantity', 'duration', 'counter', 'numeric'].includes(h.type) || Number(h.targetValue || 1) > 1;
    const cur = Number(h.currentValue || 0);
    const tar = Math.max(1, Number(h.targetValue || 1));
    const icon = getHabitIcon(h.icon);

    if (isQuant) {
        const pct = Math.min(100, Math.round((cur / tar) * 100));
        return `
            <div onclick="openHabitDetailScreen('${h.docId}')" class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent cursor-pointer transition-all space-y-2.5">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center space-x-2.5 min-w-0">
                        <span class="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-sm shrink-0">${icon}</span>
                        <div class="min-w-0">
                            <p class="text-xs font-extrabold truncate ${h.isCompleted ? 'line-through text-gray-500' : ''}">${h.name}</p>
                            <span class="text-[10px] text-gray-400 block">🔥 ${h.streak || 0}d · +${h.xpReward || 20} XP</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1.5 shrink-0" onclick="event.stopPropagation()">
                        <button onclick="stepHabitVal('${h.docId}', -1)" class="w-7 h-7 rounded-lg bg-[#181824] border border-[#28283C] text-xs font-bold hover:border-accent">-</button>
                        <span class="text-[11px] font-mono font-bold px-1 whitespace-nowrap">${cur}/${tar} ${h.unit || (h.type === 'duration' ? 'min' : '')}</span>
                        <button onclick="stepHabitVal('${h.docId}', 1)" class="w-7 h-7 rounded-lg bg-accent text-white text-xs font-bold">+</button>
                    </div>
                </div>
                <div class="w-full h-1.5 bg-[#181824] rounded-full overflow-hidden">
                    <div class="h-full ${h.isCompleted ? 'bg-emerald-500' : 'bg-accent'} transition-all" style="width:${pct}%"></div>
                </div>
            </div>
        `;
    }

    return `
        <div onclick="openHabitDetailScreen('${h.docId}')" class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent cursor-pointer transition-all">
            <div class="flex items-center space-x-2.5 min-w-0">
                <span class="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-sm shrink-0">${icon}</span>
                <div class="min-w-0">
                    <p class="text-xs ${h.isCompleted ? 'line-through text-gray-500' : 'font-extrabold'} truncate">${h.name}</p>
                    <span class="text-[10px] text-gray-400 block">🔥 ${h.streak || 0}d · +${h.xpReward || 20} XP</span>
                </div>
            </div>
            <div onclick="event.stopPropagation()">
                <input type="checkbox" ${h.isCompleted ? 'checked' : ''} onchange="toggleHabitCheck('${h.docId}', this.checked)" class="w-5 h-5 rounded cursor-pointer">
            </div>
        </div>
    `;
}

// Tarjeta individual limpia dentro de la pantalla Mis Hábitos (sin chip de Esencial/Normal/Ligero porque ya está en su sección)
function renderCleanHabitCard(h) {
    const reminders = getReminderTimesList(h);
    const isQuant = ['quantity', 'duration', 'counter', 'numeric'].includes(h.type) || Number(h.targetValue || 1) > 1;
    const cur = Number(h.currentValue || 0);
    const tar = Math.max(1, Number(h.targetValue || 1));

    return `
        <div onclick="openHabitDetailScreen('${h.docId}')" class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent cursor-pointer transition-all flex items-center justify-between gap-3">
            <div class="flex items-center space-x-3.5 min-w-0">
                <div class="w-11 h-11 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-lg shrink-0">
                    ${getHabitIcon(h.icon)}
                </div>
                <div class="min-w-0">
                    <h4 class="text-sm font-extrabold truncate ${h.isCompleted ? 'line-through text-gray-500' : ''}">${h.name}</h4>
                    <p class="text-[11px] text-gray-400 mt-0.5">
                        ${h.frequency || 'Diario'} (${h.frequencyDays || 'L,M,X,J,V,S,D'}) · 🔥 ${h.streak || 0} días ${isQuant ? `· ${cur}/${tar} ${h.unit || ''}` : ''}
                    </p>
                    ${reminders.length > 0 ? `<p class="text-[10px] text-accent mt-0.5">🔔 ${reminders.join(', ')}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-1.5 shrink-0" onclick="event.stopPropagation()">
                <button onclick="moveHabitOrder('${h.docId}', -1)" class="p-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] text-[10px] hover:border-accent" title="Subir">↑</button>
                <button onclick="moveHabitOrder('${h.docId}', 1)" class="p-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] text-[10px] hover:border-accent" title="Bajar">↓</button>
                <button onclick="openHabitModal('${h.docId}')" class="p-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] text-xs hover:border-accent" title="Editar">✎</button>
            </div>
        </div>
    `;
}

// 2. PANTALLA COMPLETA DE HÁBITOS (Dividida por secciones de Categoría) Y DETALLE
export function renderHabitsFullScreenOverlay() {
    let overlay = document.getElementById('habits-fullscreen-view');
    const dashView = document.getElementById('view-dashboard');
    if (!dashView) return;

    if (hState.mode === 'MI_DIA') {
        if (overlay) overlay.classList.add('hidden');
        Array.from(dashView.children).forEach(el => {
            if (el.id !== 'habits-fullscreen-view') el.classList.remove('hidden');
        });
        return;
    }

    Array.from(dashView.children).forEach(el => {
        if (el.id !== 'habits-fullscreen-view') el.classList.add('hidden');
    });

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'habits-fullscreen-view';
        overlay.className = 'lg:col-span-3 space-y-6';
        dashView.appendChild(overlay);
    }
    overlay.classList.remove('hidden');

    if (hState.mode === 'ALL_HABITS') {
        const all = getSortedHabits();
        const baseList = hState.filter === 'HOY' ? all.filter(isHabitScheduledToday) : all;

        const groups = [
            { title: 'Hábitos Esenciales', subtitle: 'Prioridad máxima diaria', items: baseList.filter(h => h.importance === 'Esencial') },
            { title: 'Hábitos Normales', subtitle: 'Constancia y ritmo diario', items: baseList.filter(h => !h.importance || h.importance === 'Normal') },
            { title: 'Hábitos Ligeros', subtitle: 'Complementarios', items: baseList.filter(h => h.importance === 'Ligero') }
        ].filter(g => g.items.length > 0);

        overlay.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center space-x-3">
                    <button onclick="closeHabitsFullScreen()" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver a Mi Día</button>
                    <div>
                        <h3 class="text-xl font-black">Mis Hábitos (${all.length})</h3>
                        <p class="text-xs text-gray-400">Divididos por categoría · Toca cualquier hábito para ver su detalle</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="setHabitsScreenFilter('TODOS')" class="px-3.5 py-2 rounded-xl text-xs font-bold ${hState.filter === 'TODOS' ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">Todos (${all.length})</button>
                    <button onclick="setHabitsScreenFilter('HOY')" class="px-3.5 py-2 rounded-xl text-xs font-bold ${hState.filter === 'HOY' ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">Programados Hoy (${all.filter(isHabitScheduledToday).length})</button>
                    <button onclick="openHabitModal(null)" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">+ Crear Hábito</button>
                </div>
            </div>

            ${groups.length === 0 ? `
                <div class="p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] text-center">
                    <p class="text-xs text-gray-400">No hay hábitos en esta vista.</p>
                </div>
            ` : `
                <div class="space-y-7">
                    ${groups.map(g => `
                        <div class="space-y-3">
                            <div class="flex items-baseline justify-between border-b border-gray-200 dark:border-[#28283C] pb-2">
                                <div class="flex items-center space-x-2">
                                    <h4 class="text-xs font-extrabold uppercase tracking-wider text-accent">${g.title}</h4>
                                    <span class="text-xs text-gray-400">(${g.items.length})</span>
                                </div>
                                <span class="text-[11px] text-gray-400">${g.subtitle}</span>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                ${g.items.map(renderCleanHabitCard).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        `;
        return;
    }

    if (hState.mode === 'DETAIL') {
        const h = (window.state.habits || []).find(x => String(x.docId) === String(hState.selectedHabitDocId));
        if (!h) {
            hState.mode = 'ALL_HABITS';
            renderHabitsFullScreenOverlay();
            return;
        }

        const cur = Number(h.currentValue || 0);
        const tar = Math.max(1, Number(h.targetValue || 1));
        const pct = Math.min(100, Math.round((cur / tar) * 100));
        const isQuant = ['quantity', 'duration', 'counter', 'numeric'].includes(h.type) || tar > 1;
        const reminders = getReminderTimesList(h);
        const activeDays = String(h.frequencyDays || 'L,M,X,J,V,S,D').toUpperCase();
        const isTimerRunning = hState.activeTimerId === h.docId;
        const timerMM = String(Math.floor(hState.timerSeconds / 60)).padStart(2, '0');
        const timerSS = String(hState.timerSeconds % 60).padStart(2, '0');

        overlay.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-3">
                <button onclick="openAllHabitsScreen()" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver a Hábitos</button>
                <div class="flex gap-2">
                    <button onclick="openHabitModal('${h.docId}')" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">✎ Editar Hábito</button>
                    <button onclick="deleteHabitFromDetail('${h.docId}')" class="px-4 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">🗑️ Eliminar</button>
                </div>
            </div>

            <div class="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#28283C] pb-6">
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 rounded-3xl bg-accent/15 border-2 border-accent flex items-center justify-center text-3xl shadow-lg">
                            ${getHabitIcon(h.icon)}
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#0A0A0F] border border-[#28283C] text-gray-400">Categoría: ${h.importance || 'Normal'}</span>
                                <span class="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#0A0A0F] border border-[#28283C] text-gray-400">Tipo: ${h.type || 'simple'}</span>
                            </div>
                            <h2 class="text-2xl font-black mt-1.5">${h.name}</h2>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-center min-w-[90px]">
                            <span class="text-lg font-black text-accent">🔥 ${h.streak || 0}</span>
                            <span class="text-[10px] text-gray-400 block uppercase font-bold">Racha Días</span>
                        </div>
                        <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-center min-w-[90px]">
                            <span class="text-lg font-black text-accent">+${h.xpReward || 20}</span>
                            <span class="text-[10px] text-gray-400 block uppercase font-bold">XP Diario</span>
                        </div>
                    </div>
                </div>

                <div class="p-6 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-extrabold uppercase tracking-wider text-gray-400">Progreso de Hoy</span>
                        <span class="text-sm font-black ${h.isCompleted ? 'text-emerald-400' : 'text-accent'}">
                            ${isQuant ? `${cur} / ${tar} ${h.unit || (h.type === 'duration' ? 'min' : '')} (${pct}%)` : (h.isCompleted ? '✓ Completado Hoy' : 'Pendiente Hoy')}
                        </span>
                    </div>

                    ${isQuant ? `
                        <div class="w-full h-3 bg-[#181824] rounded-full overflow-hidden">
                            <div class="h-full ${h.isCompleted ? 'bg-emerald-500' : 'bg-accent'} transition-all duration-300" style="width:${pct}%"></div>
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div class="flex items-center space-x-2">
                                <button onclick="stepHabitVal('${h.docId}', -1)" class="px-4 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-black">- 1</button>
                                <button onclick="stepHabitVal('${h.docId}', 1)" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-black">+ 1 ${h.unit || ''}</button>
                                <button onclick="promptCustomHabitValue('${h.docId}')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">Ingresar valor...</button>
                            </div>

                            ${h.type === 'duration' ? `
                                <div class="flex items-center space-x-2.5 p-2 rounded-xl bg-[#181824] border border-[#28283C]">
                                    <span id="habit-live-timer" class="font-mono text-sm font-black px-2">${timerMM}:${timerSS}</span>
                                    <button onclick="toggleHabitDurationTimer('${h.docId}')" class="px-3.5 py-1.5 rounded-lg ${isTimerRunning ? 'bg-amber-500 text-black' : 'bg-accent text-white'} text-xs font-extrabold">
                                        ${isTimerRunning ? '⏸ Pausar y Sumar Minutos' : '▶ Iniciar Cronómetro'}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <button onclick="toggleHabitCheck('${h.docId}', ${!h.isCompleted})" class="w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all ${h.isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-accent text-white shadow-lg'}">
                            ${h.isCompleted ? '✓ Hábito Completado Hoy (Toca para desmarcar)' : 'Marcar como Completado Hoy'}
                        </button>
                    `}
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-extrabold">Frecuencia Semanal</span>
                            <span class="text-xs text-accent font-bold">${h.frequency || 'Diario'}</span>
                        </div>
                        <div class="grid grid-cols-7 gap-1.5 text-center">
                            ${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => {
                                const isScheduled = h.frequency === 'Diario' ||
                                    (h.frequency === 'Lun a Vie' && ['L','M','X','J','V'].includes(d)) ||
                                    (h.frequency === 'Fines de semana' && ['S','D'].includes(d)) ||
                                    activeDays.includes(d);
                                return `<div class="py-2 rounded-xl text-xs font-black border ${isScheduled ? 'bg-accent text-white border-accent' : 'border-[#28283C] text-gray-500'}">${d}</div>`;
                            }).join('')}
                        </div>
                    </div>

                    <div class="p-5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-extrabold">Recordatorios Programados</span>
                            <span class="text-[11px] font-bold ${h.reminderEnabled ? 'text-accent' : 'text-gray-500'}">${h.reminderEnabled ? '🔔 Activos' : '🔕 Desactivados'}</span>
                        </div>
                        ${reminders.length === 0 ? `
                            <p class="text-xs text-gray-400">Sin horarios configurados.</p>
                        ` : `
                            <div class="flex flex-wrap gap-2">
                                ${reminders.map(timeStr => `<span class="px-3 py-1.5 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-mono font-bold text-accent">⏰ ${timeStr}</span>`).join('')}
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
}

window.openAllHabitsScreen = () => { hState.mode = 'ALL_HABITS'; renderHabitsFullScreenOverlay(); };
window.closeHabitsFullScreen = () => { hState.mode = 'MI_DIA'; renderHabitsFullScreenOverlay(); };
window.setHabitsScreenFilter = (f) => { hState.filter = f; renderHabitsFullScreenOverlay(); };
window.openHabitDetailScreen = (docId) => {
    window.navigate('dashboard');
    hState.selectedHabitDocId = String(docId);
    hState.mode = 'DETAIL';
    renderHabitsFullScreenOverlay();
};

window.toggleHabitCheck = async (docId, state) => {
    const h = (window.state.habits || []).find(x => String(x.docId) === String(docId));
    if (!h) return;
    const tar = Math.max(1, Number(h.targetValue || 1));
    const xpReward = Number(h.xpReward || 20);
    const nextStreak = state ? Number(h.streak || 0) + 1 : Math.max(0, Number(h.streak || 1) - 1);

    await fsActions.updateItem('habits', docId, {
        isCompleted: state,
        currentValue: state ? tar : 0,
        streak: nextStreak
    });

    const nextXp = Math.max(0, Number(window.state.profile?.xp || 0) + (state ? xpReward : -xpReward));
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
};

window.stepHabitVal = async (docId, delta) => {
    const h = (window.state.habits || []).find(x => String(x.docId) === String(docId));
    if (!h) return;
    const cur = Number(h.currentValue || 0);
    const tar = Math.max(1, Number(h.targetValue || 1));
    const xpReward = Number(h.xpReward || 20);

    const nextVal = Math.max(0, cur + delta);
    const wasDone = Boolean(h.isCompleted);
    const isNowDone = nextVal >= tar;
    const nextStreak = (!wasDone && isNowDone)
        ? Number(h.streak || 0) + 1
        : (wasDone && !isNowDone ? Math.max(0, Number(h.streak || 1) - 1) : Number(h.streak || 0));

    await fsActions.updateItem('habits', docId, {
        currentValue: nextVal,
        isCompleted: isNowDone,
        streak: nextStreak
    });

    if (!wasDone && isNowDone) {
        const nextXp = Number(window.state.profile?.xp || 0) + xpReward;
        await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
    }
};

window.promptCustomHabitValue = async (docId) => {
    const h = (window.state.habits || []).find(x => String(x.docId) === String(docId));
    if (!h) return;
    const val = prompt(`Progreso actual para "${h.name}" (Meta: ${h.targetValue} ${h.unit || ''}):`, h.currentValue || 0);
    if (val === null || isNaN(val)) return;
    const diff = Number(val) - Number(h.currentValue || 0);
    await window.stepHabitVal(docId, diff);
};

window.toggleHabitDurationTimer = async (docId) => {
    if (hState.activeTimerId === docId) {
        clearInterval(hState.timerInterval);
        const minsAdded = Math.max(1, Math.round(hState.timerSeconds / 60));
        hState.activeTimerId = null;
        hState.timerSeconds = 0;
        await window.stepHabitVal(docId, minsAdded);
        renderHabitsFullScreenOverlay();
        return;
    }

    if (hState.timerInterval) clearInterval(hState.timerInterval);
    hState.activeTimerId = docId;
    hState.timerSeconds = 0;
    hState.timerInterval = setInterval(() => {
        hState.timerSeconds++;
        const el = document.getElementById('habit-live-timer');
        if (el) {
            el.textContent = `${String(Math.floor(hState.timerSeconds / 60)).padStart(2, '0')}:${String(hState.timerSeconds % 60).padStart(2, '0')}`;
        }
    }, 1000);
    renderHabitsFullScreenOverlay();
};

window.moveHabitOrder = async (docId, direction) => {
    const sorted = getSortedHabits();
    const idx = sorted.findIndex(h => String(h.docId) === String(docId));
    const swapIdx = idx + direction;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;

    await fsActions.updateItem('habits', sorted[idx].docId, { displayOrder: swapIdx });
    await fsActions.updateItem('habits', sorted[swapIdx].docId, { displayOrder: idx });
};

window.deleteHabitFromDetail = async (docId) => {
    if (!confirm('¿Eliminar este hábito permanentemente?')) return;
    await fsActions.removeItem('habits', docId);
    hState.mode = 'ALL_HABITS';
    renderHabitsFullScreenOverlay();
};
