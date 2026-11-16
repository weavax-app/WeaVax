import { fsActions } from '../firebase-sync.js';
import { wState, EXERCISES_LIST, findExerciseInfo, getUserSavedRoutines } from './workout-state.js';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800';

const DRAFT_SET_BADGES = {
    W:  { bg: 'bg-amber-500/20 border-amber-500/50 text-amber-400', label: 'W' },
    F:  { bg: 'bg-red-500/20 border-red-500/50 text-red-400', label: 'F' },
    L:  { bg: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400', label: 'L' },
    R:  { bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', label: 'R' },
    D:  { bg: 'bg-blue-500/20 border-blue-500/50 text-blue-400', label: 'D' },
    N:  { bg: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400', label: 'N' },
    P:  { bg: 'bg-orange-500/20 border-orange-500/50 text-orange-400', label: 'P' },
    M:  { bg: 'bg-pink-500/20 border-pink-500/50 text-pink-400', label: 'M' },
    FD: { bg: 'bg-lime-500/20 border-lime-500/50 text-lime-400', label: 'FD' },
    T:  { bg: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300', label: 'T' },
    B:  { bg: 'bg-purple-500/20 border-purple-500/50 text-purple-400', label: 'B' }
};

const DRAFT_SET_TYPES = [
    { code: 'W',  label: 'Calentamiento',  badge: 'bg-amber-500/20 border-amber-500/50 text-amber-400',   desc: 'Series ligeras de aproximación para preparar articulaciones y sistema nervioso.' },
    { code: 'F',  label: 'Failure',        badge: 'bg-red-500/20 border-red-500/50 text-red-400',         desc: 'Serie llevada al fallo muscular concéntrico absoluto.' },
    { code: 'L',  label: 'Izquierda',      badge: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',      desc: 'Serie unilateral ejecutada exclusivamente con el lado izquierdo.' },
    { code: 'R',  label: 'Derecha',        badge: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', desc: 'Serie unilateral ejecutada exclusivamente con el lado derecho.' },
    { code: 'D',  label: 'Drop Set',       badge: 'bg-blue-500/20 border-blue-500/50 text-blue-400',      desc: 'Al alcanzar el fallo, reduce inmediatamente el peso un 20-30% sin descanso.' },
    { code: 'N',  label: 'Negative',       badge: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400', desc: 'Énfasis en la fase excéntrica lenta (3 a 5 segundos).' },
    { code: 'P',  label: 'Reps parciales', badge: 'bg-orange-500/20 border-orange-500/50 text-orange-400', desc: 'Repeticiones en rango parcial tras llegar al fallo completo.' },
    { code: 'M',  label: 'Myo Reps',       badge: 'bg-pink-500/20 border-pink-500/50 text-pink-400',      desc: 'Serie de activación seguida de mini-series de 3-5 reps con 10-15s de descanso.' },
    { code: 'FD', label: 'Feeder Set',     badge: 'bg-lime-500/20 border-lime-500/50 text-lime-400',      desc: 'Serie de aclimatación rápida antes de la serie pesada principal.' },
    { code: 'T',  label: 'Top Set',        badge: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300', desc: 'La serie principal más pesada e intensa del ejercicio.' },
    { code: 'B',  label: 'Back-off Set',   badge: 'bg-purple-500/20 border-purple-500/50 text-purple-400', desc: 'Serie posterior al Top Set bajando el peso un 10-20% para volumen.' }
];

// =========================================================================
// SELECTOR UNIFICADO DE EJERCICIOS (ESTILO BANCO DE EJERCICIOS ANDROID)
// =========================================================================
const pickerState = {
    mode: 'DRAFT', // 'DRAFT' | 'ACTIVE_SESSION'
    dayIdx: 0,
    query: '',
    muscle: 'Todos',
    equipment: 'Todos'
};

export function openUnifiedExercisePickerModal(mode, dayIdx = 0) {
    pickerState.mode = mode;
    pickerState.dayIdx = dayIdx;
    pickerState.query = '';
    pickerState.muscle = 'Todos';
    pickerState.equipment = 'Todos';

    const muscles = ['Todos', 'Pecho', 'Espalda', 'Cuádriceps', 'Isquiosurales/Glúteos', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Pantorrillas'];
    const equipments = ['Todos', 'Barra', 'Mancuerna', 'Polea', 'Máquina', 'Corporal'];

    window.openUniversalModal(
        'Seleccionar Ejercicio',
        `
        <div class="space-y-3 text-xs">
            <div class="relative">
                <input id="unified-ex-search" oninput="updateUnifiedPickerFilter('query', this.value)" placeholder="Buscar por nombre (ej. Press banca, Curl, Remo)..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] focus:border-accent outline-none font-medium">
            </div>

            <!-- Filtros por Músculo -->
            <div class="space-y-1">
                <span class="text-[10px] font-bold uppercase text-gray-400">Grupo Muscular</span>
                <div id="unified-muscle-pills" class="flex flex-wrap gap-1.5">
                    ${muscles.map(m => `
                        <button type="button" data-muscle="${m}" onclick="updateUnifiedPickerFilter('muscle', '${m}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${m === 'Todos' ? 'bg-accent text-white' : 'bg-[#0A0A0F] border border-[#28283C] text-gray-400 hover:text-white'}">${m}</button>
                    `).join('')}
                </div>
            </div>

            <!-- Filtros por Equipamiento -->
            <div class="space-y-1">
                <span class="text-[10px] font-bold uppercase text-gray-400">Equipamiento</span>
                <div id="unified-equip-pills" class="flex flex-wrap gap-1.5">
                    ${equipments.map(eq => `
                        <button type="button" data-equip="${eq}" onclick="updateUnifiedPickerFilter('equipment', '${eq}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${eq === 'Todos' ? 'bg-emerald-600 text-white' : 'bg-[#0A0A0F] border border-[#28283C] text-gray-400 hover:text-white'}">${eq}</button>
                    `).join('')}
                </div>
            </div>

            <div class="flex items-center justify-between pt-1 border-t border-[#28283C]">
                <span id="unified-picker-count" class="text-[11px] font-bold text-gray-400">${EXERCISES_LIST.length} ejercicios disponibles</span>
                <button type="button" onclick="resetUnifiedPickerFilters()" class="text-[10px] font-bold text-accent hover:underline">Limpiar filtros</button>
            </div>

            <!-- Lista de resultados -->
            <div id="unified-ex-picker-list" class="max-h-72 overflow-y-auto space-y-2 pr-1">
                ${renderUnifiedPickerList()}
            </div>
        </div>
        `
    );
}

function renderUnifiedPickerList() {
    const term = pickerState.query.toLowerCase().trim();
    const filtered = EXERCISES_LIST.filter(ex => {
        const matchQuery = !term || ex.name.toLowerCase().includes(term) || ex.muscleGroup.toLowerCase().includes(term);
        const matchMuscle = pickerState.muscle === 'Todos' || ex.muscleGroup === pickerState.muscle;
        const matchEquip = pickerState.equipment === 'Todos' || ex.equipment === pickerState.equipment;
        return matchQuery && matchMuscle && matchEquip;
    });

    const countEl = document.getElementById('unified-picker-count');
    if (countEl) countEl.textContent = `${filtered.length} ejercicio${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
        return `<div class="p-6 text-center text-gray-400 text-xs">No se encontraron ejercicios con esos filtros.</div>`;
    }

    return filtered.map(ex => `
        <div onclick="confirmUnifiedExerciseSelection(${ex.id})" class="p-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] hover:border-accent flex items-center justify-between gap-3 cursor-pointer transition-all">
            <div class="flex items-center space-x-3 min-w-0 flex-1">
                <img src="${ex.img}" class="w-11 h-11 rounded-lg bg-white p-0.5 object-contain shrink-0">
                <div class="min-w-0 flex-1">
                    <p class="font-bold text-xs text-white truncate">${ex.name}</p>
                    <div class="flex items-center gap-1.5 mt-1">
                        <span class="px-2 py-0.5 rounded bg-accent/15 text-accent text-[9px] font-extrabold">${ex.muscleGroup}</span>
                        <span class="px-2 py-0.5 rounded bg-[#181824] text-gray-300 text-[9px] font-bold">${ex.equipment}</span>
                    </div>
                </div>
            </div>
            <span class="px-2.5 py-1.5 rounded-lg bg-accent/20 text-accent font-extrabold text-[11px] shrink-0">+ Elegir</span>
        </div>
    `).join('');
}

window.updateUnifiedPickerFilter = (key, val) => {
    pickerState[key] = val;

    if (key === 'muscle') {
        document.querySelectorAll('#unified-muscle-pills button').forEach(btn => {
            const active = btn.getAttribute('data-muscle') === val;
            btn.className = `px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${active ? 'bg-accent text-white' : 'bg-[#0A0A0F] border border-[#28283C] text-gray-400 hover:text-white'}`;
        });
    }
    if (key === 'equipment') {
        document.querySelectorAll('#unified-equip-pills button').forEach(btn => {
            const active = btn.getAttribute('data-equip') === val;
            btn.className = `px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${active ? 'bg-emerald-600 text-white' : 'bg-[#0A0A0F] border border-[#28283C] text-gray-400 hover:text-white'}`;
        });
    }

    const listEl = document.getElementById('unified-ex-picker-list');
    if (listEl) listEl.innerHTML = renderUnifiedPickerList();
};

window.resetUnifiedPickerFilters = () => {
    pickerState.query = '';
    pickerState.muscle = 'Todos';
    pickerState.equipment = 'Todos';
    const input = document.getElementById('unified-ex-search');
    if (input) input.value = '';
    window.updateUnifiedPickerFilter('muscle', 'Todos');
    window.updateUnifiedPickerFilter('equipment', 'Todos');
};

window.confirmUnifiedExerciseSelection = (exId) => {
    if (pickerState.mode === 'ACTIVE_SESSION') {
        if (window.addExerciseToActiveSession) window.addExerciseToActiveSession(exId);
    } else {
        window.addExerciseToDraftDay(pickerState.dayIdx, exId);
    }
};

// =========================================================================
// EDITOR DE RUTINAS Y DÍAS (MISMO FORMATO VISUAL QUE SESIÓN ACTIVA)
// =========================================================================
function ensurePlannedSets(ex) {
    if (!Array.isArray(ex.plannedSets) || ex.plannedSets.length === 0) {
        const count = Math.max(1, Number(ex.targetSets || 3));
        ex.plannedSets = Array.from({ length: count }, (_, i) => ({
            setNumber: i + 1,
            setType: 'NORMAL',
            targetWeight: 0,
            targetReps: ex.targetRepsRange || '8-12'
        }));
    }
    return ex.plannedSets;
}

export function renderRoutineEditorView(container) {
    const draft = wState.routineDraft;
    if (!draft) return;
    const focusDay = draft.focusDayNumber;

    const renderDraftBadge = (st, idx) => {
        const cfg = DRAFT_SET_BADGES[st.setType];
        if (cfg) {
            return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md border ${cfg.bg} text-[11px] font-black">${cfg.label}</span>`;
        }
        return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#0A0A0F] border border-[#28283C] text-white text-xs font-extrabold">${idx + 1}</span>`;
    };

    container.innerHTML = `
        <div class="space-y-6">
            <div class="sticky top-16 z-20 p-4 rounded-2xl bg-[#181824] border border-[#28283C] flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div class="flex items-center space-x-3">
                    <button type="button" onclick="cancelRoutineEditor()" class="px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">✕ Cancelar</button>
                    <div>
                        <h3 class="text-base sm:text-lg font-black">${draft.isEditing ? (focusDay ? `Editar Día ${focusDay}` : 'Editar Programa') : 'Crear Nuevo Programa'}</h3>
                        <p class="text-[11px] text-gray-400">Configura días, ejercicios, series, pesos y reps</p>
                    </div>
                </div>
                <div class="flex gap-2">
                    ${draft.isEditing && !focusDay ? `<button type="button" onclick="deleteSavedRoutine(${draft.id})" class="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">🗑️ Eliminar</button>` : ''}
                    <button type="button" onclick="saveRoutineDraftToFirestore()" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">Guardar</button>
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
                    <div class="space-y-4">
                        <div class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-wrap items-center justify-between gap-3">
                            <div class="flex items-center space-x-3 flex-1 min-w-[220px]">
                                <span class="w-8 h-8 rounded-xl bg-accent/20 text-accent font-black flex items-center justify-center text-xs shrink-0">D${day.dayNumber}</span>
                                <input value="${day.dayName}" oninput="updateDraftDayName(${dIdx}, this.value)" placeholder="Nombre del día" class="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-sm font-extrabold">
                            </div>
                            <div class="flex items-center gap-2">
                                <button type="button" onclick="openDraftExercisePicker(${dIdx})" class="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">+ Añadir Ejercicio</button>
                                ${!focusDay && draft.days.length > 1 ? `<button type="button" onclick="removeDraftDay(${dIdx})" class="px-2.5 py-2 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold">🗑️</button>` : ''}
                            </div>
                        </div>

                        ${(day.exercises || []).length === 0 ? `
                            <div class="p-6 rounded-2xl bg-[#181824] border border-dashed border-[#28283C] text-center">
                                <p class="text-xs text-gray-400">Sin ejercicios. Pulsa <strong>+ Añadir Ejercicio</strong> para elegir del catálogo.</p>
                            </div>
                        ` : day.exercises.map((ex, eIdx) => {
                            const info = findExerciseInfo(ex.exerciseId, ex.exerciseName);
                            const plannedSets = ensurePlannedSets(ex);
                            return `
                                <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                                    <div class="flex flex-wrap items-center justify-between gap-3">
                                        <div class="flex items-center space-x-3.5 min-w-[200px] flex-1">
                                            <div class="flex flex-col space-y-1">
                                                <button type="button" onclick="moveDraftExercise(${dIdx}, ${eIdx}, -1)" class="text-[10px] text-gray-400 hover:text-white leading-none">▲</button>
                                                <button type="button" onclick="moveDraftExercise(${dIdx}, ${eIdx}, 1)" class="text-[10px] text-gray-400 hover:text-white leading-none">▼</button>
                                            </div>
                                            <img src="${info.img}" onclick="showExerciseAnatomyModal(${info.id})" class="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0 cursor-pointer">
                                            <div class="min-w-0">
                                                <h4 onclick="showExerciseAnatomyModal(${info.id})" class="text-sm font-extrabold truncate cursor-pointer hover:text-accent">${ex.exerciseName}</h4>
                                                <p class="text-[11px] text-gray-400">${ex.muscleGroup} · ${ex.equipment}</p>
                                            </div>
                                        </div>
                                        <div class="flex items-center gap-3">
                                            <div class="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs">
                                                <span class="text-gray-400 font-bold">⏱ Descanso:</span>
                                                <input type="number" min="15" max="300" step="15" value="${ex.restSeconds}" oninput="updateDraftExerciseField(${dIdx}, ${eIdx}, 'restSeconds', Number(this.value || 90))" class="w-12 bg-transparent text-center font-extrabold text-accent">
                                                <span class="text-gray-400">s</span>
                                            </div>
                                            <button type="button" onclick="removeDraftExercise(${dIdx}, ${eIdx})" class="text-xs text-gray-500 hover:text-red-400 font-bold">Quitar</button>
                                        </div>
                                    </div>

                                    <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-gray-400 px-2">
                                        <div class="col-span-3">Tipo / Serie</div>
                                        <div class="col-span-3 text-center">Anterior</div>
                                        <div class="col-span-3 text-center">Peso (kg)</div>
                                        <div class="col-span-3 text-center">Reps</div>
                                    </div>

                                    <div class="space-y-2">
                                        ${plannedSets.map((st, sIdx) => `
                                            <div class="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] text-xs">
                                                <div class="col-span-3">
                                                    <button type="button" onclick="openDraftSetTypePicker(${dIdx}, ${eIdx}, ${sIdx})" class="w-full px-2.5 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] hover:border-accent flex items-center justify-between text-xs">
                                                        ${renderDraftBadge(st, sIdx)}<span class="text-[9px] text-gray-400">▼</span>
                                                    </button>
                                                </div>
                                                <div class="col-span-3 text-center text-[11px] font-bold text-gray-500">—</div>
                                                <div class="col-span-3">
                                                    <input type="number" step="0.5" placeholder="0" value="${Number(st.targetWeight || 0) > 0 ? st.targetWeight : ''}" oninput="updateDraftPlannedSetField(${dIdx}, ${eIdx}, ${sIdx}, 'targetWeight', Number(this.value || 0))" class="w-full px-2 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                                </div>
                                                <div class="col-span-3">
                                                    <input type="text" placeholder="8-12" value="${st.targetReps || ex.targetRepsRange || '8-12'}" oninput="updateDraftPlannedSetField(${dIdx}, ${eIdx}, ${sIdx}, 'targetReps', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold">
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>

                                    <div class="flex gap-3 pt-1">
                                        <button type="button" onclick="addDraftPlannedSet(${dIdx}, ${eIdx})" class="text-xs font-bold text-accent">+ Añadir Serie</button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
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

window.openDraftSetTypePicker = (dIdx, eIdx, sIdx) => {
    const ex = wState.routineDraft?.days[dIdx]?.exercises[eIdx];
    if (!ex) return;
    const plannedSets = ensurePlannedSets(ex);
    const cur = plannedSets[sIdx]?.setType || 'NORMAL';

    window.openUniversalModal(
        `Tipo de Serie · Serie ${sIdx + 1} (${ex.exerciseName})`,
        `
        <div class="space-y-3 text-xs">
            <button type="button" onclick="selectDraftSetType(${dIdx}, ${eIdx}, ${sIdx}, 'NORMAL')" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border ${cur === 'NORMAL' ? 'border-accent bg-accent/10' : 'border-[#28283C]'} hover:border-accent flex items-center justify-between">
                <div class="flex items-center space-x-2.5">
                    <span class="w-7 h-7 rounded-lg bg-[#181824] border border-[#28283C] flex items-center justify-center font-black text-white">${sIdx + 1}</span>
                    <span class="font-bold text-gray-200">Serie Normal (Estándar)</span>
                </div>
                ${cur === 'NORMAL' ? '<span class="text-[10px] font-bold text-accent">Activa</span>' : ''}
            </button>

            <div class="grid grid-cols-2 gap-2.5">
                ${DRAFT_SET_TYPES.map(t => `
                    <div onclick="selectDraftSetType(${dIdx}, ${eIdx}, ${sIdx}, '${t.code}')" class="p-2.5 rounded-2xl bg-[#0A0A0F] border ${cur === t.code ? 'border-accent bg-accent/10' : 'border-[#28283C]'} hover:border-accent flex items-center justify-between gap-1.5 cursor-pointer transition-all">
                        <div class="flex items-center space-x-2 min-w-0">
                            <span class="w-7 h-7 rounded-lg border ${t.badge} flex items-center justify-center text-[11px] font-black shrink-0">${t.code}</span>
                            <span class="font-bold text-[11px] text-gray-200 truncate">${t.label}</span>
                        </div>
                        <button type="button" onclick="event.stopPropagation(); showDraftSetHelp('${t.code}')" class="w-5 h-5 rounded-full border border-gray-600 text-gray-400 hover:text-white flex items-center justify-center text-[10px] shrink-0">?</button>
                    </div>
                `).join('')}

                <button type="button" onclick="removeDraftPlannedSet(${dIdx}, ${eIdx}, ${sIdx}, true)" class="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/40 hover:bg-red-500/20 flex items-center space-x-2 text-left transition-all">
                    <span class="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-xs shrink-0">🗑️</span>
                    <span class="font-extrabold text-[11px] text-red-400">Eliminar Serie</span>
                </button>
            </div>
            <div id="draft-set-help-box" class="hidden p-3 rounded-xl bg-[#0A0A0F] border border-accent/40 text-[11px] text-gray-300 leading-relaxed"></div>
        </div>
        `
    );
};

window.showDraftSetHelp = (code) => {
    const item = DRAFT_SET_TYPES.find(t => t.code === code);
    const box = document.getElementById('draft-set-help-box');
    if (!item || !box) return;
    box.classList.remove('hidden');
    box.innerHTML = `<strong class="text-white">${item.code} · ${item.label}:</strong> ${item.desc}`;
};

window.selectDraftSetType = (dIdx, eIdx, sIdx, code) => {
    const ex = wState.routineDraft?.days[dIdx]?.exercises[eIdx];
    if (!ex) return;
    const sets = ensurePlannedSets(ex);
    if (sets[sIdx]) sets[sIdx].setType = code;
    window.closeUniversalModal();
    window.renderWorkouts();
};

window.addDraftPlannedSet = (dIdx, eIdx) => {
    const ex = wState.routineDraft?.days[dIdx]?.exercises[eIdx];
    if (!ex) return;
    const sets = ensurePlannedSets(ex);
    const last = sets[sets.length - 1] || {};
    sets.push({ setNumber: sets.length + 1, setType: 'NORMAL', targetWeight: Number(last.targetWeight || 0), targetReps: last.targetReps || ex.targetRepsRange || '8-12' });
    ex.targetSets = sets.length;
    window.renderWorkouts();
};

window.updateDraftPlannedSetField = (dIdx, eIdx, sIdx, field, val) => {
    const ex = wState.routineDraft?.days[dIdx]?.exercises[eIdx];
    if (!ex) return;
    const sets = ensurePlannedSets(ex);
    if (sets[sIdx]) sets[sIdx][field] = val;
    if (field === 'targetReps' && sIdx === 0) ex.targetRepsRange = val;
};

window.removeDraftPlannedSet = (dIdx, eIdx, sIdx, closeModal = false) => {
    const ex = wState.routineDraft?.days[dIdx]?.exercises[eIdx];
    if (!ex) return;
    const sets = ensurePlannedSets(ex);
    if (sets.length <= 1) {
        alert('Debe quedar al menos 1 serie en el ejercicio.');
        return;
    }
    sets.splice(sIdx, 1);
    sets.forEach((s, i) => { s.setNumber = i + 1; });
    ex.targetSets = sets.length;
    if (closeModal) window.closeUniversalModal();
    window.renderWorkouts();
};

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

window.openDraftExercisePicker = (dIdx) => {
    openUnifiedExercisePickerModal('DRAFT', dIdx);
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
        restSeconds: 90,
        plannedSets: [
            { setNumber: 1, setType: 'W', targetWeight: 0, targetReps: '12-15' },
            { setNumber: 2, setType: 'NORMAL', targetWeight: 0, targetReps: '8-12' },
            { setNumber: 3, setType: 'NORMAL', targetWeight: 0, targetReps: '8-12' },
            { setNumber: 4, setType: 'NORMAL', targetWeight: 0, targetReps: '8-12' }
        ]
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
            const pSets = ensurePlannedSets(ex);
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
                targetSets: pSets.length,
                targetRepsRange: pSets[0]?.targetReps || ex.targetRepsRange || '8-12',
                restSeconds: Number(ex.restSeconds || 90),
                plannedSets: pSets
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
