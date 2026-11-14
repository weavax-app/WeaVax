import { fsActions } from './firebase-sync.js?v=5';
import { isUserPro, openProPaywall } from './weavax-pro.js?v=2';

export const WEAVAX_THEMES = [
    { name: 'Morado WeaVax', hex: '#8B5CF6', isFree: true },
    { name: 'Azul Océano', hex: '#3B82F6', isFree: true },
    { name: 'Rojo Carmesí', hex: '#EF4444', isFree: true },
    { name: 'Verde Esmeralda', hex: '#10B981', isFree: false },
    { name: 'Ámbar Solar', hex: '#F59E0B', isFree: false },
    { name: 'Rosa Frambuesa', hex: '#EC4899', isFree: false },
    { name: 'Turquesa Cian', hex: '#06B6D4', isFree: false }
];

export const CURRENCY_CATALOG = [
    { code: 'Bs', name: 'Bolivianos (Bs)' },
    { code: 'USD', name: 'Dólares (USD)' },
    { code: 'EUR', name: 'Euros (EUR)' },
    { code: 'MXN', name: 'Pesos Mexicanos (MXN)' },
    { code: 'ARS', name: 'Pesos Argentinos (ARS)' },
    { code: 'CLP', name: 'Pesos Chilenos (CLP)' },
    { code: 'PEN', name: 'Soles Peruanos (PEN)' },
    { code: 'BRL', name: 'Reales Brasileños (BRL)' },
    { code: 'COP', name: 'Pesos Colombianos (COP)' }
];

const FREE_THEME_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444'];

export function renderSettings() {
    const p = window.state.profile || {};
    const u = window.state.user || {};
    const pro = window.state.pro || {};
    const container = document.getElementById('settings-full-container');
    if (!container) return;

    const currentColor = p.themeColor || localStorage.getItem('weavax_theme_color') || '#8B5CF6';
    const isDark = document.documentElement.classList.contains('dark');

    let enabledCurrs = p.enabledCurrencies || JSON.parse(localStorage.getItem('weavax_enabled_currencies') || '["Bs","USD"]');
    if (!Array.isArray(enabledCurrs) || enabledCurrs.length === 0) enabledCurrs = ['Bs'];

    let prefCurr = p.preferredCurrency || localStorage.getItem('weavax_pref_currency') || enabledCurrs[0];
    if (!enabledCurrs.includes(prefCurr)) {
        prefCurr = enabledCurrs[0];
        localStorage.setItem('weavax_pref_currency', prefCurr);
    }
    const enabledCurrencyObjects = CURRENCY_CATALOG.filter(c => enabledCurrs.includes(c.code));

    const notifEnabled = localStorage.getItem('weavax_notifs_enabled') !== '0';
    const notifHabits = localStorage.getItem('weavax_notif_habits') !== '0';
    const notifAgenda = localStorage.getItem('weavax_notif_agenda') !== '0';
    const notifWorkouts = localStorage.getItem('weavax_notif_workouts') !== '0';
    const notifWorkoutTime = localStorage.getItem('weavax_notif_workout_time') || '18:00';

    container.innerHTML = `
        <div class="mb-6 p-6 rounded-3xl bg-gradient-to-r from-[#181824] via-purple-900/20 to-[#181824] border border-accent/40 flex flex-wrap items-center justify-between gap-4">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="text-lg">👑</span>
                    <h4 class="text-base font-black">Suscripción WeaVax Pro · ${pro.isPro ? `Activa (${pro.planName || 'Pro'})` : 'Plan Gratuito'}</h4>
                </div>
                <p class="text-xs text-gray-400 mt-1">
                    Escaneos IA este mes: ${pro.isPro ? 'Ilimitados' : `${pro.scansUsed || 0} / 5`} · 
                    <span ondblclick="toggleSecretAdminMode()" class="cursor-pointer select-none underline decoration-dotted">Código de activación</span>
                </p>
            </div>
            <button type="button" onclick="openProPaywall()" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">
                ${pro.isPro ? 'Ver Mi Plan / Canjear' : '👑 Activar WeaVax Pro'}
            </button>
        </div>

        ${pro.isAdmin ? `
            <div class="mb-6 p-5 rounded-2xl bg-[#181824] border border-amber-500/40 space-y-3 text-xs">
                <div class="flex justify-between items-center">
                    <span class="font-extrabold text-amber-400">🛠️ Panel Administrador Secreto</span>
                    <button type="button" onclick="toggleSecretAdminMode()" class="text-gray-400">Ocultar</button>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button type="button" onclick="generateAdminProCode(30)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 1 Mes</button>
                    <button type="button" onclick="generateAdminProCode(90)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 3 Meses</button>
                    <button type="button" onclick="generateAdminProCode(365)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 1 Año</button>
                    <button type="button" onclick="generateAdminProCode(-1)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold">+ Vitalicio</button>
                    <button type="button" onclick="resetAiScansQuota()" class="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold">Reiniciar Cuota IA</button>
                </div>
                <p class="text-gray-400">Código generado: <code id="admin-generated-code" class="text-amber-300 font-mono font-bold">-</code></p>
            </div>
        ` : ''}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">👤</span>
                    <div><h4 class="text-sm font-extrabold">Perfil de Usuario</h4><p class="text-xs text-gray-400">Nombre, alias y foto</p></div>
                </div>
                <form onsubmit="saveProfileSettings(event)" class="space-y-3 text-xs">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input id="set-prof-name" value="${p.name || u.displayName || 'Marce'}" placeholder="Nombre" class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        <input id="set-prof-user" value="${p.username || (u.email ? u.email.split('@')[0] : 'marce')}" placeholder="Usuario" class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                    </div>
                    <input id="set-prof-avatar" value="${p.avatar || u.photoURL || ''}" placeholder="URL de Foto" class="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                    <button type="submit" class="px-4 py-2 rounded-xl bg-accent text-white font-bold">Guardar Perfil</button>
                </form>
            </div>

            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">🎨</span>
                        <div><h4 class="text-sm font-extrabold">Tema y Apariencia</h4><p class="text-xs text-gray-400">Modo visual y paleta oficial</p></div>
                    </div>
                    <button type="button" onclick="toggleAppThemeMode()" class="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-xs font-bold">
                        ${isDark ? '🌙 Oscuro' : '☀️ Claro'}
                    </button>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    ${WEAVAX_THEMES.map(t => `
                        <button type="button" onclick="applyWeavaxColor('${t.hex}')" class="flex items-center justify-between p-2 rounded-xl border ${currentColor.toLowerCase() === t.hex.toLowerCase() ? 'border-accent bg-accent/10' : 'border-gray-200 dark:border-[#28283C]'} text-left">
                            <div class="flex items-center space-x-2 min-w-0">
                                <span class="w-5 h-5 rounded-full shrink-0" style="background-color:${t.hex}"></span>
                                <span class="text-[11px] font-bold truncate">${t.name}</span>
                            </div>
                            ${(!t.isFree && !isUserPro()) ? '<span class="text-[10px] ml-1 shrink-0">👑</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">💱</span>
                    <div><h4 class="text-sm font-extrabold">Moneda Principal y Divisas</h4><p class="text-xs text-gray-400">Solo las monedas habilitadas aparecen arriba</p></div>
                </div>
                <div class="space-y-3 text-xs">
                    <select id="set-pref-curr" onchange="saveCurrencySettings()" class="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] font-bold">
                        ${enabledCurrencyObjects.map(c => `<option value="${c.code}" ${prefCurr === c.code ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                    <div class="flex flex-wrap gap-2">
                        ${CURRENCY_CATALOG.map(c => `
                            <label class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#0A0A0F] border ${enabledCurrs.includes(c.code) ? 'border-accent/60' : 'border-gray-200 dark:border-[#28283C]'} cursor-pointer">
                                <input type="checkbox" value="${c.code}" class="curr-bank-chk" ${enabledCurrs.includes(c.code) ? 'checked' : ''} onchange="saveCurrencySettings()">
                                <span class="font-bold">${c.code}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">🔔</span>
                        <div><h4 class="text-sm font-extrabold">Notificaciones</h4><p class="text-xs text-gray-400">Hábitos, tareas, eventos y gym</p></div>
                    </div>
                    <button type="button" onclick="requestWebNotifications()" class="px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-bold">Activar</button>
                </div>
                <div class="space-y-2 text-xs">
                    <label class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        <span class="font-bold">Sistema de notificaciones activo</span>
                        <input type="checkbox" id="notif-chk-all" ${notifEnabled ? 'checked' : ''} onchange="saveNotificationPreferences()" class="w-4 h-4">
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                        <label class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                            <span>🔥 Hábitos</span>
                            <input type="checkbox" id="notif-chk-habits" ${notifHabits ? 'checked' : ''} onchange="saveNotificationPreferences()" class="w-4 h-4">
                        </label>
                        <label class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                            <span>📅 Agenda</span>
                            <input type="checkbox" id="notif-chk-agenda" ${notifAgenda ? 'checked' : ''} onchange="saveNotificationPreferences()" class="w-4 h-4">
                        </label>
                    </div>
                    <div class="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="notif-chk-workouts" ${notifWorkouts ? 'checked' : ''} onchange="saveNotificationPreferences()" class="w-4 h-4">
                            <span>🏋️ Aviso Gym</span>
                        </label>
                        <input type="time" id="notif-workout-time" value="${notifWorkoutTime}" onchange="saveNotificationPreferences()" class="px-2 py-1 rounded bg-[#181824] border border-[#28283C] text-xs">
                    </div>
                </div>
            </div>

            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">📦</span>
                    <div><h4 class="text-sm font-extrabold">Respaldos y Excel</h4><p class="text-xs text-gray-400">Exportación e importación</p></div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                    <button type="button" onclick="openFinanceExcelExportModal()" class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-left">📊 Exportar Finanzas (.XLSX)</button>
                    <button type="button" onclick="exportLocalBackupJSON()" class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-left">⬇️ Respaldo Local (.JSON)</button>
                </div>
            </div>

            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">☁️</span>
                    <div><h4 class="text-sm font-extrabold">Cuenta y App de Escritorio</h4><p class="text-xs text-gray-400">${window.state.activeUserDocId || ''}</p></div>
                </div>
                <div class="flex flex-wrap gap-2 text-xs font-bold">
                    <button type="button" onclick="installWeavaxDesktopApp()" class="px-4 py-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30">💻 Instalar App en PC / Móvil</button>
                    <button type="button" onclick="logoutUser()" class="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">🚪 Cerrar Sesión</button>
                </div>
            </div>
        </div>
    `;
}

window.renderSettings = renderSettings;

window.saveProfileSettings = async (e) => {
    e.preventDefault();
    const name = document.getElementById('set-prof-name').value.trim();
    const username = document.getElementById('set-prof-user').value.trim();
    const avatar = document.getElementById('set-prof-avatar').value.trim();
    await fsActions.updateProfile({ name, username, avatar });
    alert('Perfil actualizado.');
};

window.applyWeavaxColor = async (hex) => {
    const cleanHex = String(hex || '').trim().toLowerCase();
    if (!FREE_THEME_COLORS.includes(cleanHex) && !isUserPro()) {
        return openProPaywall('Los tonos Esmeralda, Ámbar, Frambuesa y Cian son exclusivos de WeaVax Pro.');
    }
    document.documentElement.style.setProperty('--color-primary', hex);
    localStorage.setItem('weavax_theme_color', hex);
    if (window.state.activeUserDocId) await fsActions.updateProfile({ themeColor: hex });
    renderSettings();
};

window.toggleAppThemeMode = async () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('weavax_dark_mode', isDark ? '1' : '0');
    if (window.state.activeUserDocId) await fsActions.updateProfile({ isDarkMode: isDark });
    renderSettings();
};

window.saveCurrencySettings = async () => {
    let checked = Array.from(document.querySelectorAll('.curr-bank-chk:checked')).map(el => el.value);
    if (checked.length === 0) checked = ['Bs'];
    let pref = document.getElementById('set-pref-curr')?.value || checked[0];
    if (!checked.includes(pref)) pref = checked[0];
    localStorage.setItem('weavax_enabled_currencies', JSON.stringify(checked));
    localStorage.setItem('weavax_pref_currency', pref);
    if (window.state.profile) {
        window.state.profile.enabledCurrencies = checked;
        window.state.profile.preferredCurrency = pref;
    }
    if (window.state.activeUserDocId) await fsActions.updateProfile({ preferredCurrency: pref, enabledCurrencies: checked });
    renderSettings();
};

window.saveNotificationPreferences = () => {
    localStorage.setItem('weavax_notifs_enabled', document.getElementById('notif-chk-all')?.checked ? '1' : '0');
    localStorage.setItem('weavax_notif_habits', document.getElementById('notif-chk-habits')?.checked ? '1' : '0');
    localStorage.setItem('weavax_notif_agenda', document.getElementById('notif-chk-agenda')?.checked ? '1' : '0');
    localStorage.setItem('weavax_notif_workouts', document.getElementById('notif-chk-workouts')?.checked ? '1' : '0');
    localStorage.setItem('weavax_notif_workout_time', document.getElementById('notif-workout-time')?.value || '18:00');
};

window.requestWebNotifications = async () => {
    if (!('Notification' in window)) return alert('Navegador sin soporte de notificaciones.');
    const perm = await Notification.requestPermission();
    if (perm === 'granted') new Notification('WeaVax LifeOS', { body: '¡Notificaciones activadas!', icon: '../weavax_logo.png' });
};

window.exportLocalBackupJSON = () => {
    const blob = new Blob([JSON.stringify(window.state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `weavax_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
};
