import { getTodayScheduledWorkoutInfo } from './ui-workouts.js?v=5';
import {
    isHabitScheduledToday,
    renderMiDiaHabitsCard,
    renderHabitsFullScreenOverlay
} from './habits/habits-views.js';
import './habits/habits-modals.js';

const today = new Date();
const todayDay = today.getDate();
const todayMonth = today.getMonth() + 1;
const todayYear = today.getFullYear();

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

    // 1. Renderizar Hábitos de Mi Día y Overlay de Pantalla Completa / Detalle
    renderMiDiaHabitsCard();
    renderHabitsFullScreenOverlay();

    // 2. Renderizar Agenda de Hoy
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
                        <input type="checkbox" ${t.isCompleted ? 'checked' : ''} onchange="toggleTaskCheck('${t.docId}', ${!t.isCompleted})" class="w-4 h-4 rounded cursor-pointer">
                        <div>
                            <p class="text-xs ${t.isCompleted ? 'line-through text-gray-500' : 'font-semibold'}">${t.title}</p>
                            <p class="text-[10px] text-gray-400">${t.priority || 'Media'} ${t.project ? '· 📁 ' + t.project : ''}</p>
                        </div>
                    </div>
                    <button onclick="deleteDocItem('tasks', '${t.docId}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>
                </div>
            `).join('');
    }

    // 3. Tarjeta de qué entrenamiento toca hoy
    const workoutTodayBox = document.getElementById('dashboard-today-workout-box');
    if (workoutTodayBox) {
        const info = getTodayScheduledWorkoutInfo();
        workoutTodayBox.innerHTML = !info ? `
            <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
                <div>
                    <span class="text-[10px] font-bold uppercase text-gray-400">Entrenamiento de Hoy</span>
                    <p class="text-sm font-bold mt-0.5">Sin rutina principal seleccionada</p>
                </div>
                <button onclick="navigate('workouts')" class="px-4 py-2 rounded-xl bg-accent/15 text-accent text-xs font-bold">Elegir Rutina →</button>
            </div>
        ` : `
            <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-wrap items-center justify-between gap-4">
                <div>
                    <span class="text-[10px] font-bold uppercase text-accent">Entrenamiento de Hoy · ${info.routineName}</span>
                    <h4 class="text-base font-black mt-0.5">${info.dayName}</h4>
                    <p class="text-xs text-gray-400 mt-0.5">${info.exercisesCount} ejercicios · ~${info.estimatedMin} min ${info.doneToday ? '· <span class="text-emerald-400 font-bold">✓ Completado hoy</span>' : ''}</p>
                </div>
                <button onclick="beginActiveWorkoutSession(${info.routineId}, ${info.dayNumber})" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">
                    ▶ Entrenar Ahora
                </button>
            </div>
        `;
    }

    // 4. Barras de Progreso
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
