import { fsActions } from '../firebase-sync.js?v=5';
import { EXERCISE_CATALOG, getExById } from './workout-catalog.js';
import { wState, getUserSavedRoutines, getAllRoutinesAndTemplates } from './workout-state.js';

export function renderActiveAndFinishViews(container) {
    if (wState.subScreen === 'SESION_ACTIVA' && wState.activeSession) {
        const s = wState.activeSession;
        const mins = String(Math.floor(s.elapsedSeconds / 60)).padStart(2, '0');
        const secs = String(s.elapsedSeconds % 60).padStart(2, '0');
        const liveVol = s.exercises.reduce((acc, ex) => acc + ex.sets.filter(st => st.isCompleted).reduce((v, st) => v + (Number(st.weightKg || 0) * Number(st.reps || 0)), 0), 0);

        const setTypeBadge = (st, idx) => {
            if (st.setType === 'W') return `<span class="text-amber-400 font-black">W</span>`;
            if (st.setType === 'D') return `<span class="text-cyan-400 font-black">D</span>`;
            if (st.setType === 'F') return `<span class="text-red-400 font-black">F</span>`;
            return `<span class="text-white font-bold">${idx + 1}</span>`;
        };

        container.innerHTML = `
            <div class="space-y-6">
                <div class="sticky top-16 z-20 p-4 sm:p-5 rounded-2xl bg-[#181824] border border-accent flex flex-wrap items-center justify-between gap-3 shadow-xl">
                    <div class="flex items-center space-x-3">
                        <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C] hover:border-accent text-xs font-bold">← Minimizar</button>
                        <div>
                            <span class="text-[10px] font-bold uppercase text-accent">${s.routineName}</span>
                            <div class="flex items-center space-x-4 mt-0.5">
                                <span id="live-workout-clock" class="text-xl font-black font-mono">${mins}:${secs}</span>
                                <span class="text-xs text-gray-400">Volumen real: <strong class="text-white">${liveVol.toFixed(0)} kg</strong></span>
                                ${wState.restSecondsLeft > 0 ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold">⏳ ${wState.restSecondsLeft}s</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        <button onclick="openAddExerciseToActiveModal()" class="px-3.5 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">+ Ejercicio</button>
                        <button onclick="discardActiveWorkout()" class="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">🗑️ Descartar</button>
                        <button onclick="attemptFinishWorkout()" class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold">Finalizar</button>
                    </div>
                </div>

                <div class="space-y-5">
                    ${s.exercises.map((ex, exIdx) => `
                        <div class="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3.5">
                                    <img src="${ex.imageUri}" class="w-12 h-12 rounded-xl object-contain bg-white p-1">
                                    <div><h4 class="text-sm font-extrabold">${ex.exerciseName}</h4><p class="text-[11px] text-gray-400">${ex.muscleGroup} · Descanso ${ex.restSeconds}s</p></div>
                                </div>
                                <button onclick="removeExerciseFromActive(${exIdx})" class="text-xs text-gray-500 hover:text-red-400">Quitar</button>
                            </div>
                            <div class="grid grid-cols-12 gap-2 text-[10px] font-bold uppercase text-gray-400 px-2">
                                <div class="col-span-3">Tipo / Serie</div><div class="col-span-3">Peso (kg)</div><div class="col-span-3">Reps</div><div class="col-span-3 text-center">Completar</div>
                            </div>
                            <div class="space-y-2">
                                ${ex.sets.map((st, stIdx) => `
                                    <div class="grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl ${st.isCompleted ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gray-50 dark:bg-[#0A0A0F]'} text-xs">
                                        <div class="col-span-3">
                                            <button onclick="openSetTypePickerModal(${exIdx}, ${stIdx})" class="w-full px-2.5 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] hover:border-accent flex items-center justify-between text-xs">
                                                ${setTypeBadge(st, stIdx)}<span class="text-[9px] text-gray-400">▼</span>
                                            </button>
                                        </div>
                                        <div class="col-span-3"><input type="number" step="0.5" placeholder="0" value="${st.weightKg > 0 ? st.weightKg : ''}" oninput="updateActiveSetVal(${exIdx}, ${stIdx}, 'weightKg', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold"></div>
                                        <div class="col-span-3"><input type="number" placeholder="0" value="${st.reps > 0 ? st.reps : ''}" oninput="updateActiveSetVal(${exIdx}, ${stIdx}, 'reps', this.value)" class="w-full px-2 py-1.5 rounded-lg bg-[#181824] border border-[#28283C] text-center font-bold"></div>
                                        <div class="col-span-3 flex justify-center"><input type="checkbox" ${st.isCompleted ? 'checked' : ''} onchange="toggleActiveSetDone(${exIdx}, ${stIdx})" class="w-5 h-5 accent-emerald-500 rounded cursor-pointer"></div>
                                    </div>
                                `).join('')}
                            </div>
                            <div class="flex gap-3 pt-1">
                                <button onclick="addSetToActive(${exIdx})" class="text-xs font-bold text-accent">+ Añadir Serie</button>
                                <button onclick="removeLastSetFromActive(${exIdx})" class="text-xs text-gray-400 hover:text-red-400">- Quitar Serie</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'POR_FINALIZAR' && wState.finishDraft) {
        const d = wState.finishDraft;
        container.innerHTML = `
            <div class="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-5">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Cronómetro Detenido · Revisión Final</span>
                    <button onclick="openWorkoutSub('SESION_ACTIVA')" class="text-xs text-accent font-bold">← Volver</button>
                </div>
                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Título del entrenamiento</label>
                    <input id="fin-title" value="${d.title}" class="mt-1 w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] font-bold">
                </div>
                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase block mb-1.5">Foto del Entrenamiento (Opcional)</label>
                    <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-dashed border-[#28283C] text-center space-y-2">
                        ${d.photoDataUrl ? `<img src="${d.photoDataUrl}" class="max-h-48 mx-auto rounded-xl object-cover mb-2">` : ''}
                        <label class="inline-block px-4 py-2 rounded-xl bg-accent/15 text-accent text-xs font-bold cursor-pointer">
                            📷 Subir Foto<input type="file" accept="image/*" class="hidden" onchange="handleWorkoutPhotoUpload(event)">
                        </label>
                    </div>
                </div>
                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Duración Real (Horas : Minutos : Segundos)</label>
                    <div class="grid grid-cols-3 gap-3 mt-1.5">
                        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-center"><span class="text-[10px] text-gray-400 block">Horas</span><input id="fin-h" type="number" min="0" max="12" value="${d.hours}" class="w-full bg-transparent text-center text-lg font-black"></div>
                        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-center"><span class="text-[10px] text-gray-400 block">Minutos</span><input id="fin-m" type="number" min="0" max="59" value="${d.minutes}" class="w-full bg-transparent text-center text-lg font-black"></div>
                        <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C] text-center"><span class="text-[10px] text-gray-400 block">Segundos</span><input id="fin-s" type="number" min="0" max="59" value="${d.seconds}" class="w-full bg-transparent text-center text-lg font-black"></div>
                    </div>
                </div>
                <div>
                    <label class="text-[11px] font-bold text-gray-400 uppercase">Notas</label>
                    <textarea id="fin-notes" rows="3" placeholder="¿Cómo te sentiste hoy?" class="mt-1 w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-xs">${d.notes || ''}</textarea>
                </div>
                <div class="flex gap-3 pt-2">
                    <button onclick="discardActiveWorkout()" class="flex-1 py-3 rounded-xl bg-red-500/15 text-red-400 font-bold text-xs">🗑️ Descartar</button>
                    <button onclick="checkRoutineReconciliationBeforeSave()" class="flex-1 py-3 rounded-xl bg-accent text-white font-extrabold text-xs">Guardar Entrenamiento</button>
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'RESUMEN_SESION' && wState.summaryData) {
        const sum = wState.summaryData;
        const idx = wState.summarySlideIdx;
        const slides = [
            `<div class="p-8 rounded-3xl bg-gradient-to-br from-[#181824] to-purple-900/40 border border-accent text-center space-y-3">${sum.photoDataUrl ? `<img src="${sum.photoDataUrl}" class="w-32 h-32 mx-auto rounded-2xl object-cover border-2 border-accent">` : `<div class="text-5xl">🔥</div>`}<h3 class="text-2xl font-black">¡Racha Semanal Activa!</h3><p class="text-sm text-gray-300">${sum.title}</p><div class="text-xs font-extrabold tracking-widest uppercase text-accent pt-3">WEAVAX LIFEOS · +60 XP</div></div>`,
            `<div class="p-8 rounded-3xl bg-[#181824] border border-amber-500/40 text-center space-y-3"><div class="text-4xl">🏆</div><h3 class="text-xl font-black text-amber-300">Récords y 1RM de Hoy</h3>${sum.prs.length === 0 ? `<p class="text-xs text-gray-400 py-4">No registraste series completadas con peso en esta sesión.</p>` : `<div class="space-y-1.5 text-xs pt-2">${sum.prs.map(p => `<div class="p-2.5 rounded-lg bg-[#0A0A0F] font-bold">${p}</div>`).join('')}</div>`}</div>`,
            `<div class="p-8 rounded-3xl bg-[#181824] border border-[#28283C] space-y-4"><h3 class="text-lg font-black text-center">Métricas Reales Trabajadas</h3><div class="grid grid-cols-3 gap-2 text-center"><div class="p-3 rounded-xl bg-[#0A0A0F]"><div class="text-lg font-black text-accent">${sum.volume} kg</div><div class="text-[10px] text-gray-400">Volumen Real</div></div><div class="p-3 rounded-xl bg-[#0A0A0F]"><div class="text-lg font-black text-emerald-400">${sum.sets}</div><div class="text-[10px] text-gray-400">Series Hechas</div></div><div class="p-3 rounded-xl bg-[#0A0A0F]"><div class="text-lg font-black text-blue-400">${sum.durationMin}m</div><div class="text-[10px] text-gray-400">Duración</div></div></div><div class="flex flex-wrap justify-center gap-2">${sum.muscles.length === 0 ? '<span class="text-xs text-gray-400">Sin músculos registrados</span>' : sum.muscles.map(m => `<span class="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-bold">${m}</span>`).join('')}</div></div>`,
            `<div class="p-8 rounded-3xl bg-[#181824] border border-[#28283C] text-center space-y-3"><div class="text-5xl">🏋️</div><h3 class="text-xl font-black">Volumen Efectivo: ${sum.volume} kg</h3><p class="text-sm text-gray-300">${Number(sum.volume) === 0 ? 'Sesión completada sin carga externa registrada.' : '¡Gran trabajo de sobrecarga acumulada hoy!'}</p></div>`,
            `<div class="p-8 rounded-3xl bg-[#181824] border border-[#28283C] space-y-3"><h3 class="text-base font-black">Series Completadas</h3>${sum.breakdown.length === 0 ? `<p class="text-xs text-gray-400">Ninguna serie fue marcada como completada (✓).</p>` : `<div class="space-y-1.5 text-xs">${sum.breakdown.map(b => `<div class="flex justify-between p-2 rounded bg-[#0A0A0F]"><span>${b.name}</span><span class="font-bold text-accent">${b.sets} series (${b.vol} kg)</span></div>`).join('')}</div>`}</div>`
        ];
        container.innerHTML = `
            <div class="max-w-md mx-auto space-y-4">
                ${slides[idx]}
                <div class="flex justify-between items-center">
                    <button onclick="stepSummarySlide(-1)" class="px-4 py-2 rounded-xl bg-[#181824] text-xs font-bold">← Anterior</button>
                    <span class="text-xs font-bold text-gray-400">Tarjeta ${idx + 1} de 5</span>
                    <button onclick="stepSummarySlide(1)" class="px-4 py-2 rounded-xl bg-[#181824] text-xs font-bold">Siguiente →</button>
                </div>
                <button onclick="openWorkoutSub('PRINCIPAL')" class="w-full py-3 rounded-xl bg-accent text-white font-extrabold text-xs">Cerrar Resumen</button>
            </div>
        `;
    }
}

window.beginActiveWorkoutSession = (routineId, dayNumber) => {
    const r = getAllRoutinesAndTemplates().find(x => Number(x.id) === Number(routineId));
    const d = (r?.days || []).find(x => Number(x.dayNumber) === Number(dayNumber)) || r?.days?.[0];
    if (!r || !d) return;

    window.navigate('workouts');
    wState.activeSession = {
        routineId: r.id,
        routineName: `${r.name} · ${d.dayName}`,
        dayNumber: d.dayNumber,
        startedAt: Date.now(),
        elapsedSeconds: 0,
        originalExercisesSnapshot: JSON.parse(JSON.stringify(d.exercises || [])),
        exercises: (d.exercises || []).map(ex => {
            const cat = getExById(ex.exerciseId);
            return {
                ...ex,
                imageUri: cat.img,
                sets: Array.from({ length: Number(ex.targetSets || 3) }, (_, i) => ({ setNumber: i + 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false }))
            };
        })
    };

    if (wState.timerInterval) clearInterval(wState.timerInterval);
    wState.timerInterval = setInterval(() => {
        if (wState.activeSession) {
            wState.activeSession.elapsedSeconds++;
            const clock = document.getElementById('live-workout-clock');
            if (clock) {
                clock.textContent = `${String(Math.floor(wState.activeSession.elapsedSeconds / 60)).padStart(2, '0')}:${String(wState.activeSession.elapsedSeconds % 60).padStart(2, '0')}`;
            }
        }
    }, 1000);

    wState.subScreen = 'SESION_ACTIVA';
    window.renderWorkouts();
};

window.openSetTypePickerModal = (exIdx, stIdx) => {
    const cur = wState.activeSession.exercises[exIdx].sets[stIdx].setType;
    const types = [
        { code: 'NORMAL', label: `Serie Normal (#${stIdx + 1})`, desc: 'Serie efectiva estándar de trabajo', color: 'text-white' },
        { code: 'W', label: 'W · Serie de Calentamiento (Warmup)', desc: 'Aproximación sin fatiga muscular', color: 'text-amber-400' },
        { code: 'D', label: 'D · Dropset (Serie Descendente)', desc: 'Reducción inmediata de peso sin descanso', color: 'text-cyan-400' },
        { code: 'F', label: 'F · Serie al Fallo Muscular', desc: 'Máximo esfuerzo hasta no poder completar otra rep', color: 'text-red-400' }
    ];
    window.openUniversalModal('Seleccionar Tipo de Serie', `<div class="space-y-2.5 text-xs">${types.map(t => `<button onclick="selectSetTypeOption(${exIdx}, ${stIdx}, '${t.code}')" class="w-full p-3.5 rounded-2xl bg-[#0A0A0F] border ${cur === t.code ? 'border-accent bg-accent/10' : 'border-[#28283C]'} hover:border-accent text-left"><p class="font-extrabold ${t.color}">${t.label}</p><p class="text-[11px] text-gray-400 mt-0.5">${t.desc}</p></button>`).join('')}</div>`);
};

window.selectSetTypeOption = (exIdx, stIdx, code) => { wState.activeSession.exercises[exIdx].sets[stIdx].setType = code; window.closeUniversalModal(); window.renderWorkouts(); };
window.updateActiveSetVal = (exIdx, stIdx, field, val) => { wState.activeSession.exercises[exIdx].sets[stIdx][field] = Math.max(0, Number(val || 0)); };
window.toggleActiveSetDone = (exIdx, stIdx) => {
    const st = wState.activeSession.exercises[exIdx].sets[stIdx];
    st.isCompleted = !st.isCompleted;
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
window.addSetToActive = (exIdx) => { const sets = wState.activeSession.exercises[exIdx].sets; sets.push({ setNumber: sets.length + 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false }); window.renderWorkouts(); };
window.removeLastSetFromActive = (exIdx) => { const sets = wState.activeSession.exercises[exIdx].sets; if (sets.length > 1) sets.pop(); window.renderWorkouts(); };
window.removeExerciseFromActive = (exIdx) => { wState.activeSession.exercises.splice(exIdx, 1); window.renderWorkouts(); };
window.openAddExerciseToActiveModal = () => {
    window.openUniversalModal('Añadir Ejercicio', `<div class="max-h-80 overflow-y-auto space-y-2">${EXERCISE_CATALOG.map(ex => `<button onclick="addExerciseToActiveSession(${ex.id})" class="w-full p-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] flex items-center space-x-3 text-left hover:border-accent"><img src="${ex.img}" class="w-10 h-10 rounded-lg bg-white p-0.5 object-contain"><div><p class="text-xs font-bold">${ex.name}</p><p class="text-[10px] text-gray-400">${ex.muscleGroup}</p></div></button>`).join('')}</div>`);
};
window.addExerciseToActiveSession = (exId) => {
    const cat = getExById(exId);
    wState.activeSession.exercises.push({ exerciseId: cat.id, exerciseName: cat.name, muscleGroup: cat.muscleGroup, equipment: cat.equipment, imageUri: cat.img, restSeconds: 90, sets: [{ setNumber: 1, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false }, { setNumber: 2, setType: 'NORMAL', weightKg: 0, reps: 0, isCompleted: false }] });
    window.closeUniversalModal();
    window.renderWorkouts();
};

window.attemptFinishWorkout = () => {
    const incomplete = wState.activeSession.exercises.filter(ex => ex.sets.some(s => !s.isCompleted));
    if (incomplete.length > 0) {
        window.openUniversalModal('Series sin marcar', `<div class="space-y-4 text-xs"><p class="font-bold text-gray-200">Solo se contabilizarán las series marcadas con el check (✓).</p><div class="flex gap-2"><button onclick="closeUniversalModal()" class="flex-1 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">Volver</button><button onclick="closeUniversalModal(); proceedToPorFinalizarScreen()" class="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold">Continuar</button></div></div>`);
    } else {
        proceedToPorFinalizarScreen();
    }
};

window.proceedToPorFinalizarScreen = () => {
    if (wState.timerInterval) clearInterval(wState.timerInterval);
    const totalSec = Math.max(1, wState.activeSession.elapsedSeconds);
    wState.finishDraft = { title: wState.activeSession.routineName, hours: Math.floor(totalSec / 3600), minutes: Math.floor((totalSec % 3600) / 60), seconds: totalSec % 60, photoDataUrl: '', notes: '' };
    wState.subScreen = 'POR_FINALIZAR';
    window.renderWorkouts();
};

window.handleWorkoutPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !wState.finishDraft) return;
    const reader = new FileReader();
    reader.onload = () => { wState.finishDraft.photoDataUrl = reader.result; window.renderWorkouts(); };
    reader.readAsDataURL(file);
};

window.checkRoutineReconciliationBeforeSave = () => finalizeAndSaveWorkoutSession(false);

window.finalizeAndSaveWorkoutSession = async () => {
    const s = wState.activeSession;
    const title = document.getElementById('fin-title')?.value || s.routineName;
    const durationSeconds = Math.max(1, (Number(document.getElementById('fin-h')?.value || 0) * 3600) + (Number(document.getElementById('fin-m')?.value || 0) * 60) + Number(document.getElementById('fin-s')?.value || 0));
    const notes = document.getElementById('fin-notes')?.value || '';
    const photoDataUrl = wState.finishDraft?.photoDataUrl || '';

    let totalVolumeKg = 0, totalCompletedSets = 0;
    const prs = [], breakdown = [], workedMuscles = new Set();

    s.exercises.forEach(ex => {
        const doneSets = ex.sets.filter(st => st.isCompleted === true);
        if (doneSets.length === 0) return;
        workedMuscles.add(ex.muscleGroup);
        totalCompletedSets += doneSets.length;
        let exVol = 0, best1RM = 0;
        doneSets.forEach(st => {
            const w = Math.max(0, Number(st.weightKg || 0));
            const r = Math.max(0, Number(st.reps || 0));
            exVol += (w * r);
            if (w > 0 && r > 0) best1RM = Math.max(best1RM, w * (1 + r / 30));
        });
        totalVolumeKg += exVol;
        if (best1RM > 0) prs.push(`${ex.exerciseName}: 1RM real ${best1RM.toFixed(1)} kg`);
        breakdown.push({ name: ex.exerciseName, sets: doneSets.length, vol: exVol.toFixed(0) });
    });

    const id = Date.now();
    await fsActions.setItem('workout_sessions', id, { routineId: s.routineId, routineName: title, dayNumber: s.dayNumber, startedAt: s.startedAt, endedAt: id, durationSeconds, totalVolumeKg, totalCompletedSets, photoDataUrl, xpEarned: 60, notes, isCompleted: true });
    const nextXp = Number(window.state.profile?.xp || 0) + 60;
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });

    wState.summaryData = { title, photoDataUrl, volume: totalVolumeKg.toFixed(0), sets: totalCompletedSets, durationMin: Math.max(1, Math.round(durationSeconds / 60)), muscles: Array.from(workedMuscles), prs, breakdown };
    wState.summarySlideIdx = 0;
    wState.activeSession = null;
    wState.subScreen = 'RESUMEN_SESION';
    window.renderWorkouts();
};

window.stepSummarySlide = (d) => { wState.summarySlideIdx = (wState.summarySlideIdx + d + 5) % 5; window.renderWorkouts(); };
window.discardActiveWorkout = () => {
    if (!confirm('¿Descartar este entrenamiento sin guardar?')) return;
    if (wState.timerInterval) clearInterval(wState.timerInterval);
    if (wState.restInterval) clearInterval(wState.restInterval);
    wState.activeSession = null;
    wState.finishDraft = null;
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};
