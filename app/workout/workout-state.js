import * as catalog from './workout-catalog.js';

const CATALOG_TEMPLATES =
    catalog.WORKOUT_CATALOG_TEMPLATES ||
    catalog.WORKOUT_TEMPLATES ||
    catalog.ROUTINE_TEMPLATES ||
    catalog.default ||
    Object.values(catalog).find(v => Array.isArray(v) && v[0]?.days) ||
    [];

if (!window.wState) {
    window.wState = {
        subScreen: 'HUB',
        selectedRoutineId: null,
        selectedExerciseName: null,
        activeSession: null,
        timerInterval: null,
        restSecondsLeft: 0,
        restInterval: null,
        lastFinishedSummary: null
    };
}

export const wState = window.wState;

export function getUserSavedRoutines() {
    return (window.state.workout_routines || []).map(r => ({
        ...r,
        isCustom: true,
        days: Array.isArray(r.days) ? r.days : [{ dayNumber: 1, name: r.focus || 'Entrenamiento General', exercises: [] }]
    }));
}

export function getCatalogTemplates() {
    return CATALOG_TEMPLATES;
}

export function getAllAvailableRoutines() {
    return [...getUserSavedRoutines(), ...CATALOG_TEMPLATES];
}

export function getActiveMainRoutine() {
    const mainId = localStorage.getItem('weavax_main_routine_id');
    const all = getAllAvailableRoutines();
    if (mainId) {
        const found = all.find(r => String(r.id) === String(mainId));
        if (found) return found;
    }
    return all[0] || null;
}

export function getTodayScheduledWorkoutInfo() {
    const mainR = getActiveMainRoutine();
    if (!mainR || !mainR.days || mainR.days.length === 0) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sessions = (window.state.workout_sessions || []).filter(s => s.isCompleted);

    const doneToday = sessions.some(s => Number(s.startedAt || 0) >= startOfToday);
    const completedCountForRoutine = sessions.filter(s => String(s.routineId) === String(mainR.id)).length;
    const dayIdx = completedCountForRoutine % mainR.days.length;
    const nextDay = mainR.days[dayIdx];

    return {
        routineId: mainR.id,
        routineName: mainR.name,
        dayNumber: nextDay.dayNumber || (dayIdx + 1),
        dayName: nextDay.name,
        exercisesCount: (nextDay.exercises || []).length,
        estimatedMin: Math.max(25, (nextDay.exercises || []).length * 10),
        doneToday
    };
}

export function getWeeklyWorkoutStats() {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1)).getTime();
    const sessions = (window.state.workout_sessions || []).filter(s => s.isCompleted && Number(s.startedAt || 0) >= monday);
    return {
        count: sessions.length,
        volume: sessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0),
        minutes: Math.round(sessions.reduce((acc, s) => acc + Number(s.durationSeconds || 0), 0) / 60)
    };
}
