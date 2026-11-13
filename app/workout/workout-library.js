import { fsActions } from '../firebase-sync.js?v=5';
import { EXERCISE_CATALOG, WEAVAX_30_TEMPLATES, getExById, mkDay, pPush } from './workout-catalog.js';
import { wState, getUserSavedRoutines, getAllRoutinesAndTemplates, getWeeklyWorkoutStats, getTodayScheduledWorkoutInfo } from './workout-state.js';

export function renderLibraryAndHub(container, minimizedBannerHtml) {
    const userLibraryRoutines = getUserSavedRoutines();
    const primaryRoutine = userLibraryRoutines.find(r => Number(r.id) === Number(wState.selectedRoutineId)) || userLibraryRoutines[0] || null;
    const weekStats = getWeeklyWorkoutStats();
    const targetDays = Number(primaryRoutine?.targetDaysPerWeek || 4);

    if (wState.subScreen === 'PRINCIPAL') {
        container.innerHTML = `
            <div class="space-y-8">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-4 pb-2">
                    <div>
                        <h3 class="text-2xl font-black tracking-tight">Entrenamiento</h3>
                        <p class="text-xs text-gray-400 mt-1">Tu programación activa, progreso semanal y biblioteca</p>
                    </div>
                    <div class="flex flex-wrap gap-2.5">
                        <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'MIS_RUTINAS')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold">📚 Biblioteca de Rutinas</button>
                        <button onclick="openWorkoutSub('BANCO_EJERCICIOS')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold">💪 Ejercicios</button>
                        <button onclick="openWorkoutSub('HISTORIAL')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold">🕒 Historial</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Meta de la Semana</span>
                        <div class="flex items-baseline justify-between mt-2">
                            <span class="text-2xl font-black text-accent">${weekStats.count} / ${targetDays}</span>
                            <span class="text-xs text-gray-400">entrenamientos</span>
                        </div>
                        <div class="w-full h-2 bg-gray-200 dark:bg-[#0A0A0F] rounded-full mt-3.5 overflow-hidden">
                            <div class="h-full bg-accent transition-all" style="width:${Math.min(100, Math.round((weekStats.count / targetDays) * 100))}%"></div>
                        </div>
                    </div>
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Volumen Semanal</span>
                        <div class="text-2xl font-black mt-2">${weekStats.volume.toLocaleString('es-BO')} <span class="text-sm font-normal text-gray-400">kg</span></div>
                        <p class="text-[11px] text-emerald-400 mt-2">Registrado en series completadas</p>
                    </div>
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sesiones Totales</span>
                        <div class="text-2xl font-black mt-2">${(window.state.workout_sessions || []).length} <span class="text-sm font-normal text-gray-400">completadas</span></div>
                        <p class="text-[11px] text-purple-400 mt-2">Sincronizadas en tu cuenta</p>
                    </div>
                </div>

                ${!primaryRoutine ? `
                    <div class="p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] text-center space-y-4">
                        <span class="text-3xl">🏋️</span>
                        <h4 class="text-lg font-black">Aún no tienes una Rutina Principal en tu Biblioteca</h4>
                        <p class="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">Para seleccionar tu rutina principal, primero crea una rutina propia o entra a Plantillas WeaVax y copia tu favorita a "Mis Rutinas".</p>
                        <div class="flex flex-wrap justify-center gap-3 pt-2">
                            <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">Explorar Plantillas WeaVax</button>
                            <button onclick="openRoutineCreatorModal()" class="px-5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">+ Crear Mi Propia Rutina</button>
                        </div>
                    </div>
                ` : `
                    <div class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-6">
                        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#28283C] pb-5">
                            <div>
                                <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/15 text-accent">Rutina Principal Activa</span>
                                <h4 class="text-xl font-black mt-2.5">${primaryRoutine.name}</h4>
                                <p class="text-xs text-gray-400 mt-1">${primaryRoutine.description || ''}</p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2.5">
                                <select onchange="selectPrimaryRoutine(this.value)" class="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-xs font-bold">
                                    ${userLibraryRoutines.map(r => `<option value="${r.id}" ${Number(r.id) === Number(primaryRoutine.id) ? 'selected' : ''}>${r.name} (${r.targetDaysPerWeek || 4} días)</option>`).join('')}
                                </select>
                                <button onclick="openRoutineDetailView(${primaryRoutine.id})" class="px-4 py-2.5 rounded-xl bg-accent/15 text-accent text-xs font-bold">Detalles</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${(primaryRoutine.days || []).map(d => {
                                const completedThisWeek = weekStats.sessions.some(s => Number(s.routineId) === Number(primaryRoutine.id) && Number(s.dayNumber) === Number(d.dayNumber));
                                return `
                                    <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border ${completedThisWeek ? 'border-emerald-500/50' : 'border-gray-200 dark:border-[#28283C]'} flex items-center justify-between gap-3">
                                        <div onclick="openDayDetailView(${primaryRoutine.id}, ${d.dayNumber})" class="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0">
                                            <div class="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent shrink-0 overflow-hidden">
                                                ${d.dayImageUri ? `<img src="${d.dayImageUri}" class="w-full h-full object-cover">` : d.dayName.charAt(0)}
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <div class="flex items-center space-x-1.5">
                                                    <p class="text-xs font-extrabold truncate">${d.dayName}</p>
                                                    ${completedThisWeek ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">✓</span>' : ''}
                                                </div>
                                                <p class="text-[11px] text-gray-400 mt-1">${(d.exercises || []).length} ejercicios · ~${primaryRoutine.estimatedDurationMinutes || 60} min</p>
                                            </div>
                                        </div>
                                        <button onclick="beginActiveWorkoutSession(${primaryRoutine.id}, ${d.dayNumber})" class="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-lg hover:opacity-90 shrink-0">▶</button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `}

                <div class="p-6 rounded-3xl bg-gradient-to-r from-[#181824] via-[#1E1B36] to-[#181824] border border-accent/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-start space-x-4">
                        <div class="w-12 h-12 rounded-2xl bg-accent/20 border border-accent flex items-center justify-center text-2xl shrink-0">🤖</div>
                        <div>
                            <div class="flex items-center space-x-2">
                                <h4 class="text-base font-black text-white">Entrenador Personal IA · Vax Coach</h4>
                                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Activo</span>
                            </div>
                            <p class="text-xs text-gray-300 mt-1">Analiza tu fatiga muscular y te sugiere qué día entrenar hoy con sobrecarga progresiva.</p>
                        </div>
                    </div>
                    <button onclick="openWorkoutSub('COACH_IA')" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shrink-0 shadow-lg">Abrir Coach IA →</button>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-base font-extrabold">Mis Rutinas (${userLibraryRoutines.length})</h4>
                            <p class="text-xs text-gray-400 mt-0.5">Tus programas guardados listos para usar</p>
                        </div>
                        <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="text-xs font-bold text-accent hover:underline">Ir a Plantillas WeaVax →</button>
                    </div>
                    ${userLibraryRoutines.length === 0 ? `<p class="text-xs text-gray-400">Todavía no tienes rutinas en tu biblioteca personal.</p>` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            ${userLibraryRoutines.map(r => renderRoutineCard(r, 'grid', false)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'LIBRERIA_RUTINAS') {
        const categories = ['Todas', 'PPL (Push Pull Legs)', 'Torso / Pierna', 'Full Body', 'Énfasis Específico', 'Calistenia y Funcional', 'Anime Aesthetic & Superhero', 'Híbridos y Acondicionamiento'];
        const isTemplatesTab = wState.libraryTab === 'PLANTILLAS';
        const listToShow = isTemplatesTab
            ? WEAVAX_30_TEMPLATES.filter(t => wState.categoryFilter === 'Todas' || t.categoryGroup === wState.categoryFilter)
            : userLibraryRoutines;

        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-3">
                        <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                        <div>
                            <h3 class="text-xl font-black">Biblioteca de Rutinas</h3>
                            <p class="text-xs text-gray-400">Gestiona tus rutinas o copia plantillas WeaVax a tu biblioteca</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="setLibraryViewMode('grid')" class="px-3 py-2 rounded-xl border ${wState.viewMode === 'grid' ? 'bg-accent text-white border-accent' : 'border-[#28283C]'} text-xs font-bold">⊞ Cuadrícula</button>
                        <button onclick="setLibraryViewMode('list')" class="px-3 py-2 rounded-xl border ${wState.viewMode === 'list' ? 'bg-accent text-white border-accent' : 'border-[#28283C]'} text-xs font-bold">☰ Lista</button>
                    </div>
                </div>

                <div class="flex gap-2.5 border-b border-gray-200 dark:border-[#28283C] pb-4">
                    <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'MIS_RUTINAS')" class="px-4 py-2.5 rounded-xl text-xs font-bold ${!isTemplatesTab ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Mis Rutinas (${userLibraryRoutines.length})</button>
                    <button onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="px-4 py-2.5 rounded-xl text-xs font-bold ${isTemplatesTab ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Plantillas WeaVax</button>
                </div>

                ${isTemplatesTab ? `
                    <div class="flex flex-wrap gap-2">
                        ${categories.map(c => `<button onclick="setTemplateCategory('${c}')" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${wState.categoryFilter === c ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">${c}</button>`).join('')}
                    </div>
                ` : ''}

                <div class="${wState.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}">
                    ${!isTemplatesTab ? `
                        <div onclick="openRoutineCreatorModal()" class="p-6 rounded-2xl border-2 border-dashed border-accent/50 hover:border-accent flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px]">
                            <span class="text-2xl text-accent font-black">+</span>
                            <p class="text-sm font-extrabold text-accent mt-1">Crear nueva rutina</p>
                        </div>
                    ` : ''}
                    ${listToShow.map(r => renderRoutineCard(r, wState.viewMode, isTemplatesTab)).join('')}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'DETALLE_RUTINA' && wState.viewingRoutine) {
        const r = wState.viewingRoutine;
        const isSaved = userLibraryRoutines.some(u => Number(u.id) === Number(r.id) || u.name === r.name);
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <button onclick="openWorkoutSub('LIBRERIA_RUTINAS')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    ${isSaved
                        ? `<button onclick="selectPrimaryRoutine(${r.id})" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">★ Elegir como Rutina Principal</button>`
                        : `<button onclick="copyTemplateToLibrary(${r.id})" class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">📥 Copiar a mi biblioteca</button>`}
                </div>
                <div class="rounded-3xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                    <div class="h-48 bg-cover bg-center relative" style="background-image:url('${r.imageUri || pPush}')">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#181824] via-[#181824]/40 to-transparent"></div>
                        <div class="absolute bottom-4 left-6 right-6">
                            <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || 4} días/sem</span>
                            <h3 class="text-2xl font-black text-white mt-2">${r.name}</h3>
                            <p class="text-xs text-gray-300 mt-1">${r.description || ''}</p>
                        </div>
                    </div>
                    <div class="p-6 space-y-3">
                        ${(r.days || []).map(d => `
                            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
                                <div onclick="openDayDetailView(${r.id}, ${d.dayNumber})" class="flex items-center space-x-3.5 cursor-pointer flex-1">
                                    <div class="w-12 h-12 rounded-xl bg-accent/20 text-accent font-black flex items-center justify-center overflow-hidden">${d.dayName.charAt(0)}</div>
                                    <div>
                                        <p class="text-sm font-extrabold">${d.dayName}</p>
                                        <p class="text-xs text-gray-400 mt-0.5">${(d.exercises || []).map(e => e.exerciseName).slice(0, 3).join(', ')}...</p>
                                    </div>
                                </div>
                                <button onclick="beginActiveWorkoutSession(${r.id}, ${d.dayNumber})" class="w-10 h-10 rounded-full bg-accent text-white font-bold flex items-center justify-center">▶</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'DETALLE_ENTRENAMIENTO' && wState.viewingDayPlan) {
        const r = wState.viewingRoutine;
        const d = wState.viewingDayPlan;
        const muscles = Array.from(new Set((d.exercises || []).map(e => e.muscleGroup)));
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <button onclick="openRoutineDetailView(${r.id})" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <button onclick="beginActiveWorkoutSession(${r.id}, ${d.dayNumber})" class="px-5 py-2.5 rounded-full bg-accent text-white text-xs font-extrabold">▶ Iniciar Entrenamiento</button>
                </div>
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <h3 class="text-xl font-black">${d.dayName}</h3>
                    <div class="flex flex-wrap gap-2">${muscles.map(m => `<span class="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">${m}</span>`).join('')}</div>
                    <div class="space-y-3">
                        ${(d.exercises || []).map(ex => {
                            const catEx = getExById(ex.exerciseId);
                            return `
                                <div onclick="showExerciseAnatomyModal(${catEx.id})" class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between cursor-pointer hover:border-accent">
                                    <div class="flex items-center space-x-4">
                                        <img src="${catEx.img}" class="w-14 h-14 rounded-xl object-contain bg-white p-1">
                                        <div><p class="text-sm font-bold">${ex.exerciseName}</p><p class="text-xs text-gray-400">${ex.targetSets} series × ${ex.targetRepsRange} reps</p></div>
                                    </div>
                                    <span class="text-xs text-accent font-bold">Anatomía →</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'BANCO_EJERCICIOS') {
        const muscles = ['Todos', 'Pecho', 'Espalda', 'Cuádriceps', 'Isquiosurales/Glúteos', 'Hombros', 'Bíceps', 'Tríceps', 'Core', 'Pantorrillas'];
        const filtered = EXERCISE_CATALOG.filter(e =>
            (wState.muscleFilter === 'Todos' || e.muscleGroup === wState.muscleFilter) &&
            e.name.toLowerCase().includes(wState.searchQuery.toLowerCase())
        );
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center justify-between gap-3">
                    <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <input oninput="filterExerciseBank(this.value)" value="${wState.searchQuery}" placeholder="Buscar ejercicio..." class="flex-1 max-w-md px-4 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs">
                </div>
                <div class="flex flex-wrap gap-2">${muscles.map(m => `<button onclick="setMuscleBankFilter('${m}')" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${wState.muscleFilter === m ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">${m}</button>`).join('')}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${filtered.map(ex => `
                        <div onclick="showExerciseAnatomyModal(${ex.id})" class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center space-x-3.5 cursor-pointer hover:border-accent">
                            <img src="${ex.img}" class="w-14 h-14 rounded-xl object-contain bg-white p-1 shrink-0">
                            <div><p class="text-xs font-extrabold">${ex.name}</p><p class="text-[10px] text-gray-400 mt-1">${ex.muscleGroup} · ${ex.equipment}</p></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'HISTORIAL') {
        const list = window.state.workout_sessions || [];
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center justify-between">
                    <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <h3 class="text-lg font-black">Historial (${list.length})</h3>
                </div>
                <div class="space-y-3">
                    ${list.length === 0 ? '<p class="text-xs text-gray-400">Sin entrenamientos registrados.</p>' : list.map(s => `
                        <div class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex justify-between items-center">
                            <div class="flex items-center space-x-3.5">
                                ${s.photoDataUrl ? `<img src="${s.photoDataUrl}" class="w-12 h-12 rounded-xl object-cover">` : ''}
                                <div>
                                    <p class="text-sm font-extrabold">${s.routineName}</p>
                                    <p class="text-xs text-gray-400 mt-0.5">${new Date(Number(s.startedAt || Date.now())).toLocaleDateString('es-BO')} · ${Math.round(Number(s.durationSeconds || 0) / 60)} min · ${Number(s.totalVolumeKg || 0).toFixed(0)} kg · ${s.totalCompletedSets || 0} series</p>
                                </div>
                            </div>
                            <button onclick="deleteDocItem('workout_sessions', '${s.docId}')" class="text-xs text-red-400">Eliminar</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'COACH_IA') {
        const nextInfo = getTodayScheduledWorkoutInfo();
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex items-center justify-between">
                    <button onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <h3 class="text-lg font-black">🤖 Vax Coach</h3>
                </div>
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-accent/40 space-y-4">
                    ${!nextInfo ? `<p class="text-xs text-gray-300">Copia o crea una rutina en tu biblioteca para recibir recomendaciones personalizadas.</p>` : `
                        <div class="p-4 rounded-2xl bg-[#0A0A0F] border border-[#28283C] flex items-center justify-between">
                            <div>
                                <span class="text-[10px] font-bold text-accent uppercase">Entrenamiento recomendado hoy</span>
                                <h4 class="text-base font-black mt-0.5">${nextInfo.dayName}</h4>
                                <p class="text-xs text-gray-400">${nextInfo.exercisesCount} ejercicios · ~${nextInfo.estimatedMin} min</p>
                            </div>
                            <button onclick="beginActiveWorkoutSession(${nextInfo.routineId}, ${nextInfo.dayNumber})" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold">▶ Entrenar</button>
                        </div>
                    `}
                </div>
            </div>
        `;
    }
}

function renderRoutineCard(r, mode = 'grid', isSystemTemplateCard = false) {
    const actionBtn = isSystemTemplateCard
        ? `<button onclick="event.stopPropagation(); copyTemplateToLibrary(${r.id})" class="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all">📥 Copiar a mi biblioteca</button>`
        : `<button onclick="event.stopPropagation(); selectPrimaryRoutine(${r.id})" class="flex-1 py-2 px-3 rounded-xl bg-accent/15 text-accent hover:bg-accent hover:text-white text-xs font-bold transition-all">★ Elegir Principal</button>`;

    if (mode === 'list') {
        return `
            <div onclick="openRoutineDetailView(${r.id})" class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center justify-between gap-4 cursor-pointer hover:border-accent">
                <div class="flex items-center space-x-3.5">
                    <img src="${r.imageUri || pPush}" class="w-16 h-16 rounded-xl object-cover">
                    <div><h5 class="text-sm font-extrabold">${r.name}</h5><p class="text-xs text-gray-400">${(r.days || []).length} días · ${r.focusCategory || 'Hipertrofia'}</p></div>
                </div>
                <div class="shrink-0">${actionBtn}</div>
            </div>
        `;
    }
    return `
        <div onclick="openRoutineDetailView(${r.id})" class="rounded-2xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-col justify-between cursor-pointer hover:border-accent transition-all">
            <div class="h-36 bg-cover bg-center relative" style="background-image:url('${r.imageUri || pPush}')">
                <div class="absolute inset-0 bg-gradient-to-t from-[#181824] to-transparent"></div>
                <span class="absolute bottom-2 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || 4}d</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div><h5 class="font-extrabold text-sm">${r.name}</h5><p class="text-[11px] text-gray-400 mt-1 line-clamp-2">${r.description || ''}</p></div>
                <div class="flex gap-2 mt-4">${actionBtn}</div>
            </div>
        </div>
    `;
}

window.copyTemplateToLibrary = async (templateId) => {
    const tpl = WEAVAX_30_TEMPLATES.find(t => Number(t.id) === Number(templateId));
    if (!tpl) return;
    const newId = Date.now();
    await fsActions.setItem('workout_routines', newId, { ...tpl, id: newId, isSystemTemplate: false, createdAt: newId });
    wState.selectedRoutineId = newId;
    localStorage.setItem('weavax_primary_routine_id', String(newId));
    wState.libraryTab = 'MIS_RUTINAS';
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};

window.selectPrimaryRoutine = (routineId) => {
    if (!getUserSavedRoutines().some(r => Number(r.id) === Number(routineId))) {
        return alert('Primero copia esta plantilla a tu biblioteca para elegirla como principal.');
    }
    wState.selectedRoutineId = Number(routineId);
    localStorage.setItem('weavax_primary_routine_id', String(routineId));
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};

window.openWorkoutSub = (sub, tab) => { wState.subScreen = sub; if (tab) wState.libraryTab = tab; window.renderWorkouts(); };
window.setLibraryViewMode = (m) => { wState.viewMode = m; window.renderWorkouts(); };
window.setTemplateCategory = (c) => { wState.categoryFilter = c; window.renderWorkouts(); };
window.setMuscleBankFilter = (m) => { wState.muscleFilter = m; window.renderWorkouts(); };
window.filterExerciseBank = (q) => { wState.searchQuery = q; window.renderWorkouts(); };
window.openRoutineDetailView = (id) => { wState.viewingRoutine = getAllRoutinesAndTemplates().find(r => Number(r.id) === Number(id)); wState.subScreen = 'DETALLE_RUTINA'; window.renderWorkouts(); };
window.openDayDetailView = (rId, dNum) => {
    const r = getAllRoutinesAndTemplates().find(x => Number(x.id) === Number(rId));
    if (!r) return;
    wState.viewingRoutine = r;
    wState.viewingDayPlan = (r.days || []).find(d => Number(d.dayNumber) === Number(dNum)) || r.days[0];
    wState.subScreen = 'DETALLE_ENTRENAMIENTO';
    window.renderWorkouts();
};
window.showExerciseAnatomyModal = (exId) => {
    const ex = getExById(exId);
    window.openUniversalModal(ex.name, `<div class="space-y-3 text-center"><img src="${ex.img}" class="w-48 h-48 mx-auto rounded-2xl object-contain bg-white p-2"><div class="flex justify-center gap-2 text-xs font-bold"><span class="px-3 py-1 rounded-full bg-accent/20 text-accent">${ex.muscleGroup}</span><span class="px-3 py-1 rounded-full bg-[#0A0A0F] border border-[#28283C]">${ex.equipment}</span></div></div>`);
};
window.openRoutineCreatorModal = () => {
    window.openUniversalModal('Crear Nueva Rutina', `
        <form onsubmit="saveNewUserRoutine(event)" class="space-y-3 text-xs">
            <input id="nr-name" required placeholder="Nombre de tu rutina" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="nr-desc" placeholder="Descripción" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="nr-focus" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]"><option value="Hipertrofia">Hipertrofia</option><option value="Fuerza">Fuerza</option><option value="Calistenia">Calistenia</option></select>
                <input id="nr-days" type="number" min="1" max="7" value="4" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <input id="nr-day1" value="Día 1: Entrenamiento A" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold">Guardar en Mis Rutinas</button>
        </form>
    `);
};
window.saveNewUserRoutine = async (e) => {
    e.preventDefault();
    const id = Date.now();
    await fsActions.setItem('workout_routines', id, {
        name: document.getElementById('nr-name').value.trim(),
        description: document.getElementById('nr-desc').value.trim(),
        focusCategory: document.getElementById('nr-focus').value,
        targetDaysPerWeek: Number(document.getElementById('nr-days').value || 4),
        isSystemTemplate: false,
        imageUri: pPush,
        days: [mkDay(1, document.getElementById('nr-day1').value.trim() || 'Día 1', pPush, [[1,4,"8-10",90],[14,4,"8-10",90],[43,4,"12-15",60]])]
    });
    window.closeUniversalModal();
    wState.selectedRoutineId = id;
    localStorage.setItem('weavax_primary_routine_id', String(id));
    window.renderWorkouts();
};
