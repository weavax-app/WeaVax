import { fsActions } from './firebase-sync.js';

export function checkAndLaunchOnboarding() {
    const p = window.state?.profile || {};
    applySilentModeClass(p.gamificationMode);

    if (!window.state?.activeUserDocId || p.primaryFocusGoal) return;

    window.openUniversalModal('✨ Configura tu WeaVax en 15 segundos', `
        <form onsubmit="submitOnboardingSetup(event)" class="space-y-4 text-xs">
            <div>
                <label class="text-[11px] font-black uppercase text-gray-400 block mb-1.5">1. ¿Cuál es tu enfoque principal hoy?</label>
                <select id="ob-goal" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-bold">
                    <option value="FULL_SYSTEM">🚀 Sistema Completo (Gym + Finanzas + Hábitos)</option>
                    <option value="GYM_PERFORMANCE">🏋️ Rendimiento en Gimnasio y Fuerza</option>
                    <option value="EXPENSE_CONTROL">💰 Control de Gastos y Presupuestos</option>
                    <option value="PRODUCTIVITY_STUDY">📚 Productividad, Hábitos y Estudio</option>
                </select>
            </div>

            <div>
                <label class="text-[11px] font-black uppercase text-gray-400 block mb-1.5">2. ¿Cuánto tiempo quieres dedicarle al día?</label>
                <div class="grid grid-cols-2 gap-2">
                    <label class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] cursor-pointer flex items-center space-x-2">
                        <input type="radio" name="ob-time" value="QUICK_2MIN" checked class="accent-[#8B5CF6]">
                        <span>⚡ Rápido (2 min/día)</span>
                    </label>
                    <label class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] cursor-pointer flex items-center space-x-2">
                        <input type="radio" name="ob-time" value="DETAILED" class="accent-[#8B5CF6]">
                        <span>📊 Detallado y analítico</span>
                    </label>
                </div>
            </div>

            <div>
                <label class="text-[11px] font-black uppercase text-gray-400 block mb-1.5">3. Estilo de experiencia</label>
                <div class="grid grid-cols-2 gap-2">
                    <label class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] cursor-pointer flex items-center space-x-2">
                        <input type="radio" name="ob-mode" value="GAMIFIED_XP" checked class="accent-[#8B5CF6]">
                        <span>🔥 Gamificado (XP y Rachas)</span>
                    </label>
                    <label class="p-3 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] cursor-pointer flex items-center space-x-2">
                        <input type="radio" name="ob-mode" value="SILENT_MINIMAL" class="accent-[#8B5CF6]">
                        <span>🧘 Silencioso (Sin niveles/XP)</span>
                    </label>
                </div>
            </div>

            <button type="submit" class="w-full py-3 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Comenzar mi primera victoria →</button>
        </form>
    `);
}

export function applySilentModeClass(mode) {
    const isSilent = mode === 'SILENT_MINIMAL';
    document.body.classList.toggle('weavax-silent-mode', isSilent);
}

window.submitOnboardingSetup = async (e) => {
    e.preventDefault();
    const goal = document.getElementById('ob-goal').value;
    const dailyTimePreference = document.querySelector('input[name="ob-time"]:checked')?.value || 'QUICK_2MIN';
    const gamificationMode = document.querySelector('input[name="ob-mode"]:checked')?.value || 'GAMIFIED_XP';

    await fsActions.updateProfile({
        primaryFocusGoal: goal,
        dailyTimePreference,
        gamificationMode,
        restShieldsAvailable: 2,
        hasCompletedFirstWin: false
    });

    // Poblar semillas iniciales solo si las colecciones están vacías
    const now = Math.floor(Date.now() / 1000);
    if ((window.state?.habits || []).length === 0) {
        await fsActions.setItem('habits', now, {
            title: 'Hidratación 2.5L + Descanso',
            category: 'Salud',
            frequency: 'Diario',
            completedDates: [],
            createdAt: Date.now()
        });
    }
    if ((window.state?.budgets || []).length === 0 && (goal === 'EXPENSE_CONTROL' || goal === 'FULL_SYSTEM')) {
        await fsActions.setItem('budgets', now + 1, {
            category: 'Alimentación',
            limitAmount: 1000,
            periodType: 'Mensual',
            currency: 'Bs'
        });
    }

    applySilentModeClass(gamificationMode);
    window.closeUniversalModal();
    showFirstWinBanner();
};

export function showFirstWinBanner() {
    if (window.state?.profile?.hasCompletedFirstWin) return;
    const banner = document.createElement('div');
    banner.id = 'first-win-tooltip';
    banner.className = 'fixed bottom-20 right-4 z-40 max-w-sm p-4 rounded-2xl bg-[#121216] border border-[#8B5CF6] shadow-2xl text-xs space-y-2';
    banner.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="font-black text-[#8B5CF6]">🎯 Tu Primera Victoria</span>
            <button type="button" onclick="this.closest('#first-win-tooltip').remove()" class="text-gray-400">✕</button>
        </div>
        <p class="text-gray-300">Registra 1 gasto rápido, completa 1 hábito o usa <strong>Ctrl + K</strong> para probar la captura instantánea.</p>
    `;
    document.body.appendChild(banner);
}
