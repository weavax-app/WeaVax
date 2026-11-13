import { wState, getTodayScheduledWorkoutInfo } from './workout/workout-state.js';
import { renderLibraryAndHub } from './workout/workout-library.js';
import { renderActiveAndFinishViews } from './workout/workout-session.js';

export { getTodayScheduledWorkoutInfo };

export function renderWorkouts() {
    const container = document.getElementById('view-workouts');
    if (!container) return;

    const minimizedBannerHtml = (wState.activeSession && wState.subScreen !== 'SESION_ACTIVA' && wState.subScreen !== 'POR_FINALIZAR') ? `
        <div class="p-4 rounded-2xl bg-accent/20 border-2 border-accent flex flex-wrap items-center justify-between gap-3 mb-6 shadow-lg">
            <div class="flex items-center space-x-3">
                <span class="w-3 h-3 rounded-full bg-emerald-400 animate-ping"></span>
                <div>
                    <p class="text-xs font-extrabold text-white">Entrenamiento en curso: ${wState.activeSession.routineName}</p>
                    <p class="text-[11px] text-gray-300">Tiempo: ${Math.floor(wState.activeSession.elapsedSeconds / 60)}m ${wState.activeSession.elapsedSeconds % 60}s</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="openWorkoutSub('SESION_ACTIVA')" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-extrabold">Reanudar</button>
                <button onclick="discardActiveWorkout()" class="px-3.5 py-2 rounded-xl bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold">Descartar</button>
            </div>
        </div>
    ` : '';

    if (['SESION_ACTIVA', 'POR_FINALIZAR', 'RESUMEN_SESION'].includes(wState.subScreen)) {
        renderActiveAndFinishViews(container);
    } else {
        renderLibraryAndHub(container, minimizedBannerHtml);
    }
}

window.renderWorkouts = renderWorkouts;
