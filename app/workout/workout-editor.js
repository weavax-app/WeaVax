import { fsActions } from '../firebase-sync.js';
import {
    wState,
    EXERCISES_LIST,
    findExerciseInfo,
    getAllRoutinesAndTemplates
} from './workout-state.js';

const SUPERSET_COLORS = [
    { id: 'SS_1', label: 'Superserie A', badge: 'bg-[#8B5CF6]/20 border-[#8B5CF6] text-[#8B5CF6]' },
    { id: 'SS_2', label: 'Superserie B', badge: 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]' },
    { id: 'SS_3', label: 'Superserie C', badge: 'bg-amber-500/20 border-amber-500 text-amber-400' },
    { id: 'SS_4', label: 'Superserie D', badge: 'bg-cyan-500/20 border-cyan-500 text-cyan-400' }
];

const EDITOR_SET_TYPES = [
    { code: 'NORMAL',  short: '#',  label: 'Normal',      style: 'bg-[#0A0A0C] border-[#1F1F26] text-white' },
    { code: 'WARMUP',  short: 'W',  label: 'Calent.',     style: 'bg-amber-500/20 border-amber-500/50 text-amber-400' },
    { code: 'DROPSET', short: 'D',  label: 'Drop Set',    style: 'bg-blue-500/20 border-blue-500/50 text-blue-400' },
    { code: 'FAILURE', short: 'F',  label: 'Al Fallo',    style: 'bg-amber-600/25 border-amber-400 text-amber-300' }
];

let dragSourceExIdx = null;
let pickerContext = { mode: 'EDITOR', dayIdx: 0, replaceExIdx: null, search: '', muscle: 'Todos' };

function ensureExerciseSetsNormalized(ex) {
    if (Array.isArray(ex.plannedSets) && ex.plannedSets.length > 0) {
        ex.setTypesCsv = ex.plannedSets.map(s => s.setType || 'NORMAL').join(',');
        ex.targetSets = ex.plannedSets.length;
        return;
    }
    const csvTypes = String(ex.setTypesCsv || '').split(',').map(s => s.trim()).filter(Boolean);
    const count = Math.max(1, csvTypes.length || Number(ex.targetSets || 3));
    ex.plannedSets = Array.from({ length: count }, (_, i) => ({
        setNumber: i + 1,
        setType: csvTypes[i] || 'NORMAL',
        targetWeight: Number(ex.targetWeight || 0),
        targetReps: String(ex.targetRepsRange || '8-12')
    }));
    ex.setTypesCsv = ex.plannedSets.map(s => s.setType).join(',');
    ex.targetSets = ex.plannedSets.length;
}

window.openRoutineCreatorModal = () => {
    window.openUniversalModal('✨ Nueva Rutina Personalizada', `
        <form onsubmit="createBlankRoutineDraft(event)" class="space-y-3 text-xs">
            <input id="nr-name" required placeholder="Nombre de la rutina (ej. Upper / Lower Hypertrophy)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
            <input id="nr-desc" placeholder="Descripción u objetivo (Opcional)" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
            <div class="grid grid-cols-2 gap-2">
                <select id="nr-focus" class="px-3 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
                    <option value="Hipertrofia">Hipertrofia</option>
                    <option value="Fuerza">Fuerza</option>
                    <option value="Definición">Definición</option>
                    <option value="Calistenia">Calistenia</option>
                </select>
                <select id="nr-days" class="px-3 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
                    <option value="2">2 días / semana</option>
                    <option value="3">3 días / semana</option>
                    <option value="4" selected>4 días / semana</option>
                    <option value="5">5 días / semana</option>
                    <option value="6">6 días / semana</option>
                </select>
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Abrir Editor de Rutina →</button>
        </form>
    `);
};

window.createBlankRoutineDraft = (e) => {
    e.preventDefault();
    const daysCount = Number(document.getElementById('nr-days').value || 4);
    wState.editingRoutine = {
        id: Date.now(),
        name: document.getElementById('nr-name').value.trim(),
        description: document.getElementById('nr-desc').value.trim(),
        focusCategory: document.getElementById('nr-focus').value,
        targetDaysPerWeek: daysCount,
        estimatedDurationMinutes: 60,
        isCustom: true,
        isSystemTemplate: false,
        days: Array.from({ length: daysCount }, (_, i) => ({
            dayNumber: i + 1,
            dayName: `Día ${i + 1}`,
            exercises: []
        }))
    };
    wState.editingDayIndex = 0;
    window.closeUniversalModal();
    wState.subScreen = 'CREAR_EDITAR_RUTINA';
    window.renderWorkouts();
};

window.openRoutineEditor = (routineId, targetDayNumber = null) => {
    const found = getAllRoutinesAndTemplates().find(r => Number(r.id) === Number(routineId));
    if (!found) return;
    wState.editingRoutine = JSON.parse(JSON.stringify(found));
    (wState.editingRoutine.days || []).forEach(d => {
        (d.exercises || []).forEach((ex, idx) => {
            ex.orderIndex = idx;
            ex.weightUnit = ex.weightUnit || 'KG';
            ensureExerciseSetsNormalized(ex);
        });
    });

    const dIdx = targetDayNumber
        ? Math.max(0, (wState.editingRoutine.days || []).findIndex(d => Number(d.dayNumber) === Number(targetDayNumber)))
        : 0;
    wState.editingDayIndex = dIdx;
    wState.subScreen = 'CREAR_EDITAR_RUTINA';
    window.renderWorkouts();
};

export function renderRoutineEditorView(container) {
    const r = wState.editingRoutine;
    if (!r) return;
    const days = r.days || [];
    const dayIdx = Math.min(wState.editingDayIndex || 0, Math.max(0, days.length - 1));
    const activeDay = days[dayIdx];

    if (activeDay) {
        (activeDay.exercises || []).forEach((ex, idx) => {
            ex.orderIndex = idx;
            ex.weightUnit = ex.weightUnit || 'KG';
            ensureExerciseSetsNormalized(ex);
        });
    }

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Barra superior de guardado -->
            <div class="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] text-xs font-bold text-white">← Cancelar</button>
                <div class="flex gap-2">
                    <button type="button" onclick="addDayToEditingRoutine()" class="px-3.5 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-bold text-white">+ Añadir Día</button>
                    <button type="button" onclick="saveEditedRoutineToFirestore()" class="px-5 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold shadow-lg">💾 Guardar Programa</button>
                </div>
            </div>

            <!-- Metadatos del Programa -->
            <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Nombre del Programa</label>
                    <input value="${r.name || ''}" oninput="wState.editingRoutine.name = this.value" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-bold">
                </div>
                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400">Descripción</label>
                    <input value="${r.description || ''}" oninput="wState.editingRoutine.description = this.value" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
                </div>
            </div>

            <!-- Pestañas de Días -->
            <div class="flex flex-wrap gap-2">
                ${days.map((d, idx) => `
                    <button type="button" onclick="selectEditorDayTab(${idx})" class="px-4 py-2 rounded-xl text-xs font-extrabold ${idx === dayIdx ? 'bg-[#8B5CF6] text-white' : 'bg-[#121216] border border-[#1F1F26] text-gray-400'}">
                        ${d.dayName || `Día ${idx + 1}`}
                    </button>
                `).join('')}
            </div>

            ${activeDay ? `
                <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-4">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#1F1F26] pb-4">
                        <div class="flex-1 min-w-[220px]">
                            <label class="text-[10px] font-bold uppercase text-gray-400">Nombre del Día (Arrastra tarjetas para reordenar)</label>
                            <input value="${activeDay.dayName || ''}" oninput="updateEditorDayName(${dayIdx}, this.value)" class="mt-1 w-full px-3.5 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-extrabold text-sm">
                        </div>
                        <div class="flex gap-2">
                            ${days.length > 1 ? `<button type="button" onclick="removeDayFromEditingRoutine(${dayIdx})" class="px-3 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-amber-400 text-xs font-bold">Eliminar Día</button>` : ''}
                            <button type="button" onclick="openUnifiedExercisePickerModal('EDITOR', ${dayIdx})" class="px-4 py-2 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold">+ Agregar Ejercicio</button>
                        </div>
                    </div>

                    <div class="space-y-3" id="editor-exercises-list">
                        ${(activeDay.exercises || []).length === 0 ? `
                            <p class="text-xs text-gray-400 text-center py-6">Este día aún no tiene ejercicios. Pulsa "+ Agregar Ejercicio".</p>
                        ` : (activeDay.exercises || []).map((ex, exIdx) => {
                            const cat = findExerciseInfo(ex.exerciseId, ex.exerciseName);
                            const ssCfg = SUPERSET_COLORS.find(s => s.id === ex.supersetId);
                            const unit = ex.weightUnit || 'KG';
                            return `
                                <div draggable="true"
                                     ondragstart="handleEditorExDragStart(event, ${exIdx})"
                                     ondragover="handleEditorExDragOver(event)"
                                     ondrop="handleEditorExDrop(event, ${dayIdx}, ${exIdx})"
                                     class="p-4 rounded-2xl bg-[#0A0A0C] border ${ssCfg ? 'border-[#8B5CF6]/70' : 'border-[#1F1F26]'} hover:border-[#8B5CF6]/50 space-y-3 cursor-grab active:cursor-grabbing transition-all">

                                    <div class="flex items-center justify-between gap-3">
                                        <div class="flex items-center space-x-3 min-w-0">
                                            <img src="${cat.img}" class="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0 pointer-events-none">
                                            <div class="min-w-0">
                                                <div class="flex flex-wrap items-center gap-1.5">
                                                    <h5 class="text-sm font-extrabold text-white truncate">${ex.exerciseName}</h5>
                                                    ${ssCfg ? `<span class="px-2 py-0.5 rounded-md border ${ssCfg.badge} text-[10px] font-black">${ssCfg.label}</span>` : ''}
                                                    <span class="px-1.5 py-0.5 rounded bg-[#121216] border border-[#1F1F26] text-[10px] font-bold text-gray-300">${unit}</span>
                                                </div>
                                                <p class="text-[11px] text-gray-400 mt-0.5">${ex.muscleGroup} · Descanso ${ex.restSeconds || 90}s</p>
                                            </div>
                                        </div>

                                        <!-- Menú de 3 puntos unificado -->
                                        <button type="button" onclick="openUnifiedExerciseMenuModal('EDITOR', ${dayIdx}, ${exIdx})" class="w-9 h-9 rounded-xl bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] text-white font-black flex items-center justify-center shrink-0" title="Opciones del ejercicio">⋮</button>
                                    </div>

                                    <!-- Tabla de series con selector de tipo persistente (WARMUP, NORMAL, DROPSET, FAILURE) -->
                                    <div class="space-y-1.5" style="font-variant-numeric: tabular-nums;">
                                        <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-gray-400 px-1">
                                            <div class="col-span-4">Tipo de Serie</div>
                                            <div class="col-span-3 text-center">Peso (${unit})</div>
                                            <div class="col-span-3 text-center">Reps Obj.</div>
                                            <div class="col-span-2 text-center">Quitar</div>
                                        </div>
                                        ${(ex.plannedSets || []).map((ps, sIdx) => {
                                            const stCfg = EDITOR_SET_TYPES.find(t => t.code === ps.setType) || EDITOR_SET_TYPES[0];
                                            return `
                                                <div class="grid grid-cols-12 gap-2 items-center text-xs">
                                                    <div class="col-span-4">
                                                        <select onchange="updateEditorSetType(${dayIdx}, ${exIdx}, ${sIdx}, this.value)" class="w-full px-2 py-1.5 rounded-lg border ${stCfg.style} text-[11px] font-extrabold">
                                                            ${EDITOR_SET_TYPES.map(opt => `<option value="${opt.code}" ${ps.setType === opt.code ? 'selected' : ''}>${opt.short === '#' ? `#${sIdx + 1}` : opt.short} · ${opt.label}</option>`).join('')}
                                                        </select>
                                                    </div>
                                                    <div class="col-span-3">
                                                        <input type="number" step="0.5" onfocus="this.select()" value="${ps.targetWeight || ''}" placeholder="0" oninput="updateEditorSetField(${dayIdx}, ${exIdx}, ${sIdx}, 'targetWeight', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#121216] border border-[#1F1F26] text-center text-white font-bold">
                                                    </div>
                                                    <div class="col-span-3">
                                                        <input type="text" onfocus="this.select()" value="${ps.targetReps || '8-12'}" oninput="updateEditorSetField(${dayIdx}, ${exIdx}, ${sIdx}, 'targetReps', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#121216] border border-[#1F1F26] text-center text-white font-bold">
                                                    </div>
                                                    <div class="col-span-2 flex justify-center">
                                                        <button type="button" onclick="removeEditorPlannedSet(${dayIdx}, ${exIdx}, ${sIdx})" class="text-gray-400 hover:text-amber-400 text-xs font-bold">✕</button>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>

                                    <div class="flex items-center justify-between pt-1">
                                        <button type="button" onclick="addEditorPlannedSet(${dayIdx}, ${exIdx}, 'NORMAL')" class="text-xs font-extrabold text-[#8B5CF6]">+ Añadir Serie</button>
                                        <div class="flex items-center space-x-2 text-[11px] text-gray-400">
                                            <span>Descanso (s):</span>
                                            <input type="number" step="15" onfocus="this.select()" value="${ex.restSeconds || 90}" onchange="wState.editingRoutine.days[${dayIdx}].exercises[${exIdx}].restSeconds = Number(this.value || 90)" class="w-16 px-2 py-1 rounded-lg bg-[#121216] border border-[#1F1F26] text-center text-white font-bold">
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// Drag & Drop directo sobre tarjetas
window.handleEditorExDragStart = (e, exIdx) => {
    dragSourceExIdx = exIdx;
    e.dataTransfer.effectAllowed = 'move';
};
window.handleEditorExDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
};
window.handleEditorExDrop = (e, dayIdx, targetExIdx) => {
    e.preventDefault();
    if (dragSourceExIdx === null || dragSourceExIdx === targetExIdx) return;
    const list = wState.editingRoutine.days[dayIdx].exercises;
    const [moved] = list.splice(dragSourceExIdx, 1);
    list.splice(targetExIdx, 0, moved);
    list.forEach((item, idx) => { item.orderIndex = idx; });
    dragSourceExIdx = null;
    window.renderWorkouts();
};

// Menú Unificado de 3 Puntos (Compartido por Editor, Detalle y Sesión Activa)
window.openUnifiedExerciseMenuModal = (context, dayIdx, exIdx) => {
    const ex = context === 'ACTIVE_SESSION'
        ? wState.activeSession?.exercises?.[exIdx]
        : wState.editingRoutine?.days?.[dayIdx]?.exercises?.[exIdx];
    if (!ex) return;

    const currentUnit = ex.weightUnit || 'KG';
    const nextUnit = currentUnit === 'KG' ? 'LBS' : 'KG';
    const hasSuperset = Boolean(ex.supersetId);

    window.openUniversalModal(`⋮ ${ex.exerciseName}`, `
        <div class="space-y-2 text-xs">
            <button type="button" onclick="execUnifiedExAction('${context}', ${dayIdx}, ${exIdx}, 'ADD_WARMUP')" class="w-full p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-amber-500/50 text-left flex items-center justify-between">
                <span class="font-bold text-amber-400">🔥 Añadir serie de calentamiento (W)</span>
                <span class="text-[10px] text-gray-400">Al inicio</span>
            </button>

            <button type="button" onclick="execUnifiedExAction('${context}', ${dayIdx}, ${exIdx}, 'TOGGLE_SUPERSET')" class="w-full p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-left flex items-center justify-between">
                <span class="font-bold text-[#8B5CF6]">🔗 ${hasSuperset ? 'Quitar de Superserie' : 'Agrupar en Superserie'}</span>
                <span class="text-[10px] text-gray-400">${ex.supersetId || 'Sin grupo'}</span>
            </button>

            <button type="button" onclick="execUnifiedExAction('${context}', ${dayIdx}, ${exIdx}, 'REPLACE')" class="w-full p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-left flex items-center justify-between">
                <span class="font-bold text-white">🔄 Reemplazar ejercicio</span>
                <span class="text-[10px] text-gray-400">Catálogo</span>
            </button>

            <button type="button" onclick="execUnifiedExAction('${context}', ${dayIdx}, ${exIdx}, 'TOGGLE_UNIT')" class="w-full p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#10B981] text-left flex items-center justify-between">
                <span class="font-bold text-[#10B981]">⚖️ Cambiar unidad a ${nextUnit}</span>
                <span class="text-[10px] text-gray-400">Actual: ${currentUnit}</span>
            </button>

            <button type="button" onclick="execUnifiedExAction('${context}', ${dayIdx}, ${exIdx}, 'DUPLICATE')" class="w-full p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-left flex items-center justify-between">
                <span class="font-bold text-gray-200">📑 Duplicar ejercicio</span>
            </button>

            <button type="button" onclick="execUnifiedExAction('${context}', ${dayIdx}, ${exIdx}, 'DELETE')" class="w-full p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left flex items-center justify-between">
                <span class="font-bold text-amber-400">🗑️ Eliminar ejercicio</span>
            </button>
        </div>
    `);
};

window.execUnifiedExAction = (context, dayIdx, exIdx, action) => {
    const list = context === 'ACTIVE_SESSION'
        ? wState.activeSession.exercises
        : wState.editingRoutine.days[dayIdx].exercises;
    const ex = list[exIdx];
    if (!ex) return;

    if (action === 'ADD_WARMUP') {
        if (context === 'ACTIVE_SESSION') {
            ex.sets.unshift({ setNumber: 1, setType: 'WARMUP', weightKg: 0, reps: 12, isCompleted: false });
            ex.sets.forEach((s, i) => { s.setNumber = i + 1; });
        } else {
            ex.plannedSets.unshift({ setNumber: 1, setType: 'WARMUP', targetWeight: 0, targetReps: '12' });
            ex.plannedSets.forEach((s, i) => { s.setNumber = i + 1; });
            ensureExerciseSetsNormalized(ex);
        }
    } else if (action === 'TOGGLE_SUPERSET') {
        if (ex.supersetId) {
            delete ex.supersetId;
        } else {
            const nextEx = list[exIdx + 1];
            const ssId = (nextEx && nextEx.supersetId) ? nextEx.supersetId : 'SS_1';
            ex.supersetId = ssId;
            if (nextEx && !nextEx.supersetId) nextEx.supersetId = ssId;
        }
    } else if (action === 'REPLACE') {
        window.closeUniversalModal();
        openUnifiedExercisePickerModal(context, dayIdx, exIdx);
        return;
    } else if (action === 'TOGGLE_UNIT') {
        const prev = ex.weightUnit || 'KG';
        const next = prev === 'KG' ? 'LBS' : 'KG';
        const factor = next === 'LBS' ? 2.20462 : (1 / 2.20462);
        ex.weightUnit = next;
        if (context === 'ACTIVE_SESSION') {
            ex.sets.forEach(s => { if (s.weightKg > 0) s.weightKg = Math.round(s.weightKg * factor * 2) / 2; });
        } else {
            ex.plannedSets.forEach(s => { if (s.targetWeight > 0) s.targetWeight = Math.round(s.targetWeight * factor * 2) / 2; });
        }
    } else if (action === 'DUPLICATE') {
        const copy = JSON.parse(JSON.stringify(ex));
        list.splice(exIdx + 1, 0, copy);
    } else if (action === 'DELETE') {
        list.splice(exIdx, 1);
    }

    list.forEach((item, i) => { item.orderIndex = i; });
    window.closeUniversalModal();
    if (context === 'ACTIVE_SESSION' && window.persistActiveWorkoutSession) window.persistActiveWorkoutSession();
    window.renderWorkouts();
};

// Selector Unificado de Ejercicios
export function openUnifiedExercisePickerModal(mode = 'EDITOR', dayIdx = 0, replaceExIdx = null) {
    pickerContext = { mode, dayIdx, replaceExIdx, search: '', muscle: 'Todos' };
    renderExercisePickerContent();
}

function renderExercisePickerContent() {
    const muscles = ['Todos', 'Pecho', 'Espalda', 'Cuádriceps', 'Isquiosurales/Glúteos', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Pantorrillas'];
    const filtered = EXERCISES_LIST.filter(e =>
        (pickerContext.muscle === 'Todos' || e.muscleGroup === pickerContext.muscle) &&
        e.name.toLowerCase().includes(pickerContext.search.toLowerCase())
    ).slice(0, 60);

    window.openUniversalModal(pickerContext.replaceExIdx !== null ? '🔄 Reemplazar Ejercicio' : '+ Seleccionar Ejercicio', `
        <div class="space-y-3 text-xs">
            <input oninput="filterUnifiedPickerSearch(this.value)" value="${pickerContext.search}" placeholder="Buscar ejercicio por nombre..." class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white">
            <div class="flex flex-wrap gap-1.5">
                ${muscles.map(m => `<button type="button" onclick="filterUnifiedPickerMuscle('${m}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold ${pickerContext.muscle === m ? 'bg-[#8B5CF6] text-white' : 'bg-[#0A0A0C] text-gray-400 border border-[#1F1F26]'}">${m}</button>`).join('')}
            </div>
            <div class="max-h-72 overflow-y-auto space-y-2">
                ${filtered.map(ex => `
                    <div onclick="confirmUnifiedExerciseSelection(${ex.id})" class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] flex items-center space-x-3 cursor-pointer">
                        <img src="${ex.img}" class="w-10 h-10 rounded-lg object-contain bg-white p-0.5 shrink-0">
                        <div>
                            <p class="font-extrabold text-white">${ex.name}</p>
                            <p class="text-[10px] text-gray-400">${ex.muscleGroup} · ${ex.equipment}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `);
}

window.filterUnifiedPickerSearch = (q) => { pickerContext.search = q; renderExercisePickerContent(); };
window.filterUnifiedPickerMuscle = (m) => { pickerContext.muscle = m; renderExercisePickerContent(); };

window.confirmUnifiedExerciseSelection = (exId) => {
    const info = findExerciseInfo(exId);
    const { mode, dayIdx, replaceExIdx } = pickerContext;

    if (mode === 'ACTIVE_SESSION') {
        if (replaceExIdx !== null && wState.activeSession.exercises[replaceExIdx]) {
            const old = wState.activeSession.exercises[replaceExIdx];
            wState.activeSession.exercises[replaceExIdx] = {
                ...old,
                exerciseId: info.id,
                exerciseName: info.name,
                muscleGroup: info.muscleGroup,
                equipment: info.equipment,
                imageUri: info.img
            };
        } else if (window.addExerciseToActiveSession) {
            window.addExerciseToActiveSession(exId);
            return;
        }
        if (window.persistActiveWorkoutSession) window.persistActiveWorkoutSession();
    } else {
        const list = wState.editingRoutine.days[dayIdx].exercises;
        if (replaceExIdx !== null && list[replaceExIdx]) {
            const old = list[replaceExIdx];
            list[replaceExIdx] = {
                ...old,
                exerciseId: info.id,
                exerciseName: info.name,
                muscleGroup: info.muscleGroup,
                equipment: info.equipment
            };
        } else {
            const newEx = {
                exerciseId: info.id,
                exerciseName: info.name,
                muscleGroup: info.muscleGroup,
                equipment: info.equipment,
                weightUnit: 'KG',
                orderIndex: list.length,
                restSeconds: 90,
                setTypesCsv: 'NORMAL,NORMAL,NORMAL',
                plannedSets: [
                    { setNumber: 1, setType: 'NORMAL', targetWeight: 0, targetReps: '8-12' },
                    { setNumber: 2, setType: 'NORMAL', targetWeight: 0, targetReps: '8-12' },
                    { setNumber: 3, setType: 'NORMAL', targetWeight: 0, targetReps: '8-12' }
                ]
            };
            list.push(newEx);
        }
    }

    window.closeUniversalModal();
    window.renderWorkouts();
};

// Acciones de edición de días y series
window.selectEditorDayTab = (idx) => { wState.editingDayIndex = idx; window.renderWorkouts(); };
window.updateEditorDayName = (dayIdx, val) => { wState.editingRoutine.days[dayIdx].dayName = val; };

window.addDayToEditingRoutine = () => {
    const days = wState.editingRoutine.days;
    days.push({ dayNumber: days.length + 1, dayName: `Día ${days.length + 1}`, exercises: [] });
    wState.editingDayIndex = days.length - 1;
    window.renderWorkouts();
};

window.removeDayFromEditingRoutine = (dayIdx) => {
    const days = wState.editingRoutine.days;
    if (days.length <= 1) return;
    days.splice(dayIdx, 1);
    days.forEach((d, i) => { d.dayNumber = i + 1; });
    wState.editingDayIndex = Math.max(0, dayIdx - 1);
    window.renderWorkouts();
};

window.updateEditorSetType = (dayIdx, exIdx, setIdx, newType) => {
    const ex = wState.editingRoutine.days[dayIdx].exercises[exIdx];
    ex.plannedSets[setIdx].setType = newType;
    ensureExerciseSetsNormalized(ex);
    window.renderWorkouts();
};

window.updateEditorSetField = (dayIdx, exIdx, setIdx, field, val) => {
    const ex = wState.editingRoutine.days[dayIdx].exercises[exIdx];
    ex.plannedSets[setIdx][field] = field === 'targetWeight' ? Number(val || 0) : String(val || '');
};

window.addEditorPlannedSet = (dayIdx, exIdx, setType = 'NORMAL') => {
    const ex = wState.editingRoutine.days[dayIdx].exercises[exIdx];
    const last = ex.plannedSets[ex.plannedSets.length - 1];
    ex.plannedSets.push({
        setNumber: ex.plannedSets.length + 1,
        setType,
        targetWeight: last ? last.targetWeight : 0,
        targetReps: last ? last.targetReps : '8-12'
    });
    ensureExerciseSetsNormalized(ex);
    window.renderWorkouts();
};

window.removeEditorPlannedSet = (dayIdx, exIdx, setIdx) => {
    const ex = wState.editingRoutine.days[dayIdx].exercises[exIdx];
    if (ex.plannedSets.length <= 1) return;
    ex.plannedSets.splice(setIdx, 1);
    ex.plannedSets.forEach((s, i) => { s.setNumber = i + 1; });
    ensureExerciseSetsNormalized(ex);
    window.renderWorkouts();
};

window.saveEditedRoutineToFirestore = async () => {
    const r = wState.editingRoutine;
    if (!r || !r.name.trim()) return alert('Ingresa un nombre para la rutina.');

    (r.days || []).forEach((d, dIdx) => {
        d.dayNumber = dIdx + 1;
        (d.exercises || []).forEach((ex, exIdx) => {
            ex.orderIndex = exIdx;
            ensureExerciseSetsNormalized(ex);
            ex.targetRepsRange = ex.plannedSets[0]?.targetReps || '8-12';
        });
    });

    r.isCustom = true;
    r.isSystemTemplate = false;
    r.targetDaysPerWeek = r.days.length;
    r.updatedAt = Date.now();

    await fsActions.setItem('workout_routines', r.id, r);
    wState.selectedRoutineId = r.id;
    localStorage.setItem('weavax_primary_routine_id', String(r.id));
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};
