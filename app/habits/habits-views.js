import { fsActions } from '../firebase-sync.js?v=5';

export const HABIT_ICONS = {
    star: '⭐', water: '💧', fitness: '💪', book: '📖', brain: '🧠',
    meditation: '🧘', sleep: '🌙', code: '💻', pill: '💊', run: '🏃',
    salad: '🥗', music: '🎵', money: '💰', clean: '🧹', fire: '🔥'
};

export const hState = {
    mode: 'MI_DIA', // 'MI_DIA' | 'ALL_HABITS' | 'DETAIL'
    filter: 'TODOS', // 'TODOS' | 'HOY' | 'ESENCIALES'
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

// Réplica exacta de HabitEntity.isScheduledForToday() en Kotlin
export function isHabitScheduledToday(h) {
    const freq = String(h.frequency || 'Diario').trim().toLowerCase();
    const dow = today.getDay(); // 0 Dom .. 6 Sab
    if (freq === 'diario') return true;
    if (freq === 'lun a vie') return dow >= 1 && dow <= 5;
    if (freq === 'fines de semana') return dow === 0 || dow === 6;
    return String(h.frequencyDays || 'L,M,X,J,V,S,D').toUpperCase().includes(todayChar);
}

// Réplica de HabitEntity.getReminderTimesList()
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

// 1. LISTA COMPACTA EN MI DÍA (Máximo 5 con visibleInMiDia != false)
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
    const color = h.colorHex || '#8B5CF6';
    const icon = getHabitIcon(h.icon);
    const impBadge = h.importance === 'Esencial'
        ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-bold">Esencial</span>'
        : h.importance === 'Ligero'
            ? '<span class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 font-bold">Ligero</span>'
            : '';

    if (isQuant) {
        const pct = Math.min(100, Math.round((cur / tar) * 100));
        return `
            <div onclick="openHabitDetailScreen('${h.docId}')" class="p-3 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent cursor-pointer transition-all space-y-2">
                <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center space-x-2.5 min-w-0">
                        <span class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0" style="background-color:${color}22; border:1px solid ${color}55">${icon}</span>
                        <div class="min-w-0">
                            <div class="flex items-center space-x-1.5">
                                <span class="text-xs font-extrabold truncate ${h.isCompleted ? 'line-through text-gray-500' : ''}">${h.name}</span>
                                ${impBadge}
                            </div>
                            <span class="text-[10px] text-gray-400">🔥 ${h.streak || 0}d · +${h.xpReward || 20} XP</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-1 shrink-0" onclick="event.stopPropagation()">
                        <button onclick="stepHabitVal('${h.docId}', -1)" class="w-6 h-6 rounded-lg bg-[#181824] border border-[#28283C] text-xs font-bold hover:border-accent">-</button>
                        <span class="text-[11px] font-mono font-bold px-1">${cur}/${tar} ${h.unit || (h.type === 'duration' ? 'min' : '')}</span>
                        <button onclick="stepHabitVal('${h.docId}', 1)" class="w-6 h-6 rounded-lg text-white text-xs font-bold" style="background-color:${color}">+</button>
                    </div>
                </div>
                <div class="w-full h-1.5 bg-[#181824] rounded-full overflow-hidden">
                    <div class="h-full transition-all" style="width:${pct}%; background-color:${h.isCompleted ? '#10B981' : color}"></div>
                </div>
            </div>
        `;
    }

    return `
        <div onclick="openHabitDetailScreen('${h.docId}')" class="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent cursor-pointer transition-all">
            <div class="flex items-center space-x-2.5 min-w-0">
                <span class="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0" style="background-color:${color}22; border:1px solid ${color}55">${icon}</span>
                <div class="min-w-0">
                    <div class="flex items-center space-x-1.5">
                        <span class="text-xs ${h.isCompleted ? 'line-through text-gray-500' : 'font-extrabold'} truncate">${h.name}</span>
                        ${impBadge}
                    </div>
                    <span class="text-[10px] text-gray-400">🔥 ${h.streak || 0}d · +${h.xpReward || 20} XP</span>
                </div>
            </div>
            <div onclick="event.stopPropagation()">
                <input type="checkbox" ${h.isCompleted ? 'checked' : ''} onchange="toggleHabitCheck('${h.docId}', this.checked)" class="w-5 h-5 rounded cursor-pointer">
            </div>
        </div>
    `;
}

// 2. PANTALLA COMPLETA DE TODOS LOS HÁBITOS (HabitosScreen.kt) y DETALLE DE HÁBITO (DetalleHabitoScreen.kt)
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

    // Ocultar las tarjetas normales de Mi Día para mostrar la pantalla completa de Hábitos o Detalle
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
        const filtered = all.filter(h => {
            if (hState.filter === 'HOY') return isHabitScheduledToday(h);
            if (hState.filter === 'ESENCIALES') return h.importance === 'Esencial';
            return true;
        });

        overlay.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center space-x-3">
                    <button onclick="closeHabitsFullScreen()" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver a Mi Día</button>
                    <div>
                        <h3 class="text-xl font-black">Mis Hábitos (${all.length})</h3>
                        <p class="text-xs text-gray-400">Toca cualquier hábito para abrir su pantalla de detalle, estadísticas y recordatorios</p>
                    </div>
                </div>
                <button onclick="openHabitModal(null)" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">+ Crear Hábito</button>
            </div>

            <div class="flex flex-wrap gap-2">
                ${[
                    { id: 'TODOS', label: `Todos (${all.length})` },
                    { id: 'HOY', label: `Programados Hoy (${all.filter(isHabitScheduledToday).length})` },
                    { id: 'ESENCIALES', label: `Esenciales (${all.filter(x => x.importance === 'Esencial').length})` }
                ].map(f => `
                    <button onclick="setHabitsScreenFilter('${f.id}')" class="px-3.5 py-1.5 rounded-full text-xs font-bold ${hState.filter === f.id ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">${f.label}</button>
                `).join('')}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${filtered.length === 0 ? '<p class="text-xs text-gray-400">No hay hábitos en este filtro.</p>' : filtered.map((h, idx) => {
                    const color = h.colorHex || '#8B5CF6';
                    const reminders = getReminderTimesList(h);
                    return `
                        <div onclick="openHabitDetailScreen('${h.docId}')" class="p-5 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent cursor-pointer transition-all flex flex-col justify-between space-y-4">
                            <div class="flex items-start justify-between gap-3">
                                <div class="flex items-center space-x-3.5">
                                    <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0" style="background-color:${color}22; border:1px solid ${color}66">
                                        ${getHabitIcon(h.icon)}
                                    </div>
                                    <div>
                                        <div class="flex items-center space-x-2">
                                            <h4 class="text-sm font-extrabold">${h.name}</h4>
                                            <span class="text-[10px] px-2 py-0.5 rounded-full bg-[#0A0A0F] border border-[#28283C] font-bold">${h.importance || 'Normal'}</span>
                                        </div>
                                        <p class="text-[11px] text-gray-400 mt-0.5">${h.frequency || 'Diario'} (${h.frequencyDays || 'L,M,X,J,V,S,D'}) · 🔥 ${h.streak || 0} días</p>
                                        ${reminders.length > 0 ? `<p class="text-[10px] text-accent mt-1">🔔 ${reminders.join(', ')}</p>` : ''}
                                    </div>
                                </div>
                                <div class="flex items-center space-x-1" onclick="event.stopPropagation()">
                                    <button onclick="moveHabitOrder('${h.docId}', -1)" class="p-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] text-[10px]" title="Subir">↑</button>
                                    <button onclick="moveHabitOrder('${h.docId}', 1)" class="p-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] text-[10px]" title="Bajar">↓</button>
                                    <button onclick="openHabitModal('${h.docId}')" class="p-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] text-xs" title="Editar">✎</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
        return;
    }

    // 3. PANTALLA DE DETALLE DE HÁBITO (DetalleHabitoScreen.kt)
    if (hState.mode === 'DETAIL') {
        const h = (window.state.habits || []).find(x => String(x.docId) === String(hState.selectedHabitDocId));
        if (!h) {
            hState.mode = 'ALL_HABITS';
            renderHabitsFullScreenOverlay();
            return;
        }

        const color = h.colorHex || '#8B5CF6';
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
                <!-- Cabecera del Hábito -->
                <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#28283C] pb-6">
                    <div class="flex items-center space-x-4">
                        <div class="w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-lg" style="background-color:${color}25; border:2px solid ${color}">
                            ${getHabitIcon(h.icon)}
                        </div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full" style="background-color:${color}25; color:${color}">${h.importance || 'Normal'}</span>
                                <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#0A0A0F] border border-[#28283C] text-gray-400">Tipo: ${h.type || 'simple'}</span>
                                ${h.visibleInMiDia === false ? '<span class="text-[10px] px-2 py-0.5 rounded bg-gray-500/20 text-gray-400">Oculto en Mi Día</span>' : ''}
                            </div>
                            <h2 class="text-2xl font-black mt-1.5">${h.name}</h2>
                        </div>
                    </div>

                    <div class="flex gap-3">
                        <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-center min-w-[90px]">
                            <span class="text-lg font-black text-amber-400">🔥 ${h.streak || 0}</span>
                            <span class="text-[10px] text-gray-400 block uppercase font-bold">Racha Días</span>
                        </div>
                        <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-center min-w-[90px]">
                            <span class="text-lg font-black text-accent">+${h.xpReward || 20}</span>
                            <span class="text-[10px] text-gray-400 block uppercase font-bold">XP Diario</span>
                        </div>
                    </div>
                </div>

                <!-- Control de Progreso de Hoy (Simple vs Cantidad/Contador vs Duración con Cronómetro) -->
                <div class="p-6 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-extrabold uppercase tracking-wider text-gray-400">Progreso de Hoy</span>
                        <span class="text-sm font-black" style="color:${h.isCompleted ? '#10B981' : color}">
                            ${isQuant ? `${cur} / ${tar} ${h.unit || (h.type === 'duration' ? 'min' : '')} (${pct}%)` : (h.isCompleted ? '✓ Completado Hoy' : 'Pendiente Hoy')}
                        </span>
                    </div>

                    ${isQuant ? `
                        <div class="w-full h-3 bg-[#181824] rounded-full overflow-hidden">
                            <div class="h-full transition-all duration-300" style="width:${pct}%; background-color:${h.isCompleted ? '#10B981' : color}"></div>
                        </div>
                        <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                            <div class="flex items-center space-x-2">
                                <button onclick="stepHabitVal('${h.docId}', -1)" class="px-4 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-black">- 1</button>
                                <button onclick="stepHabitVal('${h.docId}', 1)" class="px-4 py-2 rounded-xl text-white text-xs font-black" style="background-color:${color}">+ 1 ${h.unit || ''}</button>
                                <button onclick="promptCustomHabitValue('${h.docId}')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">Ingresar valor...</button>
                            </div>

                            ${h.type === 'duration' ? `
                                <div class="flex items-center space-x-2.5 p-2 rounded-xl bg-[#181824] border border-[#28283C]">
                                    <span id="habit-live-timer" class="font-mono text-sm font-black px-2">${timerMM}:${timerSS}</span>
                                    <button onclick="toggleHabitDurationTimer('${h.docId}')" class="px-3.5 py-1.5 rounded-lg ${isTimerRunning ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'} text-xs font-extrabold">
                                        ${isTimerRunning ? '⏸ Pausar y Sumar Minutos' : '▶ Iniciar Cronómetro'}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <button onclick="toggleHabitCheck('${h.docId}', ${!h.isCompleted})" class="w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all ${h.isCompleted ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-white shadow-lg'}" style="${!h.isCompleted ? `background-color:${color}` : ''}">
                            ${h.isCompleted ? '✓ Hábito Completado Hoy (Toca para desmarcar)' : 'Marcar como Completado Hoy'}
                        </button>
                    `}
                </div>

                <!-- Frecuencia y Días Programados -->
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
                                return `<div class="py-2 rounded-xl text-xs font-black border ${isScheduled ? 'text-white border-transparent' : 'border-[#28283C] text-gray-500'}" style="${isScheduled ? `background-color:${color}` : ''}">${d}</div>`;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Horarios de Recordatorio (getReminderTimesList) -->
                    <div class="p-5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-3">
                        <div class="flex justify-between items-center">
                            <span class="text-xs font-extrabold">Recordatorios Programados</span>
                            <span class="text-[11px] font-bold ${h.reminderEnabled ? 'text-emerald-400' : 'text-gray-500'}">${h.reminderEnabled ? '🔔 Activos' : '🔕 Desactivados'}</span>
                        </div>
                        ${reminders.length === 0 ? `
                            <p class="text-xs text-gray-400">Sin horarios configurados. Edita el hábito para agregar uno o varios horarios de aviso.</p>
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

// ACCIONES INTERACTIVAS DE HÁBITOS
window.openAllHabitsScreen = () => {
    hState.mode = 'ALL_HABITS';
    renderHabitsFullScreenOverlay();
};

window.closeHabitsFullScreen = () => {
    hState.mode = 'MI_DIA';
    renderHabitsFullScreenOverlay();
};

window.setHabitsScreenFilter = (f) => {
    hState.filter = f;
    renderHabitsFullScreenOverlay();
};

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
    const val = prompt(`Ingresa el progreso actual para "${h.name}" (Meta: ${h.targetValue} ${h.unit || ''}):`, h.currentValue || 0);
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
