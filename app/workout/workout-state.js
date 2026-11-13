import { WEAVAX_30_TEMPLATES, mkDay, pPush } from './workout-catalog.js';

export const wState = {
    subScreen: 'PRINCIPAL',
    libraryTab: 'MIS_RUTINAS',
    viewMode: 'grid',
    categoryFilter: 'Todas',
    muscleFilter: 'Todos',
    searchQuery: '',
    selectedRoutineId: Number(localStorage.getItem('weavax_primary_routine_id') || 0),
    viewingRoutine: null,
    viewingDayPlan: null,
    activeSession: null,
    timerInterval: null,
    restSecondsLeft: 0,
    restInterval: null,
    finishDraft: null,
    summaryData: null,
    summarySlideIdx: 0
};

export function getUserSavedRoutines() {
    return (window.state.workout_routines || [])
        .filter(r => !r.isSystemTemplate)
        .map(r => ({
            ...r,
            days: Array.isArray(r.days) && r.days.length > 0
                ? r.days
                : [mkDay(1, "Día 1", pPush, [[1,4,"8-10",90],[14,4,"8-10",90],[21,4,"8-10",120]])]
        }));
}

export function getAllRoutinesAndTemplates() {
    return [...getUserSavedRoutines(), ...WEAVAX_30_TEMPLATES];
}

export function getWeeklyWorkoutStats() {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1).getTime();
    const sessions = (window.state.workout_sessions || []).filter(s => s.isCompleted && Number(s.startedAt || 0) >= monday);
    const weeklyVol = sessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0);
    return { count: sessions.length, volume: weeklyVol, sessions };
}

export function getTodayScheduledWorkoutInfo() {
    const userRoutines = getUserSavedRoutines();
    if (userRoutines.length === 0) return null;
    const primary = userRoutines.find(r => Number(r.id) === Number(wState.selectedRoutineId)) || userRoutines[0];
    const weekStats = getWeeklyWorkoutStats();
    const days = primary.days || [];
    if (days.length === 0) return null;

    const nextDay = days.find(d => !weekStats.sessions.some(s => Number(s.routineId) === Number(primary.id) && Number(s.dayNumber) === Number(d.dayNumber)))
        || days[weekStats.count % days.length];

    const startOfToday = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
    const doneToday = weekStats.sessions.some(s => Number(s.startedAt || 0) >= startOfToday);

    return {
        routineId: primary.id,
        routineName: primary.name,
        dayNumber: nextDay.dayNumber,
        dayName: nextDay.dayName,
        exercisesCount: (nextDay.exercises || []).length,
        estimatedMin: primary.estimatedDurationMinutes || 60,
        doneToday
    };
}
