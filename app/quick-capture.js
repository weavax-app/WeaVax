import { fsActions } from './firebase-sync.js';
import { wState, findExerciseInfo, persistActiveWorkoutSession } from './workout/workout-state.js';

export function initQuickCaptureBar() {
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            window.openQuickCaptureModal();
        }
    });
}

export function parseNaturalLanguageCapture(rawText) {
    const text = String(rawText || '').trim();
    const lower = text.toLowerCase();

    // 1. Detectar Gym: "Hice 4x10 press banca con 70 kg" o "3x12 sentadilla 80kg"
    const gymMatch = lower.match(/(\d+)\s*[x×]\s*(\d+)\s+(.+?)(?:\s+(?:con|a)?\s*(\d+(?:[.,]\d+)?)\s*(?:kg|kilos|lbs)?)?$/i);
    if (gymMatch) {
        return {
            intent: 'GYM',
            sets: Number(gymMatch[1]),
            reps: Number(gymMatch[2]),
            exerciseQuery: gymMatch[3].trim(),
            weightKg: gymMatch[4] ? Number(gymMatch[4].replace(',', '.')) : 0
        };
    }

    // 2. Detectar Finanzas: "Gasté 35 bs en almuerzo" o "Ingreso 500 bs freelance"
    const finMatch = lower.match(/^(gast[eé]|pagu[eé]|compr[eé]|ingreso|cobr[eé]|recib[ií])\s+(\d+(?:[.,]\d+)?)\s*(?:bs|usd|\$|€)?\s*(?:en|de|por)?\s*(.+)$/i);
    if (finMatch) {
        const isIncome = /^(ingreso|cobr|recib)/i.test(finMatch[1]);
        return {
            intent: 'FINANCE',
            type: isIncome ? 'ingreso' : 'gasto',
            amount: Number(finMatch[2].replace(',', '.')),
            title: finMatch[3].trim().replace(/^./, c => c.toUpperCase())
        };
    }

    // 3. Por defecto: Tarea / Plan con hora opcional ("Estudiar Arquitectura 5 pm")
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    let timeStr = '';
    if (timeMatch) {
        let h = Number(timeMatch[1]);
        const m = timeMatch[2] || '00';
        const ampm = timeMatch[3].toLowerCase();
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        timeStr = `${String(h).padStart(2, '0')}:${m}`;
    }

    return {
        intent: 'TASK',
        title: text.replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i, '').trim() || text,
        time: timeStr
    };
}

window.openQuickCaptureModal = () => {
    window.openUniversalModal('⚡ Captura Rápida (Ctrl + K)', `
        <form onsubmit="executeQuickCapture(event)" class="space-y-3 text-xs">
            <p class="text-gray-400">Escribe o dicta en lenguaje natural. Ejemplos: <em>"Gasté 35 bs en almuerzo"</em>, <em>"Hice 4x10 press banca con 70 kg"</em>, <em>"Estudiar Arquitectura 5 pm"</em>.</p>
            <div class="flex gap-2">
                <input id="qc-input" autofocus required placeholder="¿Qué quieres registrar ahora?" class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white focus:border-[#8B5CF6] outline-none">
                <button type="button" onclick="startQuickCaptureVoice()" class="px-3.5 py-2.5 rounded-xl bg-[#121216] border border-[#1F1F26] hover:border-[#8B5CF6] text-sm" title="Dictar por voz">🎤</button>
            </div>
            <div id="qc-voice-status" class="hidden text-[#10B981] font-bold">Escuchando voz...</div>
            <button type="submit" class="w-full py-2.5 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Registrar al Instante</button>
        </form>
    `);
};

window.startQuickCaptureVoice = () => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return alert('Tu navegador no soporta dictado por voz.');
    const rec = new SpeechRec();
    rec.lang = 'es-BO';
    const status = document.getElementById('qc-voice-status');
    if (status) status.classList.remove('hidden');

    rec.onresult = (ev) => {
        const transcript = ev.results[0][0].transcript;
        const input = document.getElementById('qc-input');
        if (input) input.value = transcript;
        if (status) status.classList.add('hidden');
    };
    rec.onerror = () => { if (status) status.classList.add('hidden'); };
    rec.start();
};

window.executeQuickCapture = async (e) => {
    e.preventDefault();
    const raw = document.getElementById('qc-input')?.value;
    if (!raw) return;

    const parsed = parseNaturalLanguageCapture(raw);
    const id = Math.floor(Date.now() / 1000);

    if (parsed.intent === 'FINANCE') {
        const accounts = window.state?.accounts || [];
        const defaultAccId = localStorage.getItem('weavax_default_account_id');
        const acc = accounts.find(a => String(a.id) === String(defaultAccId)) || accounts[0];
        if (!acc) return alert('Crea primero una cuenta en Finanzas.');

        const signedAmt = parsed.type === 'gasto' ? -Math.abs(parsed.amount) : Math.abs(parsed.amount);
        await fsActions.setItem('transactions', id, {
            title: parsed.title,
            type: parsed.type,
            amount: signedAmt,
            currency: acc.currency || 'Bs',
            category: parsed.type === 'gasto' ? 'Alimentación' : 'Otros',
            accountId: Number(acc.id),
            accountName: acc.name,
            note: 'Captura rápida',
            date: Date.now()
        });
        await fsActions.updateItem('accounts', acc.docId, {
            balance: Number(acc.balance || 0) + signedAmt
        });
    } else if (parsed.intent === 'GYM') {
        const exInfo = findExerciseInfo(null, parsed.exerciseQuery);
        const generatedSets = Array.from({ length: parsed.sets }, (_, idx) => ({
            setNumber: idx + 1,
            setType: 'NORMAL',
            weightKg: parsed.weightKg,
            reps: parsed.reps,
            isCompleted: true
        }));

        if (wState.activeSession) {
            wState.activeSession.exercises.push({
                exerciseId: exInfo.id,
                exerciseName: exInfo.name,
                muscleGroup: exInfo.muscleGroup,
                equipment: exInfo.equipment,
                imageUri: exInfo.img,
                restSeconds: 90,
                sets: generatedSets
            });
            persistActiveWorkoutSession();
            if (window.renderWorkouts) window.renderWorkouts();
        } else {
            await fsActions.setItem('workout_sessions', Date.now(), {
                id: Date.now(),
                routineName: `Registro Rápido · ${exInfo.name}`,
                startedAt: Date.now(),
                endedAt: Date.now(),
                durationSeconds: 600,
                totalVolumeKg: parsed.sets * parsed.reps * parsed.weightKg,
                totalCompletedSets: parsed.sets,
                isCompleted: true,
                sets: generatedSets.map(s => ({ ...s, exerciseId: exInfo.id, exerciseName: exInfo.name }))
            });
        }
    } else {
        const todayIso = new Date().toISOString().split('T')[0];
        await fsActions.setItem('tasks', id, {
            title: parsed.title,
            dueDate: todayIso,
            dueTime: parsed.time || '',
            isCompleted: false,
            priority: 'MEDIA',
            createdAt: Date.now()
        });
    }

    await fsActions.updateProfile({ hasCompletedFirstWin: true });
    document.getElementById('first-win-tooltip')?.remove();
    window.closeUniversalModal();
};
