import * as catalog from './workout-catalog.js';

export const EXERCISES_LIST =
    catalog.EXERCISE_CATALOG ||
    catalog.EXERCISE_DATABASE ||
    [];

export const TEMPLATES_LIST =
    catalog.WEAVAX_30_TEMPLATES ||
    catalog.WORKOUT_CATALOG_TEMPLATES ||
    [];

if (!window.wState) {
    window.wState = {
        subScreen: 'PRINCIPAL', // PRINCIPAL | LIBRERIA_RUTINAS | DETALLE_RUTINA | DETALLE_ENTRENAMIENTO | CREAR_EDITAR_RUTINA | BANCO_EJERCICIOS | HISTORIAL | COACH_IA | SESION_ACTIVA | POR_FINALIZAR | RESUMEN_SESION
        libraryTab: 'MIS_RUTINAS',
        viewMode: 'grid',
        categoryFilter: 'Todas',
        muscleFilter: 'Todos',
        searchQuery: '',
        selectedRoutineId: Number(localStorage.getItem('weavax_primary_routine_id')) || null,
        viewingRoutine: null,
        viewingDayPlan: null,
        routineDraft: null, // Borrador para crear o editar programa y días
        activeSession: null,
        finishDraft: null,
        summaryData: null,
        summarySlideIdx: 0,
        timerInterval: null,
        restSecondsLeft: 0,
        restInterval: null
    };
}

export const wState = window.wState;

export function findExerciseInfo(exerciseId, fallbackName = '') {
    const byId = EXERCISES_LIST.find(e => Number(e.id) === Number(exerciseId));
    if (byId) return byId;
    if (fallbackName) {
        const byName = EXERCISES_LIST.find(e => e.name.toLowerCase() === fallbackName.toLowerCase());
        if (byName) return byName;
    }
    return {
        id: exerciseId || 1,
        name: fallbackName || 'Ejercicio',
        muscleGroup: 'General',
        equipment: 'Barra',
        img: 'https://lyfta.app/images/exercises/00251101.png'
    };
}

function normalizeRoutineDays(r) {
    if (Array.isArray(r.days) && r.days.length > 0) {
        return r.days.map((d, idx) => ({
            dayNumber: Number(d.dayNumber || idx + 1),
            dayName: d.dayName || d.name || `Día ${idx + 1}`,
            dayImageUri: d.dayImageUri || r.imageUri || '',
            exercises: Array.isArray(d.exercises) ? d.exercises : []
        }));
    }
    // Reconstruir días desde la lista plana `exercises` si viene así desde Android Room/Firestore
    if (Array.isArray(r.exercises) && r.exercises.length > 0) {
        const grouped = {};
        r.exercises.forEach(ex => {
            const dn = Number(ex.dayNumber || 1);
            if (!grouped[dn]) {
                grouped[dn] = {
                    dayNumber: dn,
                    dayName: ex.dayName || `Día ${dn}`,
                    dayImageUri: ex.dayImageUri || r.imageUri || '',
                    exercises: []
                };
            }
            grouped[dn].exercises.push(ex);
        });
        return Object.values(grouped).sort((a, b) => a.dayNumber - b.dayNumber);
    }
    return [{
        dayNumber: 1,
        dayName: r.focusCategory || 'Entrenamiento General',
        dayImageUri: r.imageUri || '',
        exercises: []
    }];
}

export function getUserSavedRoutines() {
    return (window.state.workout_routines || [])
        .filter(r => !r.isSystemTemplate)
        .map(r => ({
            ...r,
            id: Number(r.id || r.docId),
            isCustom: true,
            days: normalizeRoutineDays(r)
        }));
}

export function getAllRoutinesAndTemplates() {
    const userRoutines = getUserSavedRoutines();
    const templates = TEMPLATES_LIST.map(t => ({
        ...t,
        id: Number(t.id),
        days: normalizeRoutineDays(t)
    }));
    return [...userRoutines, ...templates];
}

export function getActiveMainRoutine() {
    const userRoutines = getUserSavedRoutines();
    if (userRoutines.length > 0) {
        const cloudId = Number(window.state.profile?.primaryRoutineId || 0);
        const localId = Number(wState.selectedRoutineId || localStorage.getItem('weavax_primary_routine_id') || 0);
        const targetId = cloudId || localId;

        if (targetId > 0) {
            const found = userRoutines.find(r => Number(r.id) === targetId);
            if (found) return found;
        }
        return userRoutines[0];
    }
    const all = getAllRoutinesAndTemplates();
    return all[0] || null;
}

export function getCompletedSessionsList() {
    return (window.state.workout_sessions || [])
        .filter(s => s.isCompleted !== false && s.isCompleted !== 0)
        .sort((a, b) => Number(b.startedAt || 0) - Number(a.startedAt || 0));
}

export function getTodayScheduledWorkoutInfo() {
    const mainR = getActiveMainRoutine();
    if (!mainR || !mainR.days || mainR.days.length === 0) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sessions = getCompletedSessionsList();

    const doneToday = sessions.some(s => Number(s.startedAt || 0) >= startOfToday);
    const completedForRoutine = sessions.filter(s => String(s.routineId) === String(mainR.id)).length;
    const dayIdx = completedForRoutine % mainR.days.length;
    const nextDay = mainR.days[dayIdx] || mainR.days[0];

    return {
        routineId: mainR.id,
        routineName: mainR.name || 'Rutina Activa',
        dayNumber: nextDay.dayNumber || (dayIdx + 1),
        dayName: nextDay.dayName || `Día ${dayIdx + 1}`,
        exercisesCount: (nextDay.exercises || []).length,
        estimatedMin: Math.max(25, (nextDay.exercises || []).length * 10),
        doneToday
    };
}

export function getWeeklyWorkoutStats() {
    const now = new Date();
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (dayOfWeek - 1)).getTime();
    const sessions = getCompletedSessionsList().filter(s => Number(s.startedAt || 0) >= monday);

    return {
        count: sessions.length,
        volume: sessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0),
        minutes: Math.round(sessions.reduce((acc, s) => acc + Number(s.durationSeconds || 0), 0) / 60),
        sessions
    };
}
