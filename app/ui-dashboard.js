import { computeCrossModuleInsights } from './insights.js';
import { getMyFriendships } from './social/social-service.js';

let cachedPendingFriends = 0;
let cachedAcceptedFriends = 0;

export async function renderDashboardView(container) {
    const p = window.state?.profile || {};
    const isSilent = p.gamificationMode === 'SILENT_MINIMAL';
    const todayIso = new Date().toISOString().split('T')[0];

    const habits = window.state?.habits || [];
    const doneHabits = habits.filter(h => (h.completedDates || []).includes(todayIso)).length;
    const tasksToday = (window.state?.tasks || []).filter(t => !t.dueDate || t.dueDate === todayIso);
    const doneTasks = tasksToday.filter(t => t.isCompleted).length;

    const totalItems = habits.length + tasksToday.length;
    const dailyScore = totalItems > 0 ? Math.round(((doneHabits + doneTasks) / totalItems) * 100) : 100;
    if (window.state) window.state.dailyScorePercent = dailyScore;

    const accounts = window.state?.accounts || [];
    const totalBalanceBs = accounts
        .filter(a => !a.isArchived && (a.currency === 'Bs' || !a.currency))
        .reduce((acc, a) => acc + Number(a.balance || 0), 0);

    const insights = computeCrossModuleInsights();

    try {
        const fr = await getMyFriendships();
        cachedPendingFriends = fr.pendingIncoming.length;
        cachedAcceptedFriends = fr.accepted.length;
    } catch {
        // Offline-first fallback
    }

    container.innerHTML = `
        <div class="space-y-6" style="font-variant-numeric: tabular-nums;">
            <!-- Cabecera limpia con botón de Captura Rápida -->
            <div class="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-black tracking-tight text-white">Hola, ${p.name || 'Atleta'}</h2>
                    <p class="text-xs text-gray-400 mt-1">Tu resumen operativo de hoy · Sincronizado offline-first</p>
                </div>
                <div class="flex flex-wrap items-center gap-2.5">
                    ${!isSilent ? `
                        <div class="px-3.5 py-2 rounded-xl bg-[#121216] border border-[#1F1F26] text-xs font-extrabold text-amber-400">
                            🔥 Racha: ${p.streak || 0}d · 🛡️ ${p.restShieldsAvailable ?? 2} escudos
                        </div>
                    ` : ''}
                    <button type="button" onclick="openQuickCaptureModal()" class="px-4 py-2.5 rounded-xl bg-[#8B5CF6] hover:opacity-90 text-white text-xs font-extrabold shadow-lg">
                        ⚡ Captura Rápida (Ctrl+K)
                    </button>
                </div>
            </div>

            <!-- Resumen Principal: Daily Score + Balance + Progreso -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] flex flex-col justify-between space-y-4">
                    <div>
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-bold uppercase text-gray-400">Daily Score de Hoy</span>
                            <span class="text-xs font-black text-[#10B981]">${doneHabits + doneTasks}/${totalItems} completados</span>
                        </div>
                        <div class="text-3xl font-black text-white mt-2">${dailyScore}%</div>
                        <div class="w-full h-2 rounded-full bg-[#0A0A0C] mt-3 overflow-hidden">
                            <div class="h-full bg-[#8B5CF6] transition-all" style="width:${dailyScore}%"></div>
                        </div>
                    </div>
                    <button type="button" onclick="navigate('progress')" class="w-full py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-extrabold text-[#8B5CF6]">
                        Ver Progreso y Analíticas →
                    </button>
                </div>

                <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] flex flex-col justify-between space-y-4">
                    <div>
                        <span class="text-[11px] font-bold uppercase text-gray-400">Liquidez Total (Bs)</span>
                        <div class="text-3xl font-black text-white mt-2">Bs ${totalBalanceBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <p class="text-[11px] text-gray-400 mt-1">${accounts.length} cuentas activas · 100% privadas</p>
                    </div>
                    <button type="button" onclick="navigate('finances')" class="w-full py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#10B981] text-xs font-extrabold text-[#10B981]">
                        Gestionar Finanzas →
                    </button>
                </div>

                <div class="p-5 rounded-2xl bg-[#121216] border border-[#1F1F26] flex flex-col justify-between space-y-4">
                    <div>
                        <span class="text-[11px] font-bold uppercase text-gray-400">Entrenamiento</span>
                        <div class="text-xl font-black text-white mt-2">${(window.state?.workout_sessions || []).filter(s => s.isCompleted).length} sesiones</div>
                        <p class="text-[11px] text-gray-400 mt-1">Sobrecarga progresiva y Vax Coach</p>
                    </div>
                    <button type="button" onclick="navigate('workouts')" class="w-full py-2 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] hover:border-[#8B5CF6] text-xs font-extrabold text-white">
                        Ir a Entrenar →
                    </button>
                </div>
            </div>

            <!-- Tarjeta de Comunidad y Amigos (Debajo del resumen principal) -->
            <div class="p-5 rounded-2xl bg-[#121216] border border-[#8B5CF6]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div class="space-y-1">
                    <div class="flex items-center space-x-2">
                        <h3 class="text-base font-black text-white">👥 Comunidad y Amigos</h3>
                        <span class="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[11px] font-bold">${cachedAcceptedFriends} amigos</span>
                        ${cachedPendingFriends > 0 ? `<span class="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-extrabold">${cachedPendingFriends} solicitudes</span>` : ''}
                    </div>
                    <p class="text-xs text-gray-400">Revisa el muro de entrenamientos, clona rutinas públicas y compara récords cara a cara.</p>
                </div>
                <button type="button" onclick="navigate('social')" class="px-4 py-2.5 rounded-xl bg-[#8B5CF6] text-white text-xs font-extrabold shrink-0">
                    Abrir Comunidad →
                </button>
            </div>

            <!-- Motor de Correlaciones Cruzadas (Máx. 2 tarjetas) -->
            ${insights.length > 0 ? `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${insights.map(ins => `
                        <div class="p-4 rounded-2xl border ${ins.colorClass} space-y-1.5">
                            <span class="text-[10px] font-black uppercase tracking-wider">${ins.badge}</span>
                            <p class="text-xs leading-relaxed text-gray-200">${ins.text}</p>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}
