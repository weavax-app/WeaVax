import { isHabitScheduledToday } from './habits/habits-views.js';
import { getWeeklyWorkoutStats } from './workout/workout-state.js';

export function renderProgressModule() {
    const container = document.getElementById('view-progress');
    if (!container) return;

    const p = window.state.profile || {};
    const habits = window.state.habits || [];
    const tasks = window.state.tasks || [];
    const projects = window.state.projects || [];
    const sessions = window.state.workout_sessions || [];

    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;
    const todayYear = now.getFullYear();
    const startOfToday = new Date(todayYear, todayMonth - 1, todayDay).getTime();

    // 1. Nivel, XP y Racha
    const xp = Number(p.xp || 0);
    const level = Math.floor(xp / 100) + 1;
    const xpInLevel = xp % 100;
    const streak = Number(p.streak || 0);

    // 2. Métricas de Hoy (Daily Score)
    const todayHabits = habits.filter(h => isHabitScheduledToday(h));
    const doneHabitsToday = todayHabits.filter(h => h.isCompleted).length;
    const habitPct = todayHabits.length ? Math.round((doneHabitsToday / todayHabits.length) * 100) : 0;

    const todayTasks = tasks.filter(t => !t.isEvent && !t.inInbox && Number(t.day) === todayDay && Number(t.month) === todayMonth && Number(t.year) === todayYear);
    const doneTasksToday = todayTasks.filter(t => t.isCompleted).length;
    const taskPct = todayTasks.length ? Math.round((doneTasksToday / todayTasks.length) * 100) : 0;

    const trainedToday = sessions.some(s => s.isCompleted && Number(s.startedAt || 0) >= startOfToday);
    const workoutPct = trainedToday ? 100 : 0;

    const totalTodayItems = todayHabits.length + todayTasks.length + (trainedToday ? 1 : 0);
    const doneTodayItems = doneHabitsToday + doneTasksToday + (trainedToday ? 1 : 0);
    const dailyScore = totalTodayItems === 0 ? 0 : Math.round((doneTodayItems / totalTodayItems) * 100);

    // 3. Estadísticas Semanales y Globales
    const weekWorkout = getWeeklyWorkoutStats();
    const totalVolumeAllTime = sessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0);
    const bestHabitStreak = habits.reduce((max, h) => Math.max(max, Number(h.streak || 0)), 0);
    const totalCompletedTasks = tasks.filter(t => !t.isEvent && t.isCompleted).length;

    // 4. Datos de los últimos 7 días para el gráfico de barras
    const last7Days = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(todayYear, todayMonth - 1, todayDay - i);
        const dStart = d.getTime();
        const dEnd = dStart + 86400000;

        const dayTasks = tasks.filter(t => !t.isEvent && Number(t.day) === d.getDate() && Number(t.month) === (d.getMonth() + 1) && Number(t.year) === d.getFullYear());
        const dayTasksDone = dayTasks.filter(t => t.isCompleted).length;
        const dayWorkouts = sessions.filter(s => s.isCompleted && Number(s.startedAt || 0) >= dStart && Number(s.startedAt || 0) < dEnd).length;

        let pct = 0;
        if (i === 0) {
            pct = dailyScore;
        } else {
            const pts = (dayTasksDone * 25) + (dayWorkouts * 50);
            pct = Math.min(100, pts);
        }

        last7Days.push({
            label: dayNames[d.getDay()],
            dateNum: d.getDate(),
            pct,
            isToday: i === 0
        });
    }

    const activeModulesToday = [
        { label: 'Hábitos del Día', detail: `${doneHabitsToday}/${todayHabits.length} completados`, pct: habitPct },
        { label: 'Tareas de Hoy', detail: `${doneTasksToday}/${todayTasks.length} completadas`, pct: taskPct },
        { label: 'Entrenamiento', detail: trainedToday ? 'Sesión completada hoy' : 'Pendiente hoy', pct: workoutPct }
    ].filter(m => m.pct > 0);

    container.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-2xl font-black tracking-tight">Progreso y Rendimiento</h3>
                <p class="text-xs text-gray-400 mt-1">Evolución de nivel, consistencia semanal y métricas por módulo</p>
            </div>

            <!-- TARJETAS KPI PRINCIPALES -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nivel LifeOS</span>
                        <span class="text-xs font-extrabold text-accent">Nivel ${level}</span>
                    </div>
                    <div class="text-2xl font-black">${xp} <span class="text-xs font-normal text-gray-400">XP total</span></div>
                    <div class="w-full h-2 bg-gray-200 dark:bg-[#0A0A0F] rounded-full overflow-hidden">
                        <div class="h-full bg-accent transition-all" style="width:${xpInLevel}%"></div>
                    </div>
                    <p class="text-[10px] text-gray-400">${100 - xpInLevel} XP para Nivel ${level + 1}</p>
                </div>

                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-1.5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Racha Activa</span>
                    <div class="text-2xl font-black text-amber-400">🔥 ${streak} días</div>
                    <p class="text-[11px] text-gray-400">Mejor racha en hábitos: <strong class="text-white">${bestHabitStreak}d</strong></p>
                </div>

                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-1.5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Daily Score Hoy</span>
                    <div class="text-2xl font-black text-accent">${dailyScore}%</div>
                    <p class="text-[11px] text-gray-400">${doneTodayItems} de ${totalTodayItems} objetivos hoy</p>
                </div>

                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-1.5">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gym Esta Semana</span>
                    <div class="text-2xl font-black text-emerald-400">${weekWorkout.count} <span class="text-xs font-normal text-gray-400">sesiones</span></div>
                    <p class="text-[11px] text-gray-400">Volumen: <strong class="text-white">${weekWorkout.volume.toLocaleString('es-BO')} kg</strong></p>
                </div>
            </div>

            <!-- DISTRIBUCIÓN DIARIA + ACTIVIDAD 7 DÍAS -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Distribución de Hoy -->
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div>
                        <h4 class="text-sm font-extrabold">Distribución de Progreso Hoy</h4>
                        <p class="text-[11px] text-gray-400">Cumplimiento activo por área en el día actual</p>
                    </div>
                    ${activeModulesToday.length === 0 ? `
                        <div class="p-6 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-center">
                            <p class="text-xs text-gray-400">Completa al menos un hábito, tarea o entrenamiento hoy para visualizar tu distribución.</p>
                        </div>
                    ` : `
                        <div class="space-y-4 pt-1">
                            ${activeModulesToday.map(m => `
                                <div>
                                    <div class="flex justify-between text-xs font-bold mb-1.5">
                                        <span>${m.label}</span>
                                        <span class="text-accent">${m.detail} · ${m.pct}%</span>
                                    </div>
                                    <div class="w-full h-2.5 bg-gray-200 dark:bg-[#0A0A0F] rounded-full overflow-hidden">
                                        <div class="h-full bg-accent transition-all" style="width:${m.pct}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- Gráfico Semanal (Últimos 7 Días) -->
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div>
                        <h4 class="text-sm font-extrabold">Actividad de los Últimos 7 Días</h4>
                        <p class="text-[11px] text-gray-400">Constancia diaria de ejecución</p>
                    </div>
                    <div class="grid grid-cols-7 gap-2 items-end h-40 pt-4 px-1">
                        ${last7Days.map(d => `
                            <div class="flex flex-col items-center h-full justify-end space-y-1.5">
                                <span class="text-[10px] font-bold text-gray-400">${d.pct}%</span>
                                <div class="w-full max-w-[32px] h-24 bg-gray-100 dark:bg-[#0A0A0F] rounded-xl flex items-end overflow-hidden border ${d.isToday ? 'border-accent' : 'border-transparent'}">
                                    <div class="w-full bg-accent rounded-t-lg transition-all" style="height:${Math.max(6, d.pct)}%"></div>
                                </div>
                                <span class="text-[10px] font-extrabold ${d.isToday ? 'text-accent' : 'text-gray-400'}">${d.label}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <!-- RESUMEN HISTÓRICO POR ÁREA -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-1">
                    <span class="text-[10px] font-bold uppercase text-gray-400">Hábitos Activos</span>
                    <p class="text-xl font-black">${habits.length} hábitos</p>
                    <p class="text-xs text-gray-400">${habits.filter(h => h.importance === 'Esencial').length} esenciales configurados</p>
                </div>
                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-1">
                    <span class="text-[10px] font-bold uppercase text-gray-400">Tareas y Proyectos</span>
                    <p class="text-xl font-black">${totalCompletedTasks} tareas completadas</p>
                    <p class="text-xs text-gray-400">${projects.length} proyectos registrados</p>
                </div>
                <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-1">
                    <span class="text-[10px] font-bold uppercase text-gray-400">Histórico Entrenamiento</span>
                    <p class="text-xl font-black">${sessions.length} sesiones totales</p>
                    <p class="text-xs text-gray-400">${totalVolumeAllTime.toLocaleString('es-BO')} kg acumulados</p>
                </div>
            </div>
        </div>
    `;
}

window.renderProgressModule = renderProgressModule;  
