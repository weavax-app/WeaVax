import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export function computeCrossModuleInsights() {
    const insights = [];
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthProgressPct = Math.round((dayOfMonth / daysInMonth) * 100);

    // 1. Finanzas + Ritmo Mensual (Alerta preventiva en ámbar #F59E0B, nunca rojo)
    const budgets = window.state?.budgets || [];
    const txs = window.state?.transactions || [];
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    for (const b of budgets) {
        const spent = txs
            .filter(t => t.type === 'gasto' && t.category === b.category && new Date(Number(t.date || 0)).toISOString().startsWith(currentMonthPrefix))
            .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);

        const limit = Number(b.limitAmount || 0);
        if (limit > 0) {
            const spentPct = Math.round((spent / limit) * 100);
            if (spentPct > monthProgressPct + 15) {
                insights.push({
                    type: 'FINANCE_PACE',
                    badge: 'Ritmo de Presupuesto',
                    colorClass: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
                    text: `En ${b.category} llevas el ${spentPct}% del presupuesto mensual con el ${monthProgressPct}% del mes transcurrido. Considera moderar gastos esta semana.`
                });
                break;
            }
        }
    }

    // 2. Gym + Hábitos (Correlación volumen y descanso/hidratación)
    const sessions = (window.state?.workout_sessions || []).filter(s => s.isCompleted);
    const habits = window.state?.habits || [];
    if (sessions.length >= 2 && habits.length > 0 && insights.length < 2) {
        const latest = sessions[0];
        insights.push({
            type: 'GYM_HABIT',
            badge: 'Correlación Rendimiento',
            colorClass: 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]',
            text: `Tu última sesión (${latest.routineName}) acumuló ${Math.round(Number(latest.totalVolumeKg || 0)).toLocaleString('es-BO')} kg. Mantener tus hábitos de descanso e hidratación hoy acelera tu recuperación muscular.`
        });
    }

    return insights.slice(0, 2);
}

export async function publishDailyEcosystemSummary() {
    const db = window.db;
    const uid = window.state?.activeUserDocId;
    if (!db || !uid) return;

    const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayIso = new Date().toISOString().slice(0, 10);

    const todaySessions = (window.state?.workout_sessions || []).filter(s =>
        s.isCompleted && new Date(Number(s.startedAt || 0)).toISOString().startsWith(todayIso)
    );
    const workoutVolumeKg = todaySessions.reduce((a, s) => a + Number(s.totalVolumeKg || 0), 0);
    const workoutDurationMinutes = Math.round(todaySessions.reduce((a, s) => a + Number(s.durationSeconds || 0), 0) / 60);

    const foodExpensesBase = (window.state?.transactions || [])
        .filter(t => t.type === 'gasto' && t.category === 'Alimentación' && new Date(Number(t.date || 0)).toISOString().startsWith(todayIso))
        .reduce((a, t) => a + Math.abs(Number(t.amount || 0)), 0);

    const hydrationCompleted = (window.state?.habits || []).some(h =>
        /agua|hidrat/i.test(h.title || '') && (h.completedDates || []).includes(todayIso)
    );

    await setDoc(doc(db, 'users', uid, 'ecosystem_summary', `daily_${todayKey}`), {
        date: todayIso,
        workoutVolumeKg: Math.round(workoutVolumeKg),
        workoutDurationMinutes,
        estimatedCaloriesBurned: Math.round(workoutDurationMinutes * 6.5),
        foodExpensesBase: Math.round(foodExpensesBase * 100) / 100,
        hydrationCompleted,
        updatedAt: Date.now()
    }, { merge: true });
}
