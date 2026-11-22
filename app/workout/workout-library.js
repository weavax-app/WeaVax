import { fsActions } from '../firebase-sync.js';
import {
    wState,
    EXERCISES_LIST,
    TEMPLATES_LIST,
    findExerciseInfo,
    getUserSavedRoutines,
    getAllRoutinesAndTemplates,
    getActiveMainRoutine,
    getCompletedSessionsList,
    getTodayScheduledWorkoutInfo,
    getWeeklyWorkoutStats
} from './workout-state.js';
import { renderRoutineEditorView } from './workout-editor.js';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800';
const WEAVAX_PROXY_URL = 'https://weavax-ai-proxy.onrender.com/api/ai';
const WEAVAX_APP_SECRET = 'L4_fr4se3_qu3_t3_113v4r4_41_3x1t0';

export function renderLibraryAndHub(container, minimizedBannerHtml) {
    if (wState.subScreen === 'CREAR_EDITAR_RUTINA') {
        renderRoutineEditorView(container);
        return;
    }
    if (wState.subScreen === 'DETALLE_EJERCICIO' && wState.viewingExercise) {
        const ex = wState.viewingExercise;
        const stats = getExerciseHistoryAndStats(ex.id, ex.name);
        const recentEntries = stats.historyEntries.slice(0, 12);

        const SET_BADGES = {
            W:  { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/40', label: 'W' },
            F:  { bg: 'bg-red-500/20 text-red-400 border-red-500/40', label: 'F' },
            L:  { bg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40', label: 'L' },
            R:  { bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', label: 'R' },
            D:  { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/40', label: 'D' },
            N:  { bg: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40', label: 'N' },
            P:  { bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40', label: 'P' },
            M:  { bg: 'bg-pink-500/20 text-pink-400 border-pink-500/40', label: 'M' },
            FD: { bg: 'bg-lime-500/20 text-lime-400 border-lime-500/40', label: 'FD' },
            T:  { bg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', label: 'T' },
            B:  { bg: 'bg-purple-500/20 text-purple-400 border-purple-500/40', label: 'B' }
        };

        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center justify-between gap-3">
                    <button type="button" onclick="returnFromExerciseDetail()" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <span class="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-accent/15 text-accent">${ex.muscleGroup} · ${ex.equipment}</span>
                </div>

                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                    <div class="md:col-span-4 flex justify-center">
                        <div class="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl bg-white p-3 flex items-center justify-center shadow-inner">
                            <img src="${ex.img}" class="max-h-full max-w-full object-contain">
                        </div>
                    </div>
                    <div class="md:col-span-8 space-y-4">
                        <div>
                            <h3 class="text-2xl font-black tracking-tight">${ex.name}</h3>
                            <p class="text-xs text-gray-400 mt-1">Grupo muscular principal: <strong class="text-white">${ex.muscleGroup}</strong> · Equipamiento: <strong class="text-white">${ex.equipment}</strong></p>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                            <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C]">
                                <span class="text-[10px] font-bold uppercase text-amber-400">Récord 1RM Est.</span>
                                <p class="text-lg font-black mt-1">${stats.best1RM > 0 ? `${stats.best1RM.toFixed(1)} kg` : '—'}</p>
                            </div>
                            <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C]">
                                <span class="text-[10px] font-bold uppercase text-accent">Peso Máximo</span>
                                <p class="text-lg font-black mt-1">${stats.maxWeight > 0 ? `${stats.maxWeight} kg` : '—'}</p>
                            </div>
                            <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C]">
                                <span class="text-[10px] font-bold uppercase text-emerald-400">Series Totales</span>
                                <p class="text-lg font-black mt-1">${stats.totalSets}</p>
                            </div>
                            <div class="p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-[#28283C]">
                                <span class="text-[10px] font-bold uppercase text-blue-400">Volumen Total</span>
                                <p class="text-lg font-black mt-1">${Math.round(stats.totalVolume).toLocaleString('es-BO')} kg</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div class="flex items-center justify-between">
                        <h4 class="text-base font-black">Historial y Progresión (${stats.historyEntries.length} sesiones)</h4>
                        <span class="text-xs text-gray-400">Últimas marcas registradas</span>
                    </div>

                    ${recentEntries.length === 0 ? `
                        <p class="text-xs text-gray-400 py-4">Aún no has completado series de este ejercicio en tus sesiones registradas.</p>
                    ` : `
                        <div class="space-y-3">
                            ${recentEntries.map(entry => `
                                <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-2.5">
                                    <div class="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p class="text-xs font-extrabold">${entry.routineName}</p>
                                            <p class="text-[11px] text-gray-400">${new Date(entry.date).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                        </div>
                                        <div class="flex gap-2 text-[11px] font-bold">
                                            <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400">1RM: ${entry.best1RM.toFixed(1)} kg</span>
                                            <span class="px-2.5 py-1 rounded-lg bg-accent/15 text-accent">Vol: ${Math.round(entry.volume)} kg</span>
                                        </div>
                                    </div>
                                    <div class="flex flex-wrap gap-2">
                                        ${entry.sets.map((st, idx) => {
                                            const badge = SET_BADGES[st.setType];
                                            const tag = badge
                                                ? `<span class="px-1.5 py-0.5 rounded border ${badge.bg} text-[10px] font-black">${badge.label}</span>`
                                                : `<span class="text-gray-400 font-bold">#${idx + 1}</span>`;
                                            return `<div class="px-2.5 py-1 rounded-lg bg-[#181824] border border-[#28283C] text-xs flex items-center space-x-1.5">${tag}<span class="font-extrabold text-white">${st.weightKg} kg × ${st.reps}</span></div>`;
                                        }).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
        return;
    }

    const userLibraryRoutines = getUserSavedRoutines();
    const primaryRoutine = getActiveMainRoutine();
    const weekStats = getWeeklyWorkoutStats();
    const allCompletedSessions = getCompletedSessionsList();
    const targetDays = Number(primaryRoutine?.targetDaysPerWeek || 4);

    if (wState.subScreen === 'PRINCIPAL') {
        const totalLifetimeKg = allCompletedSessions.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0);
        container.innerHTML = `
            <div class="space-y-8">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-4 pb-2">
                    <div>
                        <h3 class="text-2xl font-black tracking-tight">Entrenamiento</h3>
                        <p class="text-xs text-gray-400 mt-1">Tu programación activa, progreso semanal y biblioteca sincronizada</p>
                    </div>
                    <div class="flex flex-wrap gap-2.5">
                        <button type="button" onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'MIS_RUTINAS')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold">📚 Biblioteca de Rutinas</button>
                        <button type="button" onclick="openWorkoutSub('BANCO_EJERCICIOS')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold">💪 Ejercicios (${EXERCISES_LIST.length})</button>
                        <button type="button" onclick="openWorkoutSub('HISTORIAL')" class="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] hover:border-accent text-xs font-bold">🕒 Historial (${allCompletedSessions.length})</button>
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
                            <div class="h-full bg-accent transition-all" style="width:${Math.min(100, Math.round((weekStats.count / Math.max(1, targetDays)) * 100))}%"></div>
                        </div>
                    </div>
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Volumen Semanal</span>
                        <div class="text-2xl font-black mt-2">${weekStats.volume.toLocaleString('es-BO')} <span class="text-sm font-normal text-gray-400">kg</span></div>
                        <p class="text-[11px] text-emerald-400 mt-2">Histórico: ${Math.round(totalLifetimeKg / 1000).toLocaleString('es-BO')} ton</p>
                    </div>
                    <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sesiones Totales</span>
                        <div class="text-2xl font-black mt-2">${allCompletedSessions.length} <span class="text-sm font-normal text-gray-400">completadas</span></div>
                        <p class="text-[11px] text-purple-400 mt-2">Sincronizadas con Android</p>
                    </div>
                </div>

                ${!primaryRoutine ? `
                    <div class="p-8 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] text-center space-y-4">
                        <span class="text-3xl">🏋️</span>
                        <h4 class="text-lg font-black">Selecciona o crea tu Rutina Principal</h4>
                        <div class="flex flex-wrap justify-center gap-3 pt-2">
                            <button type="button" onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">Explorar Plantillas WeaVax</button>
                            <button type="button" onclick="openRoutineCreatorModal()" class="px-5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs font-bold">+ Crear Mi Propia Rutina</button>
                        </div>
                    </div>
                ` : `
                    <div class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-6">
                        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-[#28283C] pb-5">
                            <div>
                                <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/15 text-accent">${primaryRoutine.isCustom ? 'Rutina Principal Activa' : 'Programa Sugerido'}</span>
                                <h4 class="text-xl font-black mt-2.5">${primaryRoutine.name}</h4>
                                <p class="text-xs text-gray-400 mt-1">${primaryRoutine.description || ''}</p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2.5">
                                ${userLibraryRoutines.length > 0 ? `
                                    <select onchange="selectPrimaryRoutine(this.value)" class="px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-xs font-bold">
                                        ${userLibraryRoutines.map(r => `<option value="${r.id}" ${Number(r.id) === Number(primaryRoutine.id) ? 'selected' : ''}>${r.name} (${r.targetDaysPerWeek || r.days.length} días)</option>`).join('')}
                                    </select>
                                ` : ''}
                                ${primaryRoutine.isCustom ? `<button type="button" onclick="openRoutineEditor(${primaryRoutine.id})" class="px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] hover:border-accent text-xs font-bold">✎ Editar</button>` : ''}
                                <button type="button" onclick="openRoutineDetailView(${primaryRoutine.id})" class="px-4 py-2.5 rounded-xl bg-accent/15 text-accent text-xs font-bold">Ver Programa</button>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            ${(primaryRoutine.days || []).map(d => {
                                const completedThisWeek = weekStats.sessions.some(s => String(s.routineId) === String(primaryRoutine.id) && Number(s.dayNumber) === Number(d.dayNumber));
                                return `
                                    <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border ${completedThisWeek ? 'border-emerald-500/50' : 'border-gray-200 dark:border-[#28283C]'} flex items-center justify-between gap-3">
                                        <div onclick="openDayDetailView(${primaryRoutine.id}, ${d.dayNumber})" class="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0">
                                            <div class="w-12 h-12 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent shrink-0 overflow-hidden">
                                                ${d.dayImageUri ? `<img src="${d.dayImageUri}" class="w-full h-full object-cover">` : (d.dayName || 'D').charAt(0)}
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <div class="flex items-center space-x-1.5">
                                                    <p class="text-xs font-extrabold truncate">${d.dayName}</p>
                                                    ${completedThisWeek ? '<span class="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">✓</span>' : ''}
                                                </div>
                                                <p class="text-[11px] text-gray-400 mt-1">${(d.exercises || []).length} ejercicios · ~${primaryRoutine.estimatedDurationMinutes || 60} min</p>
                                            </div>
                                        </div>
                                        <button type="button" onclick="beginActiveWorkoutSession(${primaryRoutine.id}, ${d.dayNumber})" class="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold shadow-lg hover:opacity-90 shrink-0">▶</button>
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
                                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Groq IA Activo</span>
                            </div>
                            <p class="text-xs text-gray-300 mt-1">Genera rutinas completas a medida con IA y analiza tu fatiga muscular y sobrecarga progresiva.</p>
                        </div>
                    </div>
                    <button type="button" onclick="openWorkoutSub('COACH_IA')" class="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shrink-0 shadow-lg">Abrir Coach IA →</button>
                </div>

                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="text-base font-extrabold">Mis Rutinas (${userLibraryRoutines.length})</h4>
                            <p class="text-xs text-gray-400 mt-0.5">Tus programas personales sincronizados en Firestore</p>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" onclick="openRoutineCreatorModal()" class="text-xs font-bold text-emerald-400 hover:underline">+ Crear Rutina</button>
                            <button type="button" onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="text-xs font-bold text-accent hover:underline">Plantillas WeaVax →</button>
                        </div>
                    </div>
                    ${userLibraryRoutines.length === 0 ? `<p class="text-xs text-gray-400">Aún no tienes rutinas guardadas en "Mis Rutinas".</p>` : `
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">${userLibraryRoutines.map(r => renderRoutineCard(r, 'grid', false)).join('')}</div>
                    `}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'LIBRERIA_RUTINAS') {
        const categories = ['Todas', 'PPL (Push Pull Legs)', 'Torso / Pierna', 'Full Body', 'Énfasis Específico', 'Calistenia y Funcional', 'Anime Aesthetic & Superhero', 'Híbridos y Acondicionamiento'];
        const isTemplatesTab = wState.libraryTab === 'PLANTILLAS';
        const listToShow = isTemplatesTab ? TEMPLATES_LIST.filter(t => wState.categoryFilter === 'Todas' || t.categoryGroup === wState.categoryFilter) : userLibraryRoutines;

        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center space-x-3">
                        <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                        <div><h3 class="text-xl font-black">Biblioteca de Rutinas</h3><p class="text-xs text-gray-400">Gestiona tus rutinas o copia plantillas WeaVax</p></div>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="setLibraryViewMode('grid')" class="px-3 py-2 rounded-xl border ${wState.viewMode === 'grid' ? 'bg-accent text-white border-accent' : 'border-[#28283C]'} text-xs font-bold">⊞ Cuadrícula</button>
                        <button type="button" onclick="setLibraryViewMode('list')" class="px-3 py-2 rounded-xl border ${wState.viewMode === 'list' ? 'bg-accent text-white border-accent' : 'border-[#28283C]'} text-xs font-bold">☰ Lista</button>
                    </div>
                </div>
                <div class="flex gap-2.5 border-b border-gray-200 dark:border-[#28283C] pb-4">
                    <button type="button" onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'MIS_RUTINAS')" class="px-4 py-2.5 rounded-xl text-xs font-bold ${!isTemplatesTab ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Mis Rutinas (${userLibraryRoutines.length})</button>
                    <button type="button" onclick="openWorkoutSub('LIBRERIA_RUTINAS', 'PLANTILLAS')" class="px-4 py-2.5 rounded-xl text-xs font-bold ${isTemplatesTab ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Plantillas WeaVax (${TEMPLATES_LIST.length})</button>
                </div>
                ${isTemplatesTab ? `<div class="flex flex-wrap gap-2">${categories.map(c => `<button type="button" onclick="setTemplateCategory('${c}')" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${wState.categoryFilter === c ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">${c}</button>`).join('')}</div>` : ''}
                <div class="${wState.viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}">
                    ${!isTemplatesTab ? `<div onclick="openRoutineCreatorModal()" class="p-6 rounded-2xl border-2 border-dashed border-accent/50 hover:border-accent flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px]"><span class="text-2xl text-accent font-black">+</span><p class="text-sm font-extrabold text-accent mt-1">Crear nueva rutina</p></div>` : ''}
                    ${listToShow.map(r => renderRoutineCard(r, wState.viewMode, isTemplatesTab)).join('')}
                </div>
            </div>
        `;
        return;
    }

    if (wState.subScreen === 'DETALLE_RUTINA' && wState.viewingRoutine) {
        const r = wState.viewingRoutine;
        const isSaved = userLibraryRoutines.some(u => Number(u.id) === Number(r.id));
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onclick="openWorkoutSub('LIBRERIA_RUTINAS')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <div class="flex gap-2">
                        ${isSaved ? `<button type="button" onclick="openRoutineEditor(${r.id})" class="px-4 py-2 rounded-xl bg-[#181824] border border-[#28283C] hover:border-accent text-xs font-bold">✎ Editar Programa</button>` : ''}
                        ${isSaved
                            ? `<button type="button" onclick="selectPrimaryRoutine(${r.id})" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">★ Elegir Principal</button>`
                            : `<button type="button" onclick="copyTemplateToLibrary(${r.id})" class="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold">📥 Copiar a mi biblioteca</button>`}
                    </div>
                </div>
                <div class="rounded-3xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C]">
                    <div class="h-48 bg-cover bg-center relative" style="background-image:url('${r.imageUri || DEFAULT_COVER}')">
                        <div class="absolute inset-0 bg-gradient-to-t from-[#181824] via-[#181824]/40 to-transparent"></div>
                        <div class="absolute bottom-4 left-6 right-6">
                            <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || r.days.length} días/sem</span>
                            <h3 class="text-2xl font-black text-white mt-2">${r.name}</h3>
                            <p class="text-xs text-gray-300 mt-1">${r.description || ''}</p>
                        </div>
                    </div>
                    <div class="p-6 space-y-3">
                        ${(r.days || []).map(d => `
                            <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between gap-2">
                                <div onclick="openDayDetailView(${r.id}, ${d.dayNumber})" class="flex items-center space-x-3.5 cursor-pointer flex-1 min-w-0">
                                    <div class="w-12 h-12 rounded-xl bg-accent/20 text-accent font-black flex items-center justify-center shrink-0">${(d.dayName || 'D').charAt(0)}</div>
                                    <div class="min-w-0">
                                        <p class="text-sm font-extrabold truncate">${d.dayName}</p>
                                        <p class="text-xs text-gray-400 mt-0.5 truncate">${(d.exercises || []).map(e => e.exerciseName).slice(0, 3).join(', ')}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2 shrink-0">
                                    ${isSaved ? `<button type="button" onclick="openRoutineEditor(${r.id}, ${d.dayNumber})" class="px-3 py-2 rounded-xl bg-[#181824] border border-[#28283C] hover:border-accent text-xs font-bold" title="Editar día">✎</button>` : ''}
                                    <button type="button" onclick="beginActiveWorkoutSession(${r.id}, ${d.dayNumber})" class="w-10 h-10 rounded-full bg-accent text-white font-bold flex items-center justify-center">▶</button>
                                </div>
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
        const muscles = Array.from(new Set((d.exercises || []).map(e => e.muscleGroup).filter(Boolean)));
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <button type="button" onclick="openRoutineDetailView(${r.id})" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <div class="flex gap-2">
                        ${r.isCustom ? `<button type="button" onclick="openRoutineEditor(${r.id}, ${d.dayNumber})" class="px-4 py-2.5 rounded-full bg-[#181824] border border-[#28283C] hover:border-accent text-xs font-bold">✎ Editar Día</button>` : ''}
                        <button type="button" onclick="beginActiveWorkoutSession(${r.id}, ${d.dayNumber})" class="px-5 py-2.5 rounded-full bg-accent text-white text-xs font-extrabold">▶ Iniciar Entrenamiento</button>
                    </div>
                </div>
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <h3 class="text-xl font-black">${d.dayName}</h3>
                    <div class="flex flex-wrap gap-2">${muscles.map(m => `<span class="px-3 py-1 rounded-full bg-accent/15 text-accent text-xs font-bold">${m}</span>`).join('')}</div>
                    <div class="space-y-3">
                        ${(d.exercises || []).map(ex => {
                            const catEx = findExerciseInfo(ex.exerciseId, ex.exerciseName);
                            return `
                                <div onclick="showExerciseAnatomyModal(${catEx.id})" class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center justify-between cursor-pointer hover:border-accent">
                                    <div class="flex items-center space-x-4">
                                        <img src="${catEx.img}" class="w-14 h-14 rounded-xl object-contain bg-white p-1">
                                        <div><p class="text-sm font-bold">${ex.exerciseName}</p><p class="text-xs text-gray-400">${ex.targetSets} series × ${ex.targetRepsRange} reps · Descanso ${ex.restSeconds || 90}s</p></div>
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
        const filtered = EXERCISES_LIST.filter(e => (wState.muscleFilter === 'Todos' || e.muscleGroup === wState.muscleFilter) && e.name.toLowerCase().includes((wState.searchQuery || '').toLowerCase()));
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center justify-between gap-3">
                    <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <input oninput="filterExerciseBank(this.value)" value="${wState.searchQuery || ''}" placeholder="Buscar ejercicio..." class="flex-1 max-w-md px-4 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs">
                </div>
                <div class="flex flex-wrap gap-2">${muscles.map(m => `<button type="button" onclick="setMuscleBankFilter('${m}')" class="px-3.5 py-1.5 rounded-full text-[11px] font-bold ${wState.muscleFilter === m ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">${m}</button>`).join('')}</div>
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
        const list = allCompletedSessions;
        const totalHours = (list.reduce((acc, s) => acc + Number(s.durationSeconds || 0), 0) / 3600).toFixed(1);
        const totalTons = (list.reduce((acc, s) => acc + Number(s.totalVolumeKg || 0), 0) / 1000).toFixed(1);
        container.innerHTML = `
            <div class="space-y-6">
                ${minimizedBannerHtml}
                <div class="flex items-center space-x-3">
                    <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <div><h3 class="text-lg font-black">Historial (${list.length})</h3><p class="text-xs text-gray-400">${totalHours} hrs · ${totalTons} toneladas</p></div>
                </div>
                <div class="space-y-3">
                    ${list.length === 0 ? '<p class="text-xs text-gray-400">Sin entrenamientos registrados.</p>' : list.slice(0, 100).map(s => `
                        <div class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex justify-between items-center gap-3">
                            <div class="flex items-center space-x-3.5 min-w-0">
                                ${s.photoDataUrl ? `<img src="${s.photoDataUrl}" class="w-12 h-12 rounded-xl object-cover shrink-0">` : '<div class="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">🏋️</div>'}
                                <div class="min-w-0">
                                    <p class="text-sm font-extrabold truncate">${s.routineName || 'Entrenamiento'}</p>
                                    <p class="text-xs text-gray-400 mt-0.5">${new Date(Number(s.startedAt || Date.now())).toLocaleDateString('es-BO')} · ${Math.round(Number(s.durationSeconds || 0) / 60)} min · ${Number(s.totalVolumeKg || 0).toLocaleString('es-BO')} kg · ${s.totalCompletedSets || 0} series</p>
                                </div>
                            </div>
                            <button type="button" onclick="deleteDocItem('workout_sessions', '${s.docId || s.id}')" class="text-xs text-red-400 shrink-0">Eliminar</button>
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
                    <button type="button" onclick="openWorkoutSub('PRINCIPAL')" class="px-3.5 py-2 rounded-xl bg-[#181824] border border-[#28283C] text-xs font-bold">← Volver</button>
                    <h3 class="text-lg font-black">🤖 Vax Coach · Groq IA</h3>
                </div>

                <!-- 1. Sesión recomendada según tu programa actual -->
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-accent/40 space-y-4">
                    ${!nextInfo ? `<p class="text-xs text-gray-300">Copia o crea una rutina en tu biblioteca, o genera una nueva abajo con Groq IA.</p>` : `
                        <div class="p-4 rounded-2xl bg-[#0A0A0F] border border-[#28283C] flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <span class="text-[10px] font-bold text-accent uppercase">Entrenamiento programado hoy</span>
                                <h4 class="text-base font-black mt-0.5">${nextInfo.dayName}</h4>
                                <p class="text-xs text-gray-400">${nextInfo.routineName} · ${nextInfo.exercisesCount} ejercicios</p>
                            </div>
                            <button type="button" onclick="beginActiveWorkoutSession(${nextInfo.routineId}, ${nextInfo.dayNumber})" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold">▶ Entrenar</button>
                        </div>
                    `}

                    <!-- 2. Análisis rápido de fatiga y sobrecarga progresiva con Groq -->
                    <div class="pt-2 border-t border-[#28283C] space-y-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h4 class="text-sm font-black text-white">📊 Diagnóstico de Fatiga y Sobrecarga</h4>
                                <p class="text-[11px] text-gray-400">Analiza tus últimas sesiones para sugerir ajustes de carga y recuperación.</p>
                            </div>
                            <button type="button" onclick="analyzeFatigueWithGroq()" class="px-4 py-2 rounded-xl bg-[#0A0A0F] border border-accent/50 hover:bg-accent/15 text-accent text-xs font-extrabold">Analizar mi progreso</button>
                        </div>
                        <div id="vax-coach-analysis-box" class="hidden p-4 rounded-2xl bg-[#0A0A0F] border border-[#28283C] text-xs text-gray-200 leading-relaxed whitespace-pre-line"></div>
                    </div>
                </div>

                <!-- 3. Generador de Rutinas Personalizadas con Groq -->
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div>
                        <span class="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Generador Inteligente</span>
                        <h4 class="text-base font-black mt-2">Crear Rutina a Medida con Groq IA</h4>
                        <p class="text-xs text-gray-400 mt-0.5">Selecciona tus parámetros y Vax Coach diseñará tu división semanal con ejercicios reales del catálogo.</p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                            <label class="text-[10px] font-bold uppercase text-gray-400">Objetivo Principal</label>
                            <select id="ai-coach-goal" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">
                                <option value="Hipertrofia Estética (V-Taper y volumen muscular)">Hipertrofia Estética</option>
                                <option value="Fuerza Máxima y Básicos Pesados">Fuerza Máxima</option>
                                <option value="Recomposición Corporal y Definición">Recomposición / Definición</option>
                                <option value="Calistenia, Dominadas y Peso Corporal">Calistenia y Funcional</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold uppercase text-gray-400">Días por Semana</label>
                            <select id="ai-coach-days" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">
                                <option value="3">3 días / semana</option>
                                <option value="4" selected>4 días / semana</option>
                                <option value="5">5 días / semana</option>
                                <option value="6">6 días / semana</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold uppercase text-gray-400">Equipamiento</label>
                            <select id="ai-coach-equip" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-bold">
                                <option value="Gimnasio completo (barras, mancuernas, poleas y máquinas)">Gimnasio Completo</option>
                                <option value="Mancuernas y banco ajustable">Solo Mancuernas y Banco</option>
                                <option value="Barra de dominadas, paralelas y peso corporal">Calistenia / Parque</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] font-bold uppercase text-gray-400">Prioridad muscular o notas (Opcional)</label>
                        <input id="ai-coach-notes" placeholder="Ej. Énfasis en espalda alta, deltoides lateral y pecho superior..." class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] text-xs">
                    </div>

                    <div id="vax-coach-gen-status" class="hidden text-xs font-bold text-accent animate-pulse">Diseñando tu rutina con Groq Llama 3.3 70B...</div>

                    <button type="button" onclick="generateRoutineWithGroq()" class="w-full py-3 rounded-xl bg-accent hover:opacity-90 text-white text-xs font-extrabold shadow-lg">✨ Generar y Guardar Rutina en Mi Biblioteca</button>
                </div>
            </div>
        `;
    }
}

window.analyzeFatigueWithGroq = async () => {
    const box = document.getElementById('vax-coach-analysis-box');
    if (!box) return;
    box.classList.remove('hidden');
    box.textContent = 'Analizando tu historial reciente con Vax Coach...';

    const recent = getCompletedSessionsList().slice(0, 6).map(s => ({
        rutina: s.routineName,
        fecha: new Date(Number(s.startedAt || Date.now())).toLocaleDateString('es-BO'),
        volumenKg: s.totalVolumeKg,
        series: s.totalCompletedSets,
        duracionMin: Math.round(Number(s.durationSeconds || 0) / 60)
    }));

    try {
        const resp = await fetch(WEAVAX_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-weavax-key': WEAVAX_APP_SECRET
            },
            body: JSON.stringify({
                provider: 'groq',
                systemPrompt: 'Eres Vax Coach, entrenador experto en hipertrofia y fuerza. Sé directo, técnico y práctico en español (máximo 140 palabras).',
                prompt: recent.length === 0
                    ? 'El usuario aún no tiene sesiones registradas. Dale 3 consejos breves para empezar su primera semana de entrenamiento con sobrecarga progresiva.'
                    : `Analiza estas últimas sesiones de entrenamiento del usuario y dale recomendaciones concretas de recuperación y progresión de carga para hoy:\n${JSON.stringify(recent)}`
            })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Error conectando con Vax Coach');
        box.textContent = data.text;
    } catch (err) {
        box.textContent = 'Error: ' + err.message;
    }
};

window.generateRoutineWithGroq = async () => {
    const goal = document.getElementById('ai-coach-goal')?.value || 'Hipertrofia';
    const daysCount = Number(document.getElementById('ai-coach-days')?.value || 4);
    const equip = document.getElementById('ai-coach-equip')?.value || 'Gimnasio completo';
    const notes = document.getElementById('ai-coach-notes')?.value.trim() || 'Equilibrado';
    const statusEl = document.getElementById('vax-coach-gen-status');

    if (statusEl) statusEl.classList.remove('hidden');

    const catalogCompact = EXERCISES_LIST.slice(0, 140).map(e => ({
        id: e.id,
        name: e.name,
        muscle: e.muscleGroup,
        equip: e.equipment
    }));

    try {
        const resp = await fetch(WEAVAX_PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-weavax-key': WEAVAX_APP_SECRET
            },
            body: JSON.stringify({
                provider: 'groq',
                systemPrompt: 'Eres un arquitecto de rutinas de entrenamiento. Responde ÚNICAMENTE con un objeto JSON válido, sin markdown ni texto extra.',
                prompt: `Crea una rutina de entrenamiento de ${daysCount} días por semana.
Objetivo: ${goal}.
Equipamiento: ${equip}.
Notas: ${notes}.

Usa EXCLUSIVAMENTE ejercicios del siguiente catálogo (respetando su "id", "name" y "muscle"):
${JSON.stringify(catalogCompact)}

Devuelve exactamente esta estructura JSON:
{
  "name": "Nombre atractivo de la rutina",
  "description": "Breve descripción técnica",
  "focusCategory": "Hipertrofia",
  "estimatedDurationMinutes": 60,
  "days": [
    {
      "dayNumber": 1,
      "dayName": "Día 1 · Nombre del enfoque",
      "exercises": [
        {
          "exerciseId": 1,
          "exerciseName": "Nombre exacto del catálogo",
          "muscleGroup": "Grupo exacto del catálogo",
          "targetSets": 3,
          "targetRepsRange": "8-12",
          "restSeconds": 90
        }
      ]
    }
  ]
}`
            })
        });

        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Error al generar rutina');

        const cleanStr = (data.text || '').replace(/```json|```/g, '').trim();
        const aiRoutine = JSON.parse(cleanStr);

        const newId = Date.now();
        const sanitizedDays = (aiRoutine.days || []).map((d, dIdx) => ({
            dayNumber: dIdx + 1,
            dayName: d.dayName || `Día ${dIdx + 1}`,
            exercises: (d.exercises || []).map(ex => {
                const info = findExerciseInfo(ex.exerciseId, ex.exerciseName);
                return {
                    exerciseId: info.id,
                    exerciseName: info.name,
                    muscleGroup: info.muscleGroup,
                    equipment: info.equipment,
                    targetSets: Number(ex.targetSets || 3),
                    targetRepsRange: String(ex.targetRepsRange || '8-12'),
                    restSeconds: Number(ex.restSeconds || 90)
                };
            })
        }));

        const routineDoc = {
            id: newId,
            name: aiRoutine.name || `Rutina IA (${daysCount} días)`,
            description: aiRoutine.description || goal,
            focusCategory: aiRoutine.focusCategory || 'Hipertrofia',
            targetDaysPerWeek: sanitizedDays.length || daysCount,
            estimatedDurationMinutes: Number(aiRoutine.estimatedDurationMinutes || 60),
            imageUri: DEFAULT_COVER,
            isCustom: true,
            isSystemTemplate: false,
            createdAt: newId,
            days: sanitizedDays
        };

        await fsActions.setItem('workout_routines', newId, routineDoc);
        wState.selectedRoutineId = newId;
        localStorage.setItem('weavax_primary_routine_id', String(newId));
        if (window.state.activeUserDocId) await fsActions.updateProfile({ primaryRoutineId: newId });

        wState.subScreen = 'PRINCIPAL';
        window.renderWorkouts();
    } catch (err) {
        if (statusEl) statusEl.classList.add('hidden');
        alert('Error en Vax Coach IA: ' + err.message);
    }
};

function renderRoutineCard(r, mode = 'grid', isSystemTemplateCard = false) {
    const actionBtn = isSystemTemplateCard
        ? `<button type="button" onclick="event.stopPropagation(); copyTemplateToLibrary(${r.id})" class="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white text-xs font-bold">📥 Copiar</button>`
        : `<button type="button" onclick="event.stopPropagation(); selectPrimaryRoutine(${r.id})" class="flex-1 py-2 px-3 rounded-xl bg-accent/15 text-accent hover:bg-accent hover:text-white text-xs font-bold">★ Principal</button>
           <button type="button" onclick="event.stopPropagation(); openRoutineEditor(${r.id})" class="py-2 px-3 rounded-xl bg-[#0A0A0F] border border-[#28283C] hover:border-accent text-xs font-bold">✎</button>`;

    if (mode === 'list') {
        return `
            <div onclick="openRoutineDetailView(${r.id})" class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center justify-between gap-4 cursor-pointer hover:border-accent">
                <div class="flex items-center space-x-3.5"><img src="${r.imageUri || DEFAULT_COVER}" class="w-16 h-16 rounded-xl object-cover"><div><h5 class="text-sm font-extrabold">${r.name}</h5><p class="text-xs text-gray-400">${(r.days || []).length} días · ${r.focusCategory || 'Hipertrofia'}</p></div></div>
                <div class="flex gap-2 shrink-0">${actionBtn}</div>
            </div>
        `;
    }
    return `
        <div onclick="openRoutineDetailView(${r.id})" class="rounded-2xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-col justify-between cursor-pointer hover:border-accent">
            <div class="h-36 bg-cover bg-center relative" style="background-image:url('${r.imageUri || DEFAULT_COVER}')">
                <div class="absolute inset-0 bg-gradient-to-t from-[#181824] to-transparent"></div>
                <span class="absolute bottom-2 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || (r.days || []).length}d</span>
            </div>
            <div class="p-5 flex-1 flex flex-col justify-between">
                <div><h5 class="font-extrabold text-sm">${r.name}</h5><p class="text-[11px] text-gray-400 mt-1 line-clamp-2">${r.description || ''}</p></div>
                <div class="flex gap-2 mt-4">${actionBtn}</div>
            </div>
        </div>
    `;
}

window.copyTemplateToLibrary = async (templateId) => {
    const tpl = TEMPLATES_LIST.find(t => Number(t.id) === Number(templateId));
    if (!tpl) return;
    const newId = Date.now();
    await fsActions.setItem('workout_routines', newId, { ...tpl, id: newId, isSystemTemplate: false, createdAt: newId });
    wState.selectedRoutineId = newId;
    localStorage.setItem('weavax_primary_routine_id', String(newId));
    if (window.state.activeUserDocId) await fsActions.updateProfile({ primaryRoutineId: newId });
    wState.libraryTab = 'MIS_RUTINAS';
    wState.subScreen = 'PRINCIPAL';
    window.renderWorkouts();
};

window.selectPrimaryRoutine = async (routineId) => {
    const numId = Number(routineId);
    wState.selectedRoutineId = numId;
    localStorage.setItem('weavax_primary_routine_id', String(numId));
    if (window.state.activeUserDocId) await fsActions.updateProfile({ primaryRoutineId: numId });
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
    wState.previousSubBeforeExerciseDetail = wState.subScreen;
    wState.viewingExercise = findExerciseInfo(exId);
    wState.subScreen = 'DETALLE_EJERCICIO';
    window.renderWorkouts();
};

window.returnFromExerciseDetail = () => {
    wState.viewingExercise = null;
    wState.subScreen = wState.previousSubBeforeExerciseDetail || 'BANCO_EJERCICIOS';
    window.renderWorkouts();
};
