import { fsActions } from './firebase-sync.js?v=5';

export const FREE_LIMITS = {
    MAX_AI_SCANS_MONTH: 5,
    MAX_ACCOUNTS: 10,
    MAX_BUDGETS: 10,
    MAX_GOALS: 10,
    MAX_PROJECTS: 5
};

function getCurrentMonthKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function initProState() {
    const p = window.state.profile || {};
    const storedMonth = p.aiScansMonth || localStorage.getItem('pref_ai_scans_month') || '';
    const currentMonth = getCurrentMonthKey();

    let scansUsed = Number(p.aiScansCount ?? localStorage.getItem('pref_ai_scans_count') ?? 0);
    if (storedMonth !== currentMonth) {
        scansUsed = 0;
        localStorage.setItem('pref_ai_scans_month', currentMonth);
        localStorage.setItem('pref_ai_scans_count', '0');
    }

    const isPro = Boolean(p.isPro ?? (localStorage.getItem('pref_is_pro') === 'true'));
    const expiresAt = Number(p.proExpiresAt ?? localStorage.getItem('pref_pro_expires_at') ?? 0);
    const planName = p.proPlanName || localStorage.getItem('pref_pro_plan_name') || (isPro ? 'Activo' : 'Gratuito');
    const isAdmin = Boolean(p.isAdminMode ?? (localStorage.getItem('pref_is_admin_mode') === 'true'));

    window.state.pro = {
        isPro,
        expiresAt,
        planName,
        scansUsed,
        isAdmin,
        redeemedCodes: p.redeemedCodes || JSON.parse(localStorage.getItem('pref_redeemed_codes') || '[]'),
        authorizedCodes: p.authorizedCodes || JSON.parse(localStorage.getItem('pref_authorized_codes') || '[]')
    };

    checkProExpiration();
    updateProHeaderBadge();
}

// Réplica exacta de checkProExpiration(context) en MainViewModel.kt
export async function checkProExpiration() {
    const pro = window.state.pro;
    if (!pro) return;

    const VitalicioMark = 9000000000000; // Equivalente JS seguro para Long.MAX_VALUE
    if (pro.isPro && pro.expiresAt > 0 && pro.expiresAt < VitalicioMark) {
        const now = Date.now();
        if (now >= pro.expiresAt) {
            pro.isPro = false;
            pro.expiresAt = 0;
            pro.planName = 'Expirado';
            localStorage.setItem('pref_is_pro', 'false');
            localStorage.setItem('pref_pro_expires_at', '0');
            localStorage.setItem('pref_pro_plan_name', 'Expirado');
            if (window.state.activeUserDocId) {
                await fsActions.updateProfile({ isPro: false, proExpiresAt: 0, proPlanName: 'Expirado' });
            }
            alert('Tu suscripción WeaVax Pro ha vencido. Escríbenos a Instagram @weavax.app para renovar.');
        } else {
            const msLeft = pro.expiresAt - now;
            const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24));
            if (daysLeft >= 1 && daysLeft <= 3) {
                const warnKey = `warned_pro_expiry_${daysLeft}`;
                if (!localStorage.getItem(warnKey)) {
                    localStorage.setItem(warnKey, 'true');
                    alert(`¡Hey, ya se te va a acabar el premium! Te quedan ${daysLeft} días de WeaVax Pro.`);
                }
            }
        }
    }
}

export function isUserPro() {
    return Boolean(window.state.pro?.isPro);
}

// Verifica si puede ejecutar una acción o abre el Paywall de WeaVax Pro
export function requireProOrCheckLimit(featureKey, currentCount = 0, maxFree = 0, reasonText = '') {
    if (isUserPro()) return true;
    if (featureKey === 'PRO_ONLY') {
        openProPaywall(reasonText || 'Esta función es exclusiva de WeaVax Pro.');
        return false;
    }
    if (currentCount >= maxFree) {
        openProPaywall(reasonText || `Has alcanzado el límite del plan Gratuito (${maxFree}). Pásate a WeaVax Pro para desbloquear creación ilimitada.`);
        return false;
    }
    return true;
}

// Control de cuota mensual del Escáner IA (5 escaneos/mes en plan gratuito)
export async function consumeAiScanQuota() {
    if (isUserPro()) return true;
    const pro = window.state.pro;
    if (pro.scansUsed >= FREE_LIMITS.MAX_AI_SCANS_MONTH) {
        openProPaywall(`Agotaste tus ${FREE_LIMITS.MAX_AI_SCANS_MONTH} escaneos IA gratuitos de este mes. Con WeaVax Pro tienes escaneos QR y de recibos ilimitados.`);
        return false;
    }
    pro.scansUsed += 1;
    const monthKey = getCurrentMonthKey();
    localStorage.setItem('pref_ai_scans_month', monthKey);
    localStorage.setItem('pref_ai_scans_count', String(pro.scansUsed));
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ aiScansCount: pro.scansUsed, aiScansMonth: monthKey });
    }
    return true;
}

// Réplica exacta de redeemProCode(inputCode) en MainViewModel.kt
window.redeemProCode = async (inputCode) => {
    const clean = String(inputCode || '').trim().toUpperCase();
    if (!clean) return { ok: false, msg: 'Ingresa un código válido.' };

    const pro = window.state.pro;
    if (pro.redeemedCodes.includes(clean)) {
        return { ok: false, msg: 'Este código ya ha sido utilizado y no puede reutilizarse.' };
    }

    const matchedAuth = (pro.authorizedCodes || []).find(entry => entry.startsWith(`${clean}:`));
    let durationDays = 0;

    if (matchedAuth) {
        durationDays = parseInt(matchedAuth.split(':')[1], 10) || 30;
    } else if (clean.startsWith('WVX-1M-')) {
        durationDays = 30;
    } else if (clean.startsWith('WVX-3M-')) {
        durationDays = 90;
    } else if (clean.startsWith('WVX-6M-')) {
        durationDays = 180;
    } else if (clean.startsWith('WVX-1Y-')) {
        durationDays = 365;
    } else if (clean.startsWith('WVX-LIF-')) {
        durationDays = -1;
    } else if (clean === 'WEAVAXPRO') {
        durationDays = 30;
    } else if (clean === 'VIPCOCHABAMBA') {
        durationDays = 90;
    }

    if (durationDays === 0) {
        return { ok: false, msg: 'Código inválido o inexistente.' };
    }

    pro.redeemedCodes.push(clean);
    const now = Date.now();
    const expiresAt = durationDays === -1 ? 9999999999999 : now + (durationDays * 24 * 60 * 60 * 1000);
    const planLabel = durationDays === -1 ? 'Vitalicio' : `${durationDays} días`;

    pro.isPro = true;
    pro.expiresAt = expiresAt;
    pro.planName = planLabel;

    localStorage.setItem('pref_redeemed_codes', JSON.stringify(pro.redeemedCodes));
    localStorage.setItem('pref_pro_expires_at', String(expiresAt));
    localStorage.setItem('pref_pro_plan_name', planLabel);
    localStorage.setItem('pref_is_pro', 'true');

    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({
            isPro: true,
            proExpiresAt: expiresAt,
            proPlanName: planLabel,
            redeemedCodes: pro.redeemedCodes
        });
    }

    updateProHeaderBadge();
    if (window.renderSettings) window.renderSettings();
    return { ok: true, msg: `¡WeaVax Pro activado por ${planLabel}!` };
};

// Generador de códigos únicos (Solo Admin, idéntico a generateProCode en MainViewModel.kt)
window.generateAdminProCode = async (durationDays) => {
    const prefix = durationDays === 30 ? 'WVX-1M'
        : durationDays === 90 ? 'WVX-3M'
        : durationDays === 180 ? 'WVX-6M'
        : durationDays === 365 ? 'WVX-1Y'
        : 'WVX-LIF';

    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase().padEnd(8, 'X');
    const fullCode = `${prefix}-${randomPart}`;

    const pro = window.state.pro;
    pro.authorizedCodes.push(`${fullCode}:${durationDays}`);
    localStorage.setItem('pref_authorized_codes', JSON.stringify(pro.authorizedCodes));
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ authorizedCodes: pro.authorizedCodes });
    }

    const outEl = document.getElementById('admin-generated-code');
    if (outEl) outEl.textContent = fullCode;
    navigator.clipboard?.writeText(fullCode);
    return fullCode;
};

window.resetAiScansQuota = async () => {
    window.state.pro.scansUsed = 0;
    localStorage.setItem('pref_ai_scans_count', '0');
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ aiScansCount: 0 });
    }
    alert('Cuota mensual de escaneos IA reiniciada a 0.');
    if (window.renderSettings) window.renderSettings();
};

window.toggleSecretAdminMode = async () => {
    const next = !window.state.pro.isAdmin;
    window.state.pro.isAdmin = next;
    localStorage.setItem('pref_is_admin_mode', String(next));
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ isAdminMode: next });
    }
    if (window.renderSettings) window.renderSettings();
};

export function updateProHeaderBadge() {
    const isPro = isUserPro();
    let badge = document.getElementById('header-pro-badge');
    const streakBox = document.getElementById('streak-count')?.parentElement?.parentElement;
    if (!badge && streakBox) {
        badge = document.createElement('button');
        badge.id = 'header-pro-badge';
        badge.onclick = () => window.openProPaywall();
        streakBox.prepend(badge);
    }
    if (badge) {
        badge.className = isPro
            ? 'px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold'
            : 'px-3 py-1 rounded-full bg-[#181824] border border-[#28283C] hover:border-accent text-gray-300 text-xs font-bold';
        badge.innerHTML = isPro ? '👑 PRO' : '⚡ Hazte Pro';
    }
}

// Modal Interactivo WeavaxProDialog
window.openProPaywall = (customReason = '') => {
    const pro = window.state.pro || {};
    const isPro = Boolean(pro.isPro);
    const expDateStr = (pro.expiresAt && pro.expiresAt < 9000000000000)
        ? new Date(pro.expiresAt).toLocaleDateString('es-BO')
        : (isPro ? 'Vitalicio ∞' : 'Sin suscripción activa');

    window.openUniversalModal('👑 WeaVax Pro · Centro de Suscripción', `
        <div class="space-y-4 text-xs">
            ${customReason ? `
                <div class="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                    🔒 ${customReason}
                </div>
            ` : ''}

            <div class="flex justify-between text-[11px]"><span class="text-gray-400">🎨 Colores Esmeralda, Ámbar, Frambuesa y Cian</span><span class="font-bold text-emerald-400">Desbloqueados</span></div>
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isPro ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'}">
                        Estado: ${isPro ? `PRO ACTIVO (${pro.planName})` : 'PLAN GRATUITO'}
                    </span>
                    <span class="text-[11px] text-gray-400">Escaneos IA: <strong>${isPro ? 'Ilimitados' : `${pro.scansUsed || 0}/${FREE_LIMITS.MAX_AI_SCANS_MONTH}`}</strong></span>
                </div>
                ${isPro ? `<p class="text-[11px] text-gray-300">Vencimiento: <strong>${expDateStr}</strong></p>` : ''}
            </div>

            <!-- Comparativa Gratuito vs Pro -->
            <div class="space-y-2 p-3.5 rounded-2xl bg-[#0A0A0F] border border-[#28283C]">
                <p class="font-extrabold text-white mb-1">Beneficios incluidos en WeaVax Pro:</p>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">📷 Escáner IA de recibos y QR</span><span class="font-bold text-emerald-400">Ilimitado (Gratis: 5/mes)</span></div>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">🤖 Entrenador Personal IA (Vax Coach)</span><span class="font-bold text-emerald-400">Desbloqueado</span></div>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">🎨 Los 7 Colores de Tema Oficiales</span><span class="font-bold text-emerald-400">Desbloqueados</span></div>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">🔥 Hábitos, Cuentas, Metas y Rutinas</span><span class="font-bold text-emerald-400">Sin límites</span></div>
            </div>

            <!-- Canjear Código Único -->
            <form onsubmit="handleRedeemProSubmit(event)" class="space-y-2">
                <label class="text-[10px] font-bold uppercase text-gray-400">Canjear Código de Activación WeaVax Pro</label>
                <div class="flex gap-2">
                    <input id="pro-code-input" required placeholder="Ej. WVX-1M-XXXXXXXX" class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-mono uppercase font-bold">
                    <button type="submit" class="px-4 py-2.5 rounded-xl bg-accent text-white font-extrabold">Activar</button>
                </div>
                <p id="pro-redeem-feedback" class="text-[11px] font-bold hidden"></p>
            </form>

            <!-- Botón directo a Instagram @weavax.app -->
            <div class="pt-2 border-t border-[#28283C] flex items-center justify-between">
                <span class="text-[11px] text-gray-400">¿Aún no tienes tu código?</span>
                <a href="https://www.instagram.com/weavax.app/" target="_blank" rel="noopener noreferrer" class="px-3.5 py-2 rounded-xl bg-pink-500/15 text-pink-300 border border-pink-500/30 font-bold hover:bg-pink-500/25">
                    📲 Solicitar en @weavax.app →
                </a>
            </div>
        </div>
    `);
};

window.handleRedeemProSubmit = async (e) => {
    e.preventDefault();
    const code = document.getElementById('pro-code-input')?.value;
    const res = await window.redeemProCode(code);
    const fb = document.getElementById('pro-redeem-feedback');
    if (fb) {
        fb.classList.remove('hidden');
        fb.className = `text-[11px] font-bold ${res.ok ? 'text-emerald-400' : 'text-red-400'}`;
        fb.textContent = res.msg;
    }
    if (res.ok) {
        setTimeout(() => window.openProPaywall(), 900);
    }
};
export function openProPaywall(customReason = '') {
    const pro = window.state.pro || {};
    const isPro = Boolean(pro.isPro);
    const expDateStr = (pro.expiresAt && pro.expiresAt < 9000000000000)
        ? new Date(pro.expiresAt).toLocaleDateString('es-BO')
        : (isPro ? 'Vitalicio ∞' : 'Sin suscripción activa');

    window.openUniversalModal('👑 WeaVax Pro · Centro de Suscripción', `
        <div class="space-y-4 text-xs">
            ${customReason ? `
                <div class="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold">
                    🔒 ${customReason}
                </div>
            ` : ''}

            <div class="p-4 rounded-2xl bg-gradient-to-br from-[#181824] via-purple-900/25 to-[#0A0A0F] border border-accent/40 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isPro ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-500/20 text-gray-300'}">
                        Estado: ${isPro ? `PRO ACTIVO (${pro.planName})` : 'PLAN GRATUITO'}
                    </span>
                    <span class="text-[11px] text-gray-400">Escaneos IA: <strong>${isPro ? 'Ilimitados' : `${pro.scansUsed || 0}/${FREE_LIMITS.MAX_AI_SCANS_MONTH}`}</strong></span>
                </div>
                ${isPro ? `<p class="text-[11px] text-gray-300">Vencimiento: <strong>${expDateStr}</strong></p>` : ''}
            </div>

            <div class="space-y-2 p-3.5 rounded-2xl bg-[#0A0A0F] border border-[#28283C]">
                <p class="font-extrabold text-white mb-1">Beneficios incluidos en WeaVax Pro:</p>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">📷 Escáner IA de recibos y QR</span><span class="font-bold text-emerald-400">Ilimitado (Gratis: 5/mes)</span></div>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">🤖 Entrenador Personal IA (Vax Coach)</span><span class="font-bold text-emerald-400">Desbloqueado</span></div>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">🎨 Colores Esmeralda, Ámbar, Frambuesa y Cian</span><span class="font-bold text-emerald-400">Desbloqueados</span></div>
                <div class="flex justify-between text-[11px]"><span class="text-gray-400">🔥 Hábitos, Cuentas, Metas y Rutinas</span><span class="font-bold text-emerald-400">Sin límites</span></div>
            </div>

            <form onsubmit="handleRedeemProSubmit(event)" class="space-y-2">
                <label class="text-[10px] font-bold uppercase text-gray-400">Canjear Código de Activación WeaVax Pro</label>
                <div class="flex gap-2">
                    <input id="pro-code-input" required placeholder="Ej. WVX-1M-XXXXXXXX" class="flex-1 px-3.5 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#28283C] font-mono uppercase font-bold">
                    <button type="submit" class="px-4 py-2.5 rounded-xl bg-accent text-white font-extrabold">Activar</button>
                </div>
                <p id="pro-redeem-feedback" class="text-[11px] font-bold hidden"></p>
            </form>

            <div class="pt-2 border-t border-[#28283C] flex items-center justify-between">
                <span class="text-[11px] text-gray-400">¿Aún no tienes tu código?</span>
                <a href="https://www.instagram.com/weavax.app/" target="_blank" rel="noopener noreferrer" class="px-3.5 py-2 rounded-xl bg-pink-500/15 text-pink-300 border border-pink-500/30 font-bold hover:bg-pink-500/25">
                    📲 Solicitar en @weavax.app →
                </a>
            </div>
        </div>
    `);
}
window.openProPaywall = openProPaywall;

window.setProStatusAdmin = async (status) => {
    const pro = window.state.pro;
    pro.isPro = Boolean(status);
    pro.planName = status ? 'Admin Pro' : 'Gratuito';
    localStorage.setItem('pref_is_pro', String(Boolean(status)));
    localStorage.setItem('pref_pro_plan_name', pro.planName);
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ isPro: Boolean(status), proPlanName: pro.planName });
    }
    updateProHeaderBadge();
    if (window.renderSettings) window.renderSettings();
};
