import { isHabitScheduledToday, getReminderTimesList } from './habits/habits-views.js?v=3';
import { getTodayScheduledWorkoutInfo } from './ui-workouts.js?v=2';

let notifInterval = null;

function getNotifPrefs() {
    return {
        enabled: localStorage.getItem('weavax_notifs_enabled') !== '0',
        habits: localStorage.getItem('weavax_notif_habits') !== '0',
        agenda: localStorage.getItem('weavax_notif_agenda') !== '0',
        workouts: localStorage.getItem('weavax_notif_workouts') !== '0',
        workoutTime: localStorage.getItem('weavax_notif_workout_time') || '18:00'
    };
}

function formatHHMM(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function triggerWeavaxNotification(uniqueKey, title, body, navTarget = 'dashboard') {
    const todayStr = new Date().toISOString().slice(0, 10);
    const storageKey = `weavax_notified_${todayStr}_${uniqueKey}`;
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, '1');

    if ('Notification' in window && Notification.permission === 'granted') {
        try {
            const n = new Notification(title, {
                body,
                icon: '../weavax_logo.png',
                badge: '../weavax_logo.png'
            });
            n.onclick = () => {
                window.focus();
                if (window.navigate) window.navigate(navTarget);
                n.close();
            };
        } catch (e) {
            console.warn('Error notificación nativa:', e);
        }
    }

    showInAppNotificationToast(title, body, navTarget);
}

export function showInAppNotificationToast(title, body, navTarget = 'dashboard') {
    let stack = document.getElementById('weavax-toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'weavax-toast-stack';
        stack.className = 'fixed bottom-16 md:bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0';
        document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto p-4 rounded-2xl bg-[#181824] border border-accent shadow-2xl flex items-start space-x-3 transition-all duration-300';
    toast.innerHTML = `
        <img src="../weavax_logo.png" class="w-9 h-9 rounded-xl object-contain bg-[#0A0A0F] p-1 border border-accent/40 shrink-0">
        <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-accent">WeaVax · Recordatorio</span>
                <button onclick="this.closest('.pointer-events-auto').remove()" class="text-xs text-gray-400 hover:text-white">✕</button>
            </div>
            <p class="text-xs font-extrabold text-white mt-0.5">${title}</p>
            <p class="text-[11px] text-gray-300 mt-0.5 leading-snug">${body}</p>
            <button onclick="window.navigate('${navTarget}'); this.closest('.pointer-events-auto').remove();" class="mt-2 px-3 py-1 rounded-lg bg-accent text-white text-[10px] font-extrabold">
                Abrir módulo →
            </button>
        </div>
    `;
    stack.appendChild(toast);
    setTimeout(() => toast.remove(), 12000);
}

function checkAllScheduledNotifications() {
    const prefs = getNotifPrefs();
    if (!prefs.enabled) return;

    const now = new Date();
    const curHHMM = formatHHMM(now);
    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    // 1. HÁBITOS (Leídos desde Firestore)
    if (prefs.habits) {
        (window.state.habits || []).forEach(h => {
            if (h.isCompleted || !isHabitScheduledToday(h)) return;
            const times = getReminderTimesList(h);
            if (times.includes(curHHMM)) {
                triggerWeavaxNotification(
                    `habit_${h.docId}_${curHHMM}`,
                    `🔥 Hábito: ${h.name}`,
                    `Es hora de completar tu hábito (${curHHMM}) · +${h.xpReward || 20} XP`,
                    'dashboard'
                );
            }
        });
    }

    // 2. EVENTOS Y TAREAS (Hora Fija o Tiempo Antes)
    if (prefs.agenda) {
        (window.state.tasks || []).forEach(t => {
            if (t.isCompleted || t.inInbox) return;
            const itemDate = new Date(Number(t.year), Number(t.month) - 1, Number(t.day));
            const rems = Array.isArray(t.reminders) && t.reminders.length > 0
                ? t.reminders
                : (t.time ? [{ mode: 'FIXED', value: t.time }] : []);

            rems.forEach((rem, idx) => {
                if (rem.mode === 'FIXED') {
                    const isSameDay = itemDate.getDate() === d && (itemDate.getMonth() + 1) === m && itemDate.getFullYear() === y;
                    if (isSameDay && String(rem.value).trim() === curHHMM) {
                        triggerWeavaxNotification(
                            `agenda_fixed_${t.docId}_${idx}_${curHHMM}`,
                            t.isEvent ? `📅 Evento: ${t.title}` : `✅ Tarea: ${t.title}`,
                            `${t.location ? `📍 ${t.location} · ` : ''}Hora programada: ${curHHMM}`,
                            'plan'
                        );
                    }
                } else if (rem.mode === 'BEFORE') {
                    const minsBefore = Number(rem.value || 0);
                    const [hh, mm] = String(t.time || '09:00').split(':').map(Number);
                    const eventStart = new Date(Number(t.year), Number(t.month) - 1, Number(t.day), hh || 9, mm || 0, 0);
                    const triggerTime = new Date(eventStart.getTime() - minsBefore * 60000);

                    if (
                        triggerTime.getDate() === d &&
                        (triggerTime.getMonth() + 1) === m &&
                        triggerTime.getFullYear() === y &&
                        formatHHMM(triggerTime) === curHHMM
                    ) {
                        const label = minsBefore === 1440 ? 'Mañana' : `En ${minsBefore} min`;
                        triggerWeavaxNotification(
                            `agenda_before_${t.docId}_${idx}_${curHHMM}`,
                            `⏳ ${label}: ${t.title}`,
                            `Programado para el ${t.day}/${t.month} a las ${t.time || '09:00'}${t.location ? ` · 📍 ${t.location}` : ''}`,
                            'plan'
                        );
                    }
                }
            });
        });
    }

    // 3. ENTRENAMIENTO DEL DÍA
    if (prefs.workouts && curHHMM === prefs.workoutTime) {
        const wInfo = getTodayScheduledWorkoutInfo();
        if (wInfo && !wInfo.doneToday) {
            triggerWeavaxNotification(
                `workout_${wInfo.routineId}_${wInfo.dayNumber}`,
                `🏋️ Toca entrenar: ${wInfo.dayName}`,
                `${wInfo.routineName} · ${wInfo.exercisesCount} ejercicios (~${wInfo.estimatedMin} min)`,
                'workouts'
            );
        }
    }
}

export function startNotificationEngine() {
    if (notifInterval) clearInterval(notifInterval);
    checkAllScheduledNotifications();
    notifInterval = setInterval(checkAllScheduledNotifications, 30000);
}

window.testWeavaxNotification = () => {
    showInAppNotificationToast(
        '🔔 Prueba de Notificación WeaVax',
        'Los recordatorios de Hábitos, Tareas, Eventos y Entrenamiento están activos.',
        'settings'
    );
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('WeaVax LifeOS', { body: 'Notificaciones nativas activas.', icon: '../weavax_logo.png' });
    }
};
