import { fsActions } from '../firebase-sync.js';
import { wState, EXERCISES_LIST, findExerciseInfo, getUserSavedRoutines } from './workout-state.js';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800';

export function renderRoutineEditorView(container) {
    const draft = wState.routineDraft;
    if (!draft) return;
    const focusDay = draft.focusDayNumber;

    container.innerHTML = `
        <div class="space-y-6">
            <div class="sticky top-16 z-20 p-4 rounded-2xl bg-[#181824] border border-[#28283C] flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div class="flex items-center space-x-3">
                    <button type="button" onclick="cancelRoutineEditor()" class="px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">✕ Cancelar</button>
                    <div>
                        <h3 class="text-base sm:text-lg font-black">${draft.isEditing ? (focusDay ? `Editar Día ${focusDay}` : 'Editar Programa') : 'Crear Nuevo Programa'}</h3>
                        <p class="text-[11px] text-gray-400">Configura días, ejercicios, series, reps y descanso</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    ${draft.isEditing && !focusDay ? `<button type="button" onclick="deleteSavedRoutine(${draft.id})" class="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">🗑️ Eliminar</button>` : ''}
                    <button type="button" onclick="saveRoutineDraftToFirestore()" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">Guardar Programa</button>
                </div>
            </div>

            ${!focusDay ? `
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4 text-xs">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-bold uppercase text-gray-400">Nombre del Programa</label>
                            <input value="${draft.name}" oninput="updateDraftField('name', this.value)" placeholder="Ej. Push Pull Legs Hipertrofia" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] font-bold">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[10px] font-bold uppercase text-gray-400">Enfoque</label>
                                <select onchange="updateDraftField('focusCategory', this.value)" class="mt-1 w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] font-bold">
                                    ${['Hipertrofia', 'Fuerza', 'Calistenia', 'Resistencia', 'Funcional'].map(f => `<option value="${f}" ${draft.focusCategory === f ? 'selected' : ''}>${f}</option>`).join('')}
                                </select>
                            </div>
                            <div>
                                <label class="text-[10px] font-bold uppercase text-gray-400">Duración Est. (min)</label>
                                <input type="number" min="15" max="180" value="${draft.estimatedDurationMinutes}" oninput="updateDraftField('estimatedDurationMinutes', Number(this.value || 60))" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] font-bold">
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] font-bold uppercase text-gray-400">Descripción</label>
                            <input value="${draft.description}" oninput="updateDraftField('description', this.value)" placeholder="Objetivo o notas..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        </div>
                        <div>
                            <label class="text-[10px] font-bold uppercase text-gray-400">URL Imagen de Portada</label>
                            <input value="${draft.imageUri}" oninput="updateDraftField('imageUri', this.value)" placeholder="https://..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="space-y-5">
                ${draft.days
                    .map((day, dIdx) => ({ day, dIdx }))
                    .filter(({ day }) => !focusDay || Number(day.dayNumber) === Number(focusDay))
                    .map(({ day, dIdx }) => `
                    <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 dark:border-[#28283C] pb-4">
                            <div class="flex items-center space-x-3 flex-1 min-w-[220px]">
                                <span class="w-8 h-8 rounded-xl bg-accent/20 text-accent font-black flex items-center justify-center text-xs shrink-0">D${day.dayNumber}</span>
                                <input value="${day.dayName}" oninput="updateDraftDayName(${dIdx}, this.value)" placeholder="Nombre del día" class="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-sm font-extrabold">
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="openDraftExercisePicker(${dIdx})" class="px-3.5 py-2 rounded-xl bg-accent/15 text-accent hover:bg-accent hover:text-white text-xs font-extrabold transition-all">+ Añadir Ejercicio</button>
                                ${!focusDay && draft.days.length > 1 ? `<button type="button" onclick="removeDraftDay(${dIdx})" class="px-2.5 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold">🗑️</button>` : ''}
                            </div>
                        </div>

                        ${(day.exercises || []).length === 0 ? `
                            <div class="p-6 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-dashed border-[#28283C] text-center">
                                <p class="text-xs text-gray-400">Sin ejercicios. Pulsa <strong>+ Añadir Ejercicio</strong> para elegir del catálogo.</p>
                            </div>
                        ` : `
                            <div class="space-y-2.5">
                                ${day.exercises.map((ex, eIdx) => {
                                    const info = findExerciseInfo(ex.exerciseId, ex.exerciseName);
                                    return `
                                        <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex flex-wrap items-center justify-between gap-3">
                                            <div class="flex items-center space-x-3 min-w-[200px] flex-1">
                                                <div class="flex flex-col space-y-1">
                                                    <button type="button" onclick="moveDraftExercise(${dIdx},${eIdx}, -1)" class="text-[10px] text-gray-400 hover:text-white leading-none">▲</button>
                                                    <button type="button" onclick="moveDraftExercise(${dIdx},${eIdx}, 1)" class="text-[10px] text-gray-400 hover:text-white leading-none">▼</button>
                                                </div>
                                                <img src="${info.img}" class="w-11 h-11 rounded-xl object-contain bg-white p-1 shrink-0">
                                                <div class="min-w-0">
                                                    <p class="text-xs font-extrabold truncate">${ex.exerciseName}</p>
                                                    <p class="text-[10px] text-gray-400">${ex.muscleGroup} ·${ex.equipment}</p>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2 text-xs">
                                                <div class="w-16">
                                                    <span class="text-[9px] text-gray-400 uppercase block text-center">Series</span>
                                                    <input type="number" min="1" max="15" value="${ex.targetSets}" oninput="updateDraftExerciseField(${dIdx},${eIdx}, 'targetSets', Number(this.value || 3))" class="w-full px-2 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                                </div>
                                                <div class="w-20">
                                                    <span class="text-[9px] text-gray-400 uppercase block text-center">Reps</span>
                                                    <input value="${ex.targetRepsRange}" oninput="updateDraftExerciseField(${dIdx},${eIdx}, 'targetRepsRange', this.value)" class="w-full px-2 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                                </div>
                                                <div class="w-20">
                                                    <span class="text-[9px] text-gray-400 uppercase block text-center">Desc (s)</span>
                                                    <input type="number" min="15" max="300" step="15" value="${ex.restSeconds}" oninput="updateDraftExerciseField(${dIdx},${eIdx}, 'restSeconds', Number(this.value || 90))" class="w-full px-2 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                                </div>
                                                <button type="button" onclick="removeDraftExercise(${dIdx},${eIdx})" class="p-2 text-gray-400 hover:text-red-400">✕</button>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        `}
                    </div>
                `).join('')}

                ${!focusDay ? `
                    <button type="button" onclick="addDraftDay()" class="w-full py-3.5 rounded-2xl border-2 border-dashed border-accent/50 hover:border-accent text-accent text-xs font-extrabold transition-all">
                        + Agregar Día de Entrenamiento al Programa
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

window.openRoutineCreatorModal = () => window.openRoutineEditor(null, null);

window.openRoutineEditor = (routineId = null, focusDayNumber = null) => {
    const existing = routineId ? getUserSavedRoutines().find(r => Number(r.id) === Number(routineId)) : null;
    if (existing) {
        wState.routineDraft = {
            id: Number(existing.id),
            isEditing: true,
            focusDayNumber: focusDayNumber ? Number(focusDayNumber) : null,
            name: existing.name || 'Mi Rutina',
            description: existing.description || '',
            focusCategory: existing.focusCategory || 'Hipertrofia',
            estimatedDurationMinutes: Number(existing.estimatedDurationMinutes || 60),
            imageUri: existing.imageUri || DEFAULT_COVER,
            days: JSON.parse(JSON.stringify(existing.days || []))
        };
    } else {
        wState.routineDraft = {
            id: Date.now(),
            isEditing: false,
            focusDayNumber: null,
            name: '',
            description: '',
            focusCategory: 'Hipertrofia',
            estimatedDurationMinutes: 60,
            imageUri: DEFAULT_COVER,
            days: [{ dayNumber: 1, dayName: 'Día 1: Entrenamiento A', dayImageUri: DEFAULT_COVER, exercises: [] }]
        };
    }
    wState.subScreen = 'CREAR_EDITAR_RUTINA';
    window.renderWorkouts();
};

window.cancelRoutineEditor = () => {
    const draft = wState.routineDraft;
    wState.routineDraft = null;
    if (draft?.isEditing && draft?.focusDayNumber && wState.viewingDayPlan) wState.subScreen = 'DETALLE_ENTRENAMIENTO';
    else if (draft?.isEditing && wState.viewingRoutine) wState.subScreen = 'DETALLE_RUTINA';
    else wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};

window.updateDraftField = (field, val) => { if (wState.routineDraft) wState.routineDraft[field] = val; };
window.updateDraftDayName = (dIdx, val) => { if (wState.routineDraft?.days[dIdx]) wState.routineDraft.days[dIdx].dayName = val; };

window.addDraftDay = () => {
    if (!wState.routineDraft) return;
    const nextNum = wState.routineDraft.days.length + 1;
    wState.routineDraft.days.push({ dayNumber: nextNum, dayName: `Día ${nextNum}: Entrenamiento`, dayImageUri: wState.routineDraft.imageUri || DEFAULT_COVER, exercises: [] });
    window.renderWorkouts();
};

window.removeDraftDay = (dIdx) => {
    if (!wState.routineDraft || wState.routineDraft.days.length <= 1) return;
    wState.routineDraft.days.splice(dIdx, 1);
    wState.routineDraft.days.forEach((d, idx) => { d.dayNumber = idx + 1; });
    window.renderWorkouts();
};

function renderDraftPickerItems(list, dIdx) {
    return list.map(ex => `
        <button type="button" onclick="addExerciseToDraftDay(${dIdx}, ${ex.id})" class="w-full p-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] hover:border-accent flex items-center space-x-3 text-left">
            <img src="${ex.img}" class="w-10 h-10 rounded-lg bg-white p-0.5 object-contain shrink-0">
            <div class="min-w-0 flex-1">
                <p class="font-bold truncate">${ex.name}</p>
                <p class="text-[10px] text-gray-400">${ex.muscleGroup} · ${ex.equipment}</p>
            </div>
            <span class="text-accent font-extrabold text-xs">+ Añadir</span>
        </button>
    `).join('');
}

window.openDraftExercisePicker = (dIdx) => {
    window.openUniversalModal('Seleccionar Ejercicio', `
        <div class="space-y-3 text-xs">
            <input oninput="filterModalExercisePicker(this.value, ${dIdx})" placeholder="Buscar ejercicio o músculo..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div id="draft-ex-picker-list" class="max-h-80 overflow-y-auto space-y-2">${renderDraftPickerItems(EXERCISES_LIST, dIdx)}</div>
        </div>
    `);
};

window.filterModalExercisePicker = (q, dIdx) => {
    const term = (q || '').toLowerCase();
    const filtered = EXERCISES_LIST.filter(e => e.name.toLowerCase().includes(term) || e.muscleGroup.toLowerCase().includes(term));
    const box = document.getElementById('draft-ex-picker-list');
    if (box) box.innerHTML = renderDraftPickerItems(filtered, dIdx);
};

window.addExerciseToDraftDay = (dIdx, exId) => {
    const day = wState.routineDraft?.days[dIdx];
    if (!day) return;
    const info = findExerciseInfo(exId);
    day.exercises.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        exerciseId: info.id,
        exerciseName: info.name,
        muscleGroup: info.muscleGroup,
        equipment: info.equipment,
        imageUri: info.img,
        orderIndex: day.exercises.length,
        targetSets: 4,
        targetRepsRange: '8-12',
        restSeconds: 90
    });
    window.closeUniversalModal();
    window.renderWorkouts();
};

window.updateDraftExerciseField = (dIdx, eIdx, field, val) => {
    const ex = wState.routineDraft?.days[dIdx]?.exercises[eIdx];
    if (ex) ex[field] = val;
};

window.removeDraftExercise = (dIdx, eIdx) => {
    const day = wState.routineDraft?.days[dIdx];
    if (!day) return;
    day.exercises.splice(eIdx, 1);
    day.exercises.forEach((ex, i) => { ex.orderIndex = i; });
    window.renderWorkouts();
};

window.moveDraftExercise = (dIdx, eIdx, delta) => {
    const list = wState.routineDraft?.days[dIdx]?.exercises;
    if (!list) return;
    const target = eIdx + delta;
    if (target < 0 || target >= list.length) return;
    [list[eIdx], list[target]] = [list[target], list[eIdx]];
    list.forEach((ex, i) => { ex.orderIndex = i; });
    window.renderWorkouts();
};

window.saveRoutineDraftToFirestore = async () => {
    const draft = wState.routineDraft;
    if (!draft) return;
    const cleanName = (draft.name || '').trim() || 'Mi Rutina Personalizada';
    const flatExercises = [];
    const cleanDays = draft.days.map((d, dIdx) => {
        const dayNum = dIdx + 1;
        const dayExs = (d.exercises || []).map((ex, eIdx) => {
            const norm = {
                id: Number(ex.id || (eIdx + 1)),
                routineId: Number(draft.id),
                dayNumber: dayNum,
                dayName: d.dayName || `Día ${dayNum}`,
                dayImageUri: d.dayImageUri || draft.imageUri || DEFAULT_COVER,
                exerciseId: Number(ex.exerciseId),
                exerciseName: ex.exerciseName,
                muscleGroup: ex.muscleGroup,
                equipment: ex.equipment,
                orderIndex: eIdx,
                targetSets: Number(ex.targetSets || 3),
                targetRepsRange: ex.targetRepsRange || '8-12',
                restSeconds: Number(ex.restSeconds || 90)
            };
            flatExercises.push(norm);
            return norm;
        });
        return { dayNumber: dayNum, dayName: d.dayName || `Día ${dayNum}`, dayImageUri: d.dayImageUri || draft.imageUri || DEFAULT_COVER, exercises: dayExs };
    });

    const payload = {
        id: Number(draft.id),
        name: cleanName,
        description: (draft.description || '').trim(),
        focusCategory: draft.focusCategory || 'Hipertrofia',
        targetDaysPerWeek: cleanDays.length,
        estimatedDurationMinutes: Number(draft.estimatedDurationMinutes || 60),
        isSystemTemplate: false,
        imageUri: (draft.imageUri || '').trim() || DEFAULT_COVER,
        days: cleanDays,
        exercises: flatExercises
    };

    await fsActions.setItem('workout_routines', Number(draft.id), payload);

    if (!draft.isEditing) {
        wState.selectedRoutineId = Number(draft.id);
        localStorage.setItem('weavax_primary_routine_id', String(draft.id));
        if (window.state.activeUserDocId) await fsActions.updateProfile({ primaryRoutineId: Number(draft.id) });
    }

    wState.routineDraft = null;
    wState.viewingRoutine = { ...payload, isCustom: true };
    wState.subScreen = 'DETALLE_RUTINA';
    window.renderWorkouts();
};

window.deleteSavedRoutine = async (routineId) => {
    if (!confirm('¿Eliminar esta rutina de Firestore?')) return;
    await fsActions.removeItem('workout_routines', String(routineId));
    wState.routineDraft = null;
    wState.viewingRoutine = null;
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};
