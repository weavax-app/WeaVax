import { isUserPro, openProPaywall, FREE_LIMITS } from './weavax-pro.js?v=1';
import { fsActions } from './firebase-sync.js?v=2';

export const WEAVAX_THEMES = [
    { name: 'Morado WeaVax', hex: '#8B5CF6', isFree: true },
    { name: 'Azul Océano', hex: '#3B82F6', isFree: true },
    { name: 'Rojo Carmesí', hex: '#EF4444', isFree: true },
    { name: 'Verde Esmeralda', hex: '#10B981', isFree: false },
    { name: 'Ámbar Solar', hex: '#F59E0B', isFree: false },
    { name: 'Rosa Frambuesa', hex: '#EC4899', isFree: false },
    { name: 'Turquesa Cian', hex: '#06B6D4', isFree: false }
];

export function renderSettings() {
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    ${WEAVAX_THEMES.map(t => `
                        <button onclick="applyWeavaxColor('${t.hex}')" class="flex items-center justify-between p-2 rounded-xl border ${currentColor.toLowerCase() === t.hex.toLowerCase() ? 'border-accent bg-accent/10' : 'border-gray-200 dark:border-[#28283C]'} hover:opacity-90 transition-all text-left">
                            <div class="flex items-center space-x-2 min-w-0">
                                <span class="w-5 h-5 rounded-full shrink-0" style="background-color:${t.hex}"></span>
                                <span class="text-[11px] font-bold truncate">${t.name}</span>
                            </div>
                            ${(!t.isFree && !isUserPro()) ? '<span class="text-[10px] ml-1 shrink-0" title="Exclusivo WeaVax Pro">👑</span>' : ''}
                        </button>
                    `).join('')}
                </div>
    const p = window.state.profile || {};
    const u = window.state.user || {};
    const container = document.getElementById('settings-full-container');
    if (!container) return;

    const currentColor = p.themeColor || localStorage.getItem('weavax_theme_color') || '#8B5CF6';
    const isDark = document.documentElement.classList.contains('dark');
    const prefCurr = p.preferredCurrency || localStorage.getItem('weavax_pref_currency') || 'Bs';
    const enabledCurrs = p.enabledCurrencies || JSON.parse(localStorage.getItem('weavax_enabled_currencies') || '["Bs","USD","EUR"]');

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <!-- 1. EDITAR PERFIL -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">👤</span>
                    <div>
                        <h4 class="text-sm font-extrabold">Perfil de Usuario</h4>
                        <p class="text-xs text-gray-400">Nombre, alias (@username) y foto de perfil</p>
                    </div>
                </div>
                <form onsubmit="saveProfileSettings(event)" class="space-y-3 text-xs">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="text-[10px] text-gray-400 font-bold uppercase">Nombre Completo</label>
                            <input id="set-prof-name" value="${p.name || u.displayName || 'Marce'}" class="mt-1 w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        </div>
                        <div>
                            <label class="text-[10px] text-gray-400 font-bold uppercase">Usuario / Alias</label>
                            <input id="set-prof-user" value="${p.username || (u.email ? u.email.split('@')[0] : 'marce')}" class="mt-1 w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        </div>
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase">URL de Foto o Avatar</label>
                        <input id="set-prof-avatar" value="${p.avatar || u.photoURL || ''}" placeholder="https://... o deja vacío para foto de Google" class="mt-1 w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                    </div>
                    <button type="submit" class="px-4 py-2 rounded-xl bg-accent text-white font-bold">Guardar Perfil</button>
                </form>
            </div>

            <!-- 2. TEMA Y APARIENCIA (7 COLORES + MODO CLARO/OSCURO) -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-xl">🎨</span>
                        <div>
                            <h4 class="text-sm font-extrabold">Tema y Apariencia</h4>
                            <p class="text-xs text-gray-400">Modo visual y paleta oficial WeaVax</p>
                        </div>
                    </div>
                    <button onclick="toggleAppThemeMode()" class="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] text-xs font-bold">
                        ${isDark ? '🌙 Modo Oscuro' : '☀️ Modo Claro'}
                    </button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                    ${WEAVAX_THEMES.map(t => `
                        <button onclick="applyWeavaxColor('${t.hex}')" class="flex items-center space-x-2.5 p-2 rounded-xl border ${currentColor.toLowerCase() === t.hex.toLowerCase() ? 'border-white bg-white/5' : 'border-gray-200 dark:border-[#28283C]'} hover:opacity-90 transition-all text-left">
                            <span class="w-5 h-5 rounded-full shrink-0" style="background-color:${t.hex}"></span>
                            <span class="text-[11px] font-bold truncate">${t.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- 3. MONEDA PREDETERMINADA Y BANCO DE MONEDAS -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">💱</span>
                    <div>
                        <h4 class="text-sm font-extrabold">Moneda Predeterminada y Banco de Divisas</h4>
                        <p class="text-xs text-gray-400">Configura tu divisa base y las monedas activas en Finanzas</p>
                    </div>
                </div>
                <div class="space-y-3 text-xs">
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase">Moneda Principal</label>
                        <select id="set-pref-curr" onchange="saveCurrencySettings()" class="mt-1 w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                            <option value="Bs" ${prefCurr === 'Bs' ? 'selected' : ''}>Bolivianos (Bs)</option>
                            <option value="USD" ${prefCurr === 'USD' ? 'selected' : ''}>Dólares (USD)</option>
                            <option value="EUR" ${prefCurr === 'EUR' ? 'selected' : ''}>Euros (EUR)</option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] text-gray-400 font-bold uppercase block mb-1.5">Banco de Monedas Habilitadas</label>
                        <div class="flex flex-wrap gap-2">
                            ${['Bs', 'USD', 'EUR', 'ARS', 'CLP', 'PEN', 'MXN', 'BRL'].map(c => `
                                <label class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] cursor-pointer">
                                    <input type="checkbox" value="${c}" class="curr-bank-chk accent-purple-600" ${enabledCurrs.includes(c) ? 'checked' : ''} onchange="saveCurrencySettings()">
                                    <span class="font-bold">${c}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <!-- 4. NOTIFICACIONES Y PRIVACIDAD & SEGURIDAD -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">🛡️</span>
                    <div>
                        <h4 class="text-sm font-extrabold">Notificaciones, Privacidad y Seguridad</h4>
                        <p class="text-xs text-gray-400">Avisos del navegador y censura de saldos</p>
                    </div>
                </div>
                <div class="space-y-3 text-xs">
                    <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        <div>
                            <p class="font-bold">Notificaciones del Navegador</p>
                            <p class="text-[10px] text-gray-400">Recordatorios de hábitos, tareas y agenda</p>
                        </div>
                        <button onclick="requestWebNotifications()" class="px-3 py-1.5 rounded-lg bg-accent text-white font-bold">Activar</button>
                    </div>
                    <div class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C]">
                        <div>
                            <p class="font-bold">Ocultar Saldos al Iniciar (Modo Privacidad)</p>
                            <p class="text-[10px] text-gray-400">Muestra Bs ••••• por defecto</p>
                        </div>
                        <button onclick="toggleBalancePrivacy()" class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#28283C] font-bold">
                            ${window.state.isBalanceVisible ? 'Saldos Visibles' : 'Saldos Ocultos 🔒'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 5. RESPALDOS, EXCEL CSV E HISTORIAL DE ENTRENAMIENTO -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">📦</span>
                    <div>
                        <h4 class="text-sm font-extrabold">Respaldos y Exportación de Datos (JSON / CSV / Excel)</h4>
                        <p class="text-xs text-gray-400">Compatible con el gestor de respaldos de tu app móvil</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-bold">
                    <button onclick="exportLocalBackupJSON()" class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent text-left">⬇️ Exportar Respaldo Local (.JSON)</button>
                    <label class="p-3 rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent text-left cursor-pointer">
                        ⬆️ Restaurar Respaldo Local (.JSON)
                        <input type="file" accept=".json" class="hidden" onchange="importLocalBackupJSON(event)">
                    </label>
                    <button onclick="exportFinancesToCSV()" class="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 text-left">📊 Exportar Finanzas a Excel (.CSV)</button>
                    <button onclick="exportWorkoutsToCSV()" class="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 text-left">🏋️ Exportar Historial Gym (.CSV)</button>
                    <label class="sm:col-span-2 p-3 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 text-left cursor-pointer">
                        📥 Importar Historial de Entrenamientos (.CSV)
                        <input type="file" accept=".csv" class="hidden" onchange="importWorkoutsFromCSV(event)">
                    </label>
                </div>
            </div>

            <!-- 6. NUBE, TUTORIAL INTERACTIVO Y SESIÓN -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                <div class="flex items-center space-x-3">
                    <span class="text-xl">☁️</span>
                    <div>
                        <h4 class="text-sm font-extrabold">Sincronización Cloud, Tutorial y Cuenta</h4>
                        <p class="text-xs text-gray-400">Ruta activa: <code class="text-accent">${window.state.activeUserDocId || ''}</code></p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2.5 text-xs font-bold">
                    <button onclick="cleanFirestoreDuplicates()" class="px-4 py-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">🧹 Limpiar Duplicados en la Nube</button>
                    <button onclick="openAppInteractiveTutorial()" class="px-4 py-2.5 rounded-xl bg-accent/15 text-accent border border-accent/30">✨ Tutorial Interactivo de la App</button>
                    <button onclick="logoutUser()" class="px-4 py-2.5 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30">🚪 Cerrar Sesión</button>
                </div>
            </div>

        </div>
    `;
}
const pro = window.state.pro || {};
<!-- TARJETA SUPERIOR DE SUSCRIPCIÓN WEAVAX PRO -->
        <div class="mb-6 p-6 rounded-3xl bg-gradient-to-r from-[#181824] via-purple-900/20 to-[#181824] border border-accent/40 flex flex-wrap items-center justify-between gap-4">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="text-lg">👑</span>
                    <h4 class="text-base font-black">Suscripción WeaVax Pro · ${pro.isPro ? `Activa (${pro.planName})` : 'Plan Gratuito'}</h4>
                </div>
                <p class="text-xs text-gray-400 mt-1">Escaneos IA usados este mes: ${pro.isPro ? 'Ilimitados' : `${pro.scansUsed || 0} / 5`} · <span ondblclick="toggleSecretAdminMode()" class="cursor-pointer select-none" title="Doble clic para modo Admin">Código de activación</span></p>
            </div>
            <div class="flex gap-2">
                <button onclick="openProPaywall()" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">
                    ${pro.isPro ? 'Ver Mi Plan / Canjear' : '👑 Activar WeaVax Pro'}
                </button>
            </div>
        </div>

        ${pro.isAdmin ? `
            <div class="mb-6 p-5 rounded-2xl bg-[#181824] border border-amber-500/40 space-y-3 text-xs">
                <div class="flex justify-between items-center">
                    <span class="font-extrabold text-amber-400">🛠️ Panel Administrador Secreto (Generador de Códigos Pro)</span>
                    <button onclick="toggleSecretAdminMode()" class="text-gray-400 hover:text-white">Ocultar</button>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button onclick="generateAdminProCode(30)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 1 Mes (30d)</button>
                    <button onclick="generateAdminProCode(90)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 3 Meses (90d)</button>
                    <button onclick="generateAdminProCode(180)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 6 Meses (180d)</button>
                    <button onclick="generateAdminProCode(365)" class="px-3 py-1.5 rounded-lg bg-[#0A0A0F] border border-[#28283C] font-bold">+ 1 Año (365d)</button>
                    <button onclick="generateAdminProCode(-1)" class="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold">+ Vitalicio</button>
                    <button onclick="resetAiScansQuota()" class="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold">Reiniciar Cuota IA</button>
                    <button onclick="setProStatusAdmin(${!pro.isPro})" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold">Alternar Pro Directo</button>
                </div>
                <p class="text-gray-400">Último código generado (copiado al portapapeles): <code id="admin-generated-code" class="text-amber-300 font-mono font-bold">-</code></p>
            </div>
        ` : ''}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
window.saveProfileSettings = async (e) => {
    e.preventDefault();
    const name = document.getElementById('set-prof-name').value.trim();
    const username = document.getElementById('set-prof-user').value.trim();
    const avatar = document.getElementById('set-prof-avatar').value.trim();
    await fsActions.updateProfile({ name, username, avatar });
    alert('Perfil actualizado y sincronizado.');
};

const FREE_THEME_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444'];

window.applyWeavaxColor = async (hex) => {
    const cleanHex = String(hex || '').trim().toLowerCase();
    if (!FREE_THEME_COLORS.includes(cleanHex) && !isUserPro()) {
        return window.openProPaywall('Los tonos Verde Esmeralda, Ámbar Solar, Rosa Frambuesa y Turquesa Cian son exclusivos de WeaVax Pro. (Morado, Azul y Rojo son gratuitos).');
    }
    document.documentElement.style.setProperty('--color-primary', hex);
    localStorage.setItem('weavax_theme_color', hex);
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ themeColor: hex });
    }
    renderSettings();
};

window.toggleAppThemeMode = async () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('weavax_dark_mode', isDark ? '1' : '0');
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ isDarkMode: isDark });
    }
    renderSettings();
};

window.saveCurrencySettings = async () => {
    const pref = document.getElementById('set-pref-curr').value;
    const checked = Array.from(document.querySelectorAll('.curr-bank-chk:checked')).map(el => el.value);
    localStorage.setItem('weavax_pref_currency', pref);
    localStorage.setItem('weavax_enabled_currencies', JSON.stringify(checked));
    if (window.state.activeUserDocId) {
        await fsActions.updateProfile({ preferredCurrency: pref, enabledCurrencies: checked });
    }
};

window.requestWebNotifications = async () => {
    if (!('Notification' in window)) return alert('Tu navegador no soporta notificaciones.');
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
        new Notification('WeaVax LifeOS', { body: '¡Notificaciones activadas correctamente!', icon: '../weavax_logo.png' });
    }
};

window.exportLocalBackupJSON = () => {
    const payload = {
        exportedAt: new Date().toISOString(),
        profile: window.state.profile,
        habits: window.state.habits,
        tasks: window.state.tasks,
        projects: window.state.projects,
        accounts: window.state.accounts,
        transactions: window.state.transactions,
        budgets: window.state.budgets,
        goals: window.state.goals,
        workout_routines: window.state.workout_routines,
        workout_sessions: window.state.workout_sessions
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `weavax_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
};

window.importLocalBackupJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        try {
            const data = JSON.parse(reader.result);
            const cols = ['habits', 'tasks', 'projects', 'accounts', 'transactions', 'budgets', 'goals', 'workout_routines', 'workout_sessions'];
            for (const c of cols) {
                if (Array.isArray(data[c])) {
                    for (const item of data[c]) {
                        await fsActions.setItem(c, item.id || Date.now(), item);
                    }
                }
            }
            alert('¡Respaldo restaurado y sincronizado con Firestore!');
        } catch (err) {
            alert('Archivo JSON inválido: ' + err.message);
        }
    };
    reader.readAsText(file);
};

window.exportFinancesToCSV = () => {
    const rows = [['Fecha', 'Concepto', 'Tipo', 'Categoria', 'Cuenta', 'Moneda', 'Monto']];
    (window.state.transactions || []).forEach(tx => {
        const d = tx.date ? (isNaN(tx.date) ? tx.date : new Date(Number(tx.date)).toISOString().slice(0, 10)) : '';
        rows.push([d, `"${(tx.title || '').replace(/"/g, '""')}"`, tx.type || '', tx.category || '', tx.accountName || '', tx.currency || 'Bs', tx.amount || 0]);
    });
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `weavax_finanzas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
};

window.exportWorkoutsToCSV = () => {
    const rows = [['Fecha', 'Rutina', 'Duracion_Min', 'Volumen_Kg', 'Series_Completadas', 'Notas']];
    (window.state.workout_sessions || []).forEach(s => {
        const d = s.startedAt ? new Date(Number(s.startedAt)).toISOString().slice(0, 10) : '';
        rows.push([d, `"${(s.routineName || '').replace(/"/g, '""')}"`, Math.round(Number(s.durationSeconds || 0) / 60), s.totalVolumeKg || 0, s.totalCompletedSets || 0, `"${(s.notes || '').replace(/"/g, '""')}"`]);
    });
    const csv = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = `weavax_entrenamientos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
};

window.importWorkoutsFromCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
        const lines = reader.result.split('\n').slice(1).filter(l => l.trim());
        for (const line of lines) {
            const cols = line.split(',');
            const id = Date.now() + Math.floor(Math.random() * 1000);
            await fsActions.setItem('workout_sessions', id, {
                routineName: (cols[1] || 'Sesión Importada').replace(/"/g, ''),
                startedAt: Date.now(),
                durationSeconds: Number(cols[2] || 45) * 60,
                totalVolumeKg: Number(cols[3] || 0),
                totalCompletedSets: Number(cols[4] || 12),
                isCompleted: true
            });
        }
        alert(`¡Se importaron ${lines.length} sesiones al historial!`);
    };
    reader.readAsText(file);
};

window.openAppInteractiveTutorial = () => {
    window.openUniversalModal('✨ Tutorial Interactivo de WeaVax LifeOS', `
        <div class="space-y-3 text-xs text-gray-300 leading-relaxed">
            <p><strong class="text-white">1. Mi Día & Daily Score:</strong> Evalúa tus hábitos programados hoy, tus tareas accionables (sin eventos) y tu sesión de entrenamiento.</p>
            <p><strong class="text-white">2. Plan, Agenda y Proyectos:</strong> Separa Eventos (bloques horarios) de Tareas (con prioridad y proyectos).</p>
            <p><strong class="text-white">3. Finanzas & Escáner IA:</strong> Registra gastos, ingresos o sube comprobantes QR para extraer monto y comercio automáticamente.</p>
            <p><strong class="text-white">4. WeaVax Gym:</strong> Usa las plantillas predefinidas o crea tus propias rutinas divididas por días.</p>
        </div>
    `);
};
