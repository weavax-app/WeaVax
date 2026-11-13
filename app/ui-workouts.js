import { fsActions } from './firebase-sync.js';

const SYSTEM_TEMPLATES = [
    { id: 1, name: "Push / Pull / Legs Clásico", focusCategory: "Hipertrofia", targetDaysPerWeek: 6, imageUri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800", description: "Doble frecuencia semanal. Máxima síntesis proteica." },
    { id: 3, name: "Arnold Split Clásico", focusCategory: "Hipertrofia", targetDaysPerWeek: 6, imageUri: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800", description: "Pecho/Espalda, Hombros/Brazos y Pierna." },
    { id: 6, name: "Upper / Lower (Torso / Pierna)", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, imageUri: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800", description: "2 días torso y 2 días pierna." },
    { id: 21, name: "Baki Hanma: Espalda del Demonio", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, imageUri: "https://images.unsplash.com/photo-1563089145-599997674d42?w=800", description: "Remo pesado, dominadas y trapecios estilo Hanma." },
    { id: 22, name: "Goku Ultra Instinct: Sayayin", focusCategory: "Fuerza", targetDaysPerWeek: 5, imageUri: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800", description: "Fuerza explosiva y resistencia en la Cámara del Tiempo." },
    { id: 23, name: "Solo Leveling: Shadow Monarch", focusCategory: "Hipertrofia", targetDaysPerWeek: 4, imageUri: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800", description: "V-Taper extremo con hombros 3D y dorsal ancho." },
    { id: 24, name: "Toji Fushiguro: Restricción Celestial", focusCategory: "Fuerza", targetDaysPerWeek: 4, imageUri: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800", description: "Físico denso y letal en dorsales, pecho y brazos." },
    { id: 26, name: "Zoro: Triple Sword Mastery", focusCategory: "Fuerza", targetDaysPerWeek: 4, imageUri: "https://images.unsplash.com/photo-1569705460033-cfaa4bf9f822?w=800", description: "Hombros gigantes, antebrazos y core." }
];

export const LYFTA_EXERCISES = [
    { id: 1, name: "Press de banca plano con barra", muscleGroup: "Pecho", equipment: "Barra", img: "https://lyfta.app/images/exercises/00251101.png" },
    { id: 5, name: "Press inclinado con mancuernas", muscleGroup: "Pecho", equipment: "Mancuerna", img: "https://lyfta.app/images/exercises/03141101.png" },
    { id: 11, name: "Peso muerto convencional", muscleGroup: "Espalda", equipment: "Barra", img: "https://lyfta.app/images/exercises/00321101.png" },
    { id: 14, name: "Jalón al pecho en polea", muscleGroup: "Espalda", equipment: "Polea", img: "https://lyfta.app/images/exercises/07101101.png" },
    { id: 21, name: "Sentadilla trasera con barra", muscleGroup: "Cuádriceps", equipment: "Barra", img: "https://lyfta.app/images/exercises/00431101.png" },
    { id: 32, name: "Hip Thrust con barra", muscleGroup: "Isquiosurales/Glúteos", equipment: "Barra", img: "https://lyfta.app/images/exercises/10551101.png" },
    { id: 43, name: "Elevaciones laterales con mancuernas", muscleGroup: "Hombros", equipment: "Mancuerna", img: "https://lyfta.app/images/exercises/01781101.png" },
    { id: 55, name: "Curl bayesiano unilateral en polea", muscleGroup: "Bíceps", equipment: "Polea", img: "https://lyfta.app/images/exercises/16661101.png" },
    { id: 62, name: "Jalón de tríceps en polea con cuerda", muscleGroup: "Tríceps", equipment: "Polea", img: "https://lyfta.app/images/exercises/02411101.png" }
];

export function renderWorkouts() {
    const allRoutines = [...window.state.workout_routines, ...SYSTEM_TEMPLATES];
    const gridEl = document.getElementById('routines-grid');
    if (gridEl) {
        gridEl.innerHTML = allRoutines.map(r => `
            <div class="rounded-2xl overflow-hidden bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-col justify-between">
                <div class="h-32 bg-cover bg-center relative" style="background-image:url('${r.imageUri || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'}')">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#181824] to-transparent"></div>
                    <span class="absolute bottom-2 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent text-white">${r.focusCategory || 'Hipertrofia'} · ${r.targetDaysPerWeek || 4}d</span>
                </div>
                <div class="p-4 flex-1 flex flex-col justify-between">
                    <div>
                        <h5 class="font-extrabold text-sm">${r.name}</h5>
                        <p class="text-[11px] text-gray-400 mt-1 line-clamp-2">${r.description || ''}</p>
                    </div>
                    <button onclick="startLiveWorkout('${r.name.replace(/'/g, "")}')" class="mt-4 w-full py-2 rounded-xl bg-accent text-white text-xs font-bold hover:opacity-90">
                        ▶ Iniciar Sesión Activa
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Banco de ejercicios con miniaturas anatómicas de Lyfta
    const exEl = document.getElementById('exercises-bank-grid');
    if (exEl) {
        exEl.innerHTML = LYFTA_EXERCISES.map(ex => `
            <div class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex items-center space-x-3">
                <img src="${ex.img}" class="w-12 h-12 rounded-lg object-cover bg-white p-0.5">
                <div>
                    <p class="text-xs font-bold">${ex.name}</p>
                    <p class="text-[10px] text-gray-400">${ex.muscleGroup} · ${ex.equipment}</p>
                </div>
            </div>
        `).join('');
    }

    // Historial de sesiones
    const sessEl = document.getElementById('sessions-list');
    if (sessEl) {
        sessEl.innerHTML = window.state.workout_sessions.length === 0
            ? `<p class="text-xs text-gray-400">Sin sesiones registradas.</p>`
            : window.state.workout_sessions.map(s => {
                const d = s.startedAt ? new Date(Number(s.startedAt)).toLocaleDateString('es-BO') : '';
                const mins = Math.round(Number(s.durationSeconds || 3600) / 60);
                return `
                    <div class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] flex justify-between items-center">
                        <div>
                            <p class="text-xs font-bold">${s.routineName}</p>
                            <p class="text-[10px] text-gray-400">${d} · ${mins} min · Vol: ${Number(s.totalVolumeKg || 0).toFixed(0)} kg · ${s.totalCompletedSets || 0} series</p>
                        </div>
                        <button onclick="deleteDocItem('workout_sessions', '${s.docId}')" class="text-xs text-red-400">✕</button>
                    </div>
                `;
            }).join('');
    }
}

window.startLiveWorkout = (routineName) => {
    window.openUniversalModal(`Sesión Activa: ${routineName}`, `
        <form onsubmit="finishLiveWorkout(event, '${routineName}')" class="space-y-3 text-xs">
            <div class="grid grid-cols-2 gap-2">
                <div>
                    <label class="text-[10px] text-gray-400">Duración (Minutos)</label>
                    <input id="ws-mins" type="number" value="60" class="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
                <div>
                    <label class="text-[10px] text-gray-400">Series Completadas</label>
                    <input id="ws-sets" type="number" value="16" class="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                </div>
            </div>
            <div>
                <label class="text-[10px] text-gray-400">Volumen Total Levantado (kg)</label>
                <input id="ws-vol" type="number" step="0.5" value="4850" class="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <textarea id="ws-notes" placeholder="¿Cómo fue tu entrenamiento hoy?" class="w-full px-3 py-2 rounded-xl bg-[#0A0A0F] border border-[#28283C]"></textarea>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold">✓ Finalizar y Sincronizar Sesión (+60 XP)</button>
        </form>
    `);
};

window.finishLiveWorkout = async (e, routineName) => {
    e.preventDefault();
    const id = Date.now();
    const mins = Number(document.getElementById('ws-mins').value || 60);
    await fsActions.setItem('workout_sessions', id, {
        routineName,
        dayNumber: 1,
        startedAt: id,
        endedAt: id + mins * 60000,
        durationSeconds: mins * 60,
        totalVolumeKg: Number(document.getElementById('ws-vol').value || 0),
        totalCompletedSets: Number(document.getElementById('ws-sets').value || 0),
        xpEarned: 60,
        notes: document.getElementById('ws-notes').value.trim(),
        isCompleted: true
    });
    const nextXp = Number(window.state.profile.xp || 0) + 60;
    await fsActions.updateProfile({ xp: nextXp, level: Math.floor(nextXp / 100) + 1 });
    window.closeUniversalModal();
};

window.openRoutineModal = () => {
    window.openUniversalModal('Crear Rutina Personalizada', `
        <form onsubmit="saveCustomRoutine(event)" class="space-y-3 text-xs">
            <input id="cr-name" required placeholder="Nombre de la rutina" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <input id="cr-desc" placeholder="Descripción" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            <div class="grid grid-cols-2 gap-2">
                <select id="cr-focus" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
                    <option value="Hipertrofia">Hipertrofia</option><option value="Fuerza">Fuerza</option><option value="Calistenia">Calistenia</option>
                </select>
                <input id="cr-days" type="number" min="1" max="7" value="4" placeholder="Días/sem" class="px-3 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C]">
            </div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-accent text-white font-bold">Guardar Rutina</button>
        </form>
    `);
};

window.saveCustomRoutine = async (e) => {
    e.preventDefault();
    const id = Date.now();
    await fsActions.setItem('workout_routines', id, {
        name: document.getElementById('cr-name').value.trim(),
        description: document.getElementById('cr-desc').value.trim(),
        focusCategory: document.getElementById('cr-focus').value,
        targetDaysPerWeek: Number(document.getElementById('cr-days').value || 4),
        isSystemTemplate: false,
        createdAt: id
    });
    window.closeUniversalModal();
};
