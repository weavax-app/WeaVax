import { fsActions } from '../firebase-sync.js';
import { openUnifiedExercisePickerModal } from './workout-editor.js';
import {
    wState,
    findExerciseInfo,
    getAllRoutinesAndTemplates,
    persistActiveWorkoutSession
} from './workout-state.js';
import { getMyFriendships, publishWorkoutPost, syncPublicProfile } from '../social/social-service.js';
import { publishDailyEcosystemSummary } from '../insights.js';

const SET_TYPE_STYLES = {
    WARMUP:  { bg: 'bg-amber-500/20 border-amber-500/50 text-amber-400', label: 'W' },
    W:       { bg: 'bg-amber-500/20 border-amber-500/50 text-amber-400', label: 'W' },
    FAILURE: { bg: 'bg-amber-600/25 border-amber-400 text-amber-300', label: 'F' },
    F:       { bg: 'bg-amber-600/25 border-amber-400 text-amber-300', label: 'F' },
    DROPSET: { bg: 'bg-blue-500/20 border-blue-500/50 text-blue-400', label: 'D' },
    D:       { bg: 'bg-blue-500/20 border-blue-500/50 text-blue-400', label: 'D' },
    L:       { bg: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400', label: 'L' },
    R:       { bg: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400', label: 'R' },
    N:       { bg: 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400', label: 'N' },
    P:       { bg: 'bg-orange-500/20 border-orange-500/50 text-orange-400', label: 'P' },
    M:       { bg: 'bg-pink-500/20 border-pink-500/50 text-pink-400', label: 'M' },
    FD:      { bg: 'bg-lime-500/20 border-lime-500/50 text-lime-400', label: 'FD' },
    T:       { bg: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300', label: 'T' },
    B:       { bg: 'bg-purple-500/20 border-purple-500/50 text-purple-400', label: 'B' }
};

let activeDragExIdx = null;
let cachedFriendsForFinish = [];

function ensureLiveTimerRunning() {
    if (!wState.activeSession) return;
    wState.activeSession.elapsedSeconds = Math.floor((Date.now() - Number(wState.activeSession.startedAt || Date.now())) / 1000);
    if (!wState.timerInterval) {
        wState.timerInterval = setInterval(() => {
            if (wState.activeSession) {
                wState.activeSession.elapsedSeconds = Math.floor((Date.now() - Number(wState.activeSession.startedAt || Date.now())) / 1000);
                const clock = document.getElementById('live-workout-clock');
                if (clock) {
                    clock.textContent = `${String(Math.floor(wState.activeSession.elapsedSeconds / 60)).padStart(2, '0')}:${String(wState.activeSession.elapsedSeconds % 60).padStart(2, '0')}`;
                }
                if (wState.activeSession.elapsedSeconds % 5 === 0) {
                    persistActiveWorkoutSession();
                }
            }
        }, 1000);
    }
}

export function renderActiveAndFinishViews(container) {
    if (wState.subScreen === 'SESION_ACTIVA' && wState.activeSession) {
        ensureLiveTimerRunning();
        const s = wState.activeSession;
        const mins = String(Math.floor(s.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(s.elapsedSeconds % 60).padStart(2, '0');
        const liveVol = s.exercises.reduce((acc, ex) => {
            const factor = ex.weightUnit === 'LBS' ? 0.453592 : 1;
            return acc + ex.sets.filter(st => st.isCompleted).reduce((v, st) => v + (Number(st.weightKg || 0) * factor * Number(st.reps || 0)), 0);
        }, 0);

        const setTypeBadge = (st, idx) => {
            const cfg = SET_TYPE_STYLES[st.setType];
            if (cfg) {
                return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md border ${cfg.bg} text-[11px] font-black">${cfg.label}</span>`;
            }
            return `<span class="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#0A0A0C] border border-[#1F1F26] text-white text-xs font-extrabold">${idx + 1}</span>`;
        };

        container.innerHTML = `
            <div class="space-y-6" style="font-variant-numeric: tabular-nums;">
                <div class="sticky top-16 z-20 p-4 sm:p-5 rounded-2xl bg-[#121216] border border-[#8B5CF6] flex flex-wrap items-center justify-between gap-3 shadow-xl">
                    <div class="flex items-center space-x-3">
                        <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="px-3 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-bold text-white">← Minimizar</button>
                        <div>
                            <span class="text-[10px] font-bold uppercase text-[#8B5CF6]">${s.routineName}</span>
                            <div class="flex items-center space-x-4 mt-0.5">
                                <span id="live-workout-clock" class="text-xl font-black font-mono text-white">${mins}:${secs}</span>
                                <span class="text-xs text-gray-400">Volumen: <strong class="text-white">${liveVol.toFixed(0)} kg</strong></span>
                                ${wState.restSecondsLeft > 0 ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">⏳ ${wState.restSecondsLeft}s</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button type="button" onclick="openUnifiedExercisePickerModal('ACTIVE_SESSION', 0)" class="px-3.5 py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-xs font-bold text-white">+ Ejercicio</button>
                        <button type="button" onclick="discardActiveWorkout()" class="px-3.5 py-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold">Descartar</button>
                        <button type="button" onclick="attemptFinishWorkout()" class="px-5 py-2 rounded-xl bg-[#10B981] text-black text-xs font-extrabold">Finalizar</button>
                    </div>
                </div>

                <div class="space-y-4">
                    ${s.exercises.map((ex, exIdx) => {
                        const unit = ex.weightUnit || 'KG';
                        return `
                        <div draggable="true"
                             ondragstart="handleActiveExDragStart(event, ${exIdx})"
                             ondragover="handleActiveExDragOver(event)"
                             ondrop="handleActiveExDrop(event, ${exIdx})"
                             class="p-5 rounded-2xl bg-[#121216] border ${ex.supersetId ? 'border-[#8B5CF6]/70' : 'border-[#1F1F26]'} space-y-4 cursor-grab active:cursor-grabbing">

                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center space-x-3.5 min-w-0">
                                    <img src="${ex.imageUri}" class="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0 pointer-events-none">
                                    <div class="min-w-0">
                                        <div class="flex flex-wrap items-center gap-1.5">
                                            <h4 class="text-sm font-extrabold text-white truncate">${ex.exerciseName}</h4>
                                            ${ex.supersetId ? `<span class="px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] text-[10px] font-black">Superserie</span>` : ''}
                                        </div>
                                        <p class="text-[11px] text-gray-400">${ex.muscleGroup} · Descanso ${ex.restSeconds}s</p>
                                    </div>
                                </div>
                                <button type="button" onclick="openUnifiedExerciseMenuModal('ACTIVE_SESSION', 0, ${exIdx})" class="w-9 h-9 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-white font-black flex items-center justify-center shrink-0">⋮</button>
                            </div>

                            <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-gray-400 px-2">
                                <div class="col-span-3">Serie</div>
                                <div class="col-span-3 text-center">Peso (${unit})</div>
                                <div class="col-span-3 text-center">Reps</div>
                                <div class="col-span-3 text-center">Listo</div>
                            </div>

                            <div class="space-y-2">
                                ${ex.sets.map((st, stIdx) => `
                                    <div class="grid grid-cols-12 gap-2 items-center p-2 rounded-xl ${st.isCompleted ? 'bg-[#10B981]/10 border border-[#10B981]/40' : 'bg-[#0A0A0C] border border-[#1F1F26]'} text-xs">
                                        <div class="col-span-3">
                                            <button type="button" onclick="cycleActiveSetType(${exIdx}, ${stIdx})" class="w-full px-2 py-1.5 rounded-lg bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] flex items-center justify-between" title="Clic para cambiar tipo (W/N/D/F)">
                                                ${setTypeBadge(st, stIdx)}<span class="text-[9px] text-gray-400">↻</span>
                                            </button>
                                        </div>
                                        <div class="col-span-3">
                                            <input id="set-kg-${exIdx}-${stIdx}"
                                                   type="number" step="0.5"
                                                   onfocus="this.select()"
                                                   onkeydown="handleSetInputKeydown(event, ${exIdx}, ${stIdx}, 'KG')"
                                                   placeholder="0"
                                                   value="${st.weightKg > 0 ? st.weightKg : ''}"
                                                   oninput="updateActiveSetVal(${exIdx}, ${stIdx}, 'weightKg', this.value)"
                                                   class="w-full px-2 py-1.5 rounded-lg bg-[#121216] border border-[#1F1F26] text-center text-white font-bold focus:border-[#8B5CF6] outline-none">
                                        </div>
                                        <div class="col-span-3">
                                            <input id="set-reps-${exIdx}-${stIdx}"
                                                   type="number"
                                                   onfocus="this.select()"
                                                   onkeydown="handleSetInputKeydown(event, ${exIdx}, ${stIdx}, 'REPS')"
                                                   placeholder="0"
                                                   value="${st.reps > 0 ? st.reps : ''}"
                                                   oninput="updateActiveSetVal(${exIdx}, ${stIdx}, 'reps', this.value)"
                                                   class="w-full px-2 py-1.5 rounded-lg bg-[#121216] border border-[#1F1F26] text-center text-white font-bold focus:border-[#8B5CF6] outline-none">
                                        </div>
                                        <div class="col-span-3 flex justify-center">
                                            <input type="checkbox" ${st.isCompleted ? 'checked' : ''} onchange="toggleActiveSetDone(${exIdx}, ${stIdx})" class="w-5 h-5 accent-[#10B981] rounded cursor-pointer">
                                        </div>
                                    </div>
                                `).join('')}
                            </div>

                            <div class="flex gap-3 pt-1">
                                <button type="button" onclick="addSetToActive(${exIdx})" class="text-xs font-extrabold text-[#8B5CF6]">+ Añadir Serie</button>
                                <button type="button" onclick="removeLastSetFromActive(${exIdx})" class="text-xs text-gray-400 hover:text-amber-400">- Quitar Serie</button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'POR_FINALIZAR' && wState.finishDraft) {
        const d = wState.finishDraft;
        container.innerHTML = `
            <div class="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#121216] border border-[#1F1F26] space-y-5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-[#10B981]/20 text-[#10B981]">Cronómetro Detenido · Revisión Final</span>
                    <button type="button" onclick="openWorkoutSub('SESION_ACTIVA')" class="text-xs text-[#8B5CF6] font-bold">← Volver</button>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Título del entrenamiento</label>
                    <input id="fin-title" value="${d.title}" class="mt-1 w-full px-4 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-bold">
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Foto del Entrenamiento (Opcional)</label>
                    <div class="p-4 rounded-2xl bg-[#0A0A0C] border border-dashed border-[#1F1F26] text-center space-y-2">
                        ${d.photoDataUrl ? `<img src="${d.photoDataUrl}" class="max-h-48 mx-auto rounded-xl object-cover mb-2">` : ''}
                        <label class="inline-block px-4 py-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] text-xs font-bold cursor-pointer">
                            📷 Subir Foto<input type="file" accept="image/*" class="hidden" onchange="handleWorkoutPhotoUpload(event)">
                        </label>
                    </div>
                </div>

                <!-- Sección Social: Entrené con... y Publicar en el muro -->
                <div class="p-4 rounded-2xl bg-[#0A0A0C] border border-[#1F1F26] space-y-3 text-xs">
                    <label class="flex items-center justify-between cursor-pointer">
                        <span class="font-extrabold text-white">🔥 Publicar en el muro de amigos</span>
                        <input type="checkbox" id="fin-publish-social" checked class="w-4 h-4 accent-[#8B5CF6]">
                    </label>
                    ${cachedFriendsForFinish.length > 0 ? `
                        <div class="pt-2 border-t border-[#1F1F26]">
                            <span class="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Entrené con... (Etiquetar amigos)</span>
                            <div class="flex flex-wrap gap-2">
                                ${cachedFriendsForFinish.map(f => `
                                    <label class="px-2.5 py-1 rounded-lg bg-[#121216] border border-[#1F1F26] flex items-center space-x-1.5 cursor-pointer">
                                        <input type="checkbox" name="fin-tagged-friend" value="${f.uid}" data-username="${f.username}" data-name="${f.name}" class="accent-[#10B981]">
                                        <span class="text-gray-200">@${f.username}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Duración Real (Horas : Minutos : Segundos)</label>
                    <div class="grid grid-cols-3 gap-3 mt-1.5" style="font-variant-numeric: tabular-nums;">
                        <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-center"><span class="text-[10px] text-gray-400 block">Horas</span><input id="fin-h" type="number" onfocus="this.select()" min="0" max="12" value="${d.hours}" class="w-full bg-transparent text-center text-lg font-black text-white"></div>
                        <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-center"><span class="text-[10px] text-gray-400 block">Minutos</span><input id="fin-m" type="number" onfocus="this.select()" min="0" max="59" value="${d.minutes}" class="w-full bg-transparent text-center text-lg font-black text-white"></div>
                        <div class="p-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-center"><span class="text-[10px] text-gray-400 block">Segundos</span><input id="fin-s" type="number" onfocus="this.select()" min="0" max="59" value="${d.seconds}" class="w-full bg-transparent text-center text-lg font-black text-white"></div>
                    </div>
                </div>

                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Notas</label>
                    <textarea id="fin-notes" rows="2" placeholder="¿Cómo te sentiste hoy?" class="mt-1 w-full px-4 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white text-xs">${d.notes || ''}</textarea>
                </div>

                <div class="flex gap-3 pt-2">
                    <button type="button" onclick="discardActiveWorkout()" class="flex-1 py-3 rounded-xl bg-amber-500/15 text-amber-400 font-bold text-xs">Descartar</button>
                    <button type="button" onclick="finalizeAndSaveWorkoutSession()" class="flex-1 py-3 rounded-xl bg-[#8B5CF6] text-white font-extrabold text-xs">Guardar Entrenamiento</button>
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'RESUMEN_SESION' && wState.summaryData) {
        const sum = wState.summaryData;
        const idx = wState.summarySlideIdx;
        const slides = [
            `<div class="p-8 rounded-3xl bg-gradient-to-br from-[#121216] to-purple-900/40 border border-[#8B5CF6] text-center space-y-3">${sum.photoDataUrl ? `<img src="${sum.photoDataUrl}" class="w-32 h-32 mx-auto rounded-2xl object-cover border-2 border-[#8B5CF6]">` : `<div class="text-5xl">🔥</div>`}<h3 class="text-2xl font-black text-white">¡Sesión Completada!</h3><p class="text-sm text-gray-300">${sum.title}</p><div class="text-xs font-extrabold tracking-widest uppercase text-[#8B5CF6] pt-3 xp-gamified-badge">WEAVAX · +60 XP</div></div>`,
            `<div class="p-8 rounded-3xl bg-[#121216] border border-amber-500/40 text-center space-y-3"><div class="text-4xl">🏆</div><h3 class="text-xl font-black text-amber-300">Récords y 1RM de Hoy</h3>${sum.prs.length === 0 ? `<p class="text-xs text-gray-400 py-4">Sin series con carga externa registradas.</p>` : `<div class="space-y-1.5 text-xs pt-2">${sum.prs.map(p => `<div class="p-2.5 rounded-lg bg-[#0A0A0C] font-bold text-white">${p}</div>`).join('')}</div>`}</div>`,
            `<div class="p-8 rounded-3xl bg-[#121216] border border-[#1F1F26] space-y-4"><h3 class="text-lg font-black text-center text-white">Métricas Trabajadas</h3><div class="grid grid-cols-3 gap-2 text-center" style="font-variant-numeric: tabular-nums;"><div class="p-3 rounded-xl bg-[#0A0A0C]"><div class="text-lg font-black text-[#8B5CF6]">${sum.volume} kg</div><div class="text-[10px] text-gray-400">Volumen</div></div><div class="p-3 rounded-xl bg-[#0A0A0C]"><div class="text-lg font-black text-[#10B981]">${sum.sets}</div><div class="text-[10px] text-gray-400">Series</div></div><div class="p-3 rounded-xl bg-[#0A0A0C]"><div class="text-lg font-black text-white">${sum.durationMin}m</div><div class="text-[10px] text-gray-400">Duración</div></div></div><div class="flex flex-wrap justify-center gap-2">${sum.muscles.map(m => `<span class="px-3 py-1 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs font-bold">${m}</span>`).join('')}</div></div>`,
            `<div class="p-8 rounded-3xl bg-[#121216] border border-[#1F1F26] space-y-3"><h3 class="text-base font-black text-white">Desglose de Series</h3><div class="space-y-1.5 text-xs">${sum.breakdown.map(b => `<div class="flex justify-between p-2 rounded bg-[#0A0A0C] text-white"><span>${b.name}</span><span class="font-bold text-[#8B5CF6]">${b.sets} series (${b.vol} kg)</span></div>`).join('')}</div></div>`
        ];
        container.innerHTML = `
            <div class="max-w-md mx-auto space-y-4">
                ${slides[idx % slides.length]}
                <div class="flex justify-between items-center">
                    <button type="button" onclick="stepSummarySlide(-1)" class="px-4 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] text-xs font-bold text-white">← Anterior</button>
                    <span class="text-xs font-bold text-gray-400">Tarjeta ${(idx % slides.length) + 1} de ${slides.length}</span>
                    <button type="button" onclick="stepSummarySlide(1)" class="px-4 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] text-xs font-bold text-white">Siguiente →</button>
                </div>
                <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="w-full py-3 rounded-xl bg-[#8B5CF6] text-white font-extrabold text-xs">Cerrar Resumen</button>
            </div>
        `;
    }
}

window.beginActiveWorkoutSession = (routineId, dayNumber) => {
    const r = getAllRoutinesAndTemplates().find(x => Number(x.id) === Number(routineId));
    const d = (r?.days || []).find(x => Number(x.dayNumber) === Number(dayNumber)) || r?.days?.[0];
    if (!r || !d) return;

    if (window.navigate) window.navigate('workouts');
    wState.activeSession = {
        routineId: r.id,
        isCustomRoutine: Boolean(r.isCustom),
        routineName: `${r.name} · ${d.dayName}`,
        dayNumber: d.dayNumber,
        startedAt: Date.now(),
        elapsedSeconds: 0,
        exercises: (d.exercises || []).map((ex, idx) => {
            const cat = findExerciseInfo(ex.exerciseId, ex.exerciseName);
            const csvTypes = String(ex.setTypesCsv || '').split(',').map(s => s.trim()).filter(Boolean);
            const hasPlanned = Array.isArray(ex.plannedSets) && ex.plannedSets.length > 0;
            const totalSets = hasPlanned ? ex.plannedSets.length : Math.max(1, csvTypes.length || Number(ex.targetSets || 3));

            return {
                ...ex,
                orderIndex: idx,
                weightUnit: ex.weightUnit || 'KG',
                imageUri: cat.img,
                sets: Array.from({ length: totalSets }, (_, i) => {
                    const ps = hasPlanned ? ex.plannedSets[i] : null;
                    return {
                        setNumber: i + 1,
                        setType: ps?.setType || csvTypes[i] || 'NORMAL',
                        weightKg: Number(ps?.targetWeight || 0),
                        reps: parseInt(ps?.targetReps, 10) || 0,
                        isCompleted: false
                    };
                })
            };
        })
    };

    if (wState.timerInterval) {
        clearInterval(wState.timerInterval);
        wState.timerInterval = null;
    }
    ensureLiveTimerRunning();
    persistActiveWorkoutSession();

    wState.subScreen = 'SESION_ACTIVA';
    window.renderWorkouts();
};

// Flujo rápido de teclado: Enter en KG -> REPS; Enter en REPS -> Completa serie y salta al siguiente KG (o superserie)
window.handleSetInputKeydown = (e, exIdx, stIdx, field) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    if (field === 'KG') {
        const repsInput = document.getElementById(`set-reps-${exIdx}-${stIdx}`);
        if (repsInput) repsInput.focus();
        return;
    }

    if (field === 'REPS') {
        const exercises = wState.activeSession.exercises;
        const currentEx = exercises[exIdx];
        const st = currentEx.sets[stIdx];
        if (!st.isCompleted) {
            window.toggleActiveSetDone(exIdx, stIdx);
        }

        // Calcular siguiente objetivo de foco (soporta Superseries)
        let targetExIdx = exIdx;
        let targetStIdx = stIdx + 1;

        if (currentEx.supersetId) {
            const partnerIdx = exercises.findIndex((item, idx) => idx !== exIdx && item.supersetId === currentEx.supersetId);
            if (partnerIdx !== -1 && exercises[partnerIdx].sets[stIdx] && !exercises[partnerIdx].sets[stIdx].isCompleted) {
                targetExIdx = partnerIdx;
                targetStIdx = stIdx;
            }
        }

        setTimeout(() => {
            const nextKg = document.getElementById(`set-kg-${targetExIdx}-${targetStIdx}`)
                || document.getElementById(`set-kg-${exIdx + 1}-0`);
            if (nextKg) nextKg.focus();
        }, 40);
    }
};

window.cycleActiveSetType = (exIdx, stIdx) => {
    const order = ['NORMAL', 'WARMUP', 'DROPSET', 'FAILURE'];
    const st = wState.activeSession.exercises[exIdx].sets[stIdx];
    const nextIdx = (order.indexOf(st.setType) + 1) % order.length;
    st.setType = order[nextIdx];
    persistActiveWorkoutSession();
    window.renderWorkouts();
};

// Drag & Drop en sesión activa
window.handleActiveExDragStart = (e, exIdx) => { activeDragExIdx = exIdx; e.dataTransfer.effectAllowed = 'move'; };
window.handleActiveExDragOver = (e) => { e.preventDefault(); };
window.handleActiveExDrop = (e, targetIdx) => {
    e.preventDefault();
    if (activeDragExIdx === null || activeDragExIdx === targetIdx) return;
    const list = wState.activeSession.exercises;
    const [moved] = list.splice(activeDragExIdx, 1);
    list.splice(targetIdx, 0, moved);
    activeDragExIdx = null;
    persistActiveWorkoutSession();
    window.renderWorkouts();
};

window.updateActiveSetVal = (exIdx, stIdx, field, val) => {
    wState.activeSession.exercises[exIdx].sets[stIdx][field] = Math.max(0, Number(val || 0));
    persistActiveWorkoutSession();
};

window.toggleActiveSetDone = (exIdx, stIdx) => {
    const st = wState.activeSession.exercises[exIdx].sets[stIdx];
    st.isCompleted = !st.isCompleted;
    persistActiveWorkoutSession();
    if (st.isCompleted) {
        wState.restSecondsLeft = Number(wState.activeSession.exercises[exIdx].restSeconds || 90);
        if (wState.restInterval) clearInterval(wState.restInterval);
        wState.restInterval = setInterval(() => {
            wState.restSecondsLeft = Math.max(0, wState.restSecondsLeft - 1);
            if (wState.restSecondsLeft === 0) clearInterval(wState.restInterval);
            if (wState.subScreen === 'SESION_ACTIVA') window.renderWorkouts();
        }, 1000);
    }
    window.renderWorkouts();
};

window.addSetToActive = (exIdx) => {
    const sets = wState.activeSession.exercises[exIdx].sets;
    const last = sets[sets.length - 1];
    sets.push({ setNumber: sets.length + 1, setType: 'NORMAL', weightKg: last ? last.weightKg : 0, reps: last ? last.reps : 0, isCompleted: false });
    persistActiveWorkoutSession();
    window.renderWorkouts();
};

window.removeLastSetFromActive = (exIdx) => {
    const sets = wState.activeSession.exercises[exIdx].sets;
    if (sets.length > 1) sets.pop();
    persistActiveWorkoutSession();
    window.renderWorkouts();
};

window.addExerciseToActiveSession = (exId) => {
    const cat = findExerciseInfo(exId);
    wState.activeSession.exercises.push({
        exerciseId: cat.id,
        exerciseName: cat.name,
        muscleGroup: cat.muscleGroup,
        equipment: cat.equipment,
        weightUnit: 'KG',
        imageUri: cat.img,
        restSeconds: 90,
        sets: [
            { setNumber: 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false },
            { setNumber: 2, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false }
        ]
    });
    persistActiveWorkoutSession();
    window.closeUniversalModal();
    window.renderWorkouts();
};

// Detección de diferencias respecto a la plantilla original (Conciliación)
function detectRoutineTemplateDiff(session) {
    if (!session.isCustomRoutine) return false;
    const routine = getAllRoutinesAndTemplates().find(r => Number(r.id) === Number(session.routineId));
    const origDay = (routine?.days || []).find(d => Number(d.dayNumber) === Number(session.dayNumber));
    if (!origDay) return false;

    const origSig = (origDay.exercises || []).map(e => `${e.exerciseId}:${e.targetSets || 3}:${e.setTypesCsv || ''}`).join('|');
    const currSig = (session.exercises || []).map(e => `${e.exerciseId}:${e.sets.length}:${e.sets.map(s => s.setType || 'NORMAL').join(',')}`).join('|');
    return origSig !== currSig;
}

window.attemptFinishWorkout = async () => {
    try {
        const res = await getMyFriendships();
        cachedFriendsForFinish = (res.accepted || []).map(x => x.friend);
    } catch {
        cachedFriendsForFinish = [];
    }

    if (detectRoutineTemplateDiff(wState.activeSession)) {
        window.openUniversalModal('🔄 Cambios detectados en la rutina', `
            <div class="space-y-4 text-xs">
                <p class="text-gray-300">Modificaste ejercicios, orden, número de series o tipos de serie respecto a tu rutina guardada. ¿Deseas actualizar la plantilla del día?</p>
                <div class="flex gap-2">
                    <button type="button" onclick="closeUniversalModal(); proceedToPorFinalizarScreen(false)" class="flex-1 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-gray-300 font-bold">Mantener Original</button>
                    <button type="button" onclick="closeUniversalModal(); proceedToPorFinalizarScreen(true)" class="flex-1 py-2.5 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Actualizar Rutina</button>
                </div>
            </div>
        `);
    } else {
        proceedToPorFinalizarScreen(false);
    }
};

window.proceedToPorFinalizarScreen = async (shouldUpdateTemplate = false) => {
    if (shouldUpdateTemplate && wState.activeSession) {
        const s = wState.activeSession;
        const routine = getAllRoutinesAndTemplates().find(r => Number(r.id) === Number(s.routineId));
        if (routine) {
            const copy = JSON.parse(JSON.stringify(routine));
            const dayObj = (copy.days || []).find(d => Number(d.dayNumber) === Number(s.dayNumber));
            if (dayObj) {
                dayObj.exercises = s.exercises.map((ex, idx) => ({
                    exerciseId: ex.exerciseId,
                    exerciseName: ex.exerciseName,
                    muscleGroup: ex.muscleGroup,
                    equipment: ex.equipment,
                    weightUnit: ex.weightUnit || 'KG',
                    supersetId: ex.supersetId || null,
                    orderIndex: idx,
                    restSeconds: ex.restSeconds || 90,
                    targetSets: ex.sets.length,
                    setTypesCsv: ex.sets.map(st => st.setType || 'NORMAL').join(','),
                    plannedSets: ex.sets.map((st, i) => ({
                        setNumber: i + 1,
                        setType: st.setType || 'NORMAL',
                        targetWeight: st.weightKg || 0,
                        targetReps: String(st.reps || '8-12')
                    }))
                }));
                await fsActions.setItem('workout_routines', copy.id, copy);
            }
        }
    }

    if (wState.timerInterval) {
        clearInterval(wState.timerInterval);
        wState.timerInterval = null;
    }
    const totalSec = Math.max(1, wState.activeSession.elapsedSeconds);
    wState.finishDraft = {
        title: wState.activeSession.routineName,
        hours: Math.floor(totalSec / 3600),
        minutes: Math.floor((totalSec % 3600) / 60),
        seconds: totalSec % 60,
        photoDataUrl: '',
        notes: ''
    };
    wState.subScreen = 'POR_FINALIZAR';
    persistActiveWorkoutSession();
    window.renderWorkouts();
};

window.handleWorkoutPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !wState.finishDraft) return;
    const reader = new FileReader();
    reader.onload = () => { wState.finishDraft.photoDataUrl = reader.result; window.renderWorkouts(); };
    reader.readAsDataURL(file);
};

window.finalizeAndSaveWorkoutSession = async () => {
    const s = wState.activeSession;
    const title = document.getElementById('fin-title')?.value || s.routineName;
    const durationSeconds = Math.max(1, (Number(document.getElementById('fin-h')?.value || 0) * 3600) + (Number(document.getElementById('fin-m')?.value || 0) * 60) + Number(document.getElementById('fin-s')?.value || 0));
    const notes = document.getElementById('fin-notes')?.value || '';
    const photoDataUrl = wState.finishDraft?.photoDataUrl || '';
    const shouldPublishSocial = document.getElementById('fin-publish-social')?.checked ?? false;

    const taggedFriends = Array.from(document.querySelectorAll('input[name="fin-tagged-friend"]:checked')).map(cb => ({
        uid: cb.value,
        username: cb.dataset.username,
        name: cb.dataset.name
    }));

    let totalVolumeKg = 0, totalCompletedSets = 0;
    const prs = [], breakdown = [], workedMuscles = new Set();
    const setsPayload = [];

    s.exercises.forEach(ex => {
        const doneSets = ex.sets.filter(st => st.isCompleted === true);
        if (doneSets.length === 0) return;
        const unitFactor = ex.weightUnit === 'LBS' ? 0.453592 : 1;
        workedMuscles.add(ex.muscleGroup);
        totalCompletedSets += doneSets.length;
        let exVol = 0, best1RM = 0;
        doneSets.forEach((st, i) => {
            const wKg = Math.max(0, Number(st.weightKg || 0) * unitFactor);
            const r = Math.max(0, Number(st.reps || 0));
            exVol += (wKg * r);
            if (wKg > 0 && r > 0) best1RM = Math.max(best1RM, wKg * (1 + r / 30));
            setsPayload.push({
                exerciseId: ex.exerciseId,
                exerciseName: ex.exerciseName,
                setNumber: i + 1,
                weightKg: Math.round(wKg * 10) / 10,
                reps: r,
                isCompleted: true,
                completedAt: Date.now(),
                setType: st.setType || 'NORMAL'
            });
        });
        totalVolumeKg += exVol;
        if (best1RM > 0) prs.push(`${ex.exerciseName}: 1RM ${best1RM.toFixed(1)} kg`);
        breakdown.push({ name: ex.exerciseName, sets: doneSets.length, vol: exVol.toFixed(0) });
    });

    const id = Date.now();
    const sessionDoc = {
        id,
        routineId: s.routineId,
        routineName: title,
        dayNumber: s.dayNumber,
        startedAt: s.startedAt,
        endedAt: id,
        durationSeconds,
        totalVolumeKg: Math.round(totalVolumeKg),
        totalCompletedSets,
        photoDataUrl,
        xpEarned: 60,
        notes,
        isCompleted: true,
        sets: setsPayload
    };

    await fsActions.setItem('workout_sessions', id, sessionDoc);

    const nextXp = Number(window.state.profile?.xp || 0) + 60;
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1, hasCompletedFirstWin: true });

    // Sincronizar perfil público, muro social y resumen del ecosistema
    await syncPublicProfile();
    await publishDailyEcosystemSummary();
    if (shouldPublishSocial) {
        await publishWorkoutPost({ sessionData: sessionDoc, taggedFriends, prs, breakdown });
    }

    wState.summaryData = {
        title,
        photoDataUrl,
        volume: Math.round(totalVolumeKg),
        sets: totalCompletedSets,
        durationMin: Math.max(1, Math.round(durationSeconds / 60)),
        muscles: Array.from(workedMuscles),
        prs,
        breakdown
    };
    wState.summarySlideIdx = 0;
    wState.activeSession = null;
    persistActiveWorkoutSession();
    wState.subScreen = 'RESUMEN_SESION';
    window.renderWorkouts();
};

window.stepSummarySlide = (d) => { wState.summarySlideIdx = (wState.summarySlideIdx + d + 4) % 4; window.renderWorkouts(); };

window.discardActiveWorkout = () => {
    if (!confirm('¿Descartar este entrenamiento sin guardar?')) return;
    if (wState.timerInterval) { clearInterval(wState.timerInterval); wState.timerInterval = null; }
    if (wState.restInterval) { clearInterval(wState.restInterval); wState.restInterval = null; }
    wState.activeSession = null;
    wState.finishDraft = null;
    persistActiveWorkoutSession();
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};
