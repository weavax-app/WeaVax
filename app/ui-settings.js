import { fsActions } from './firebase-sync.js';
import { isUsernameAvailable, syncPublicProfile } from './social/social-service.js';
import { applySilentModeClass } from './onboarding.js';

export function renderSettingsView(container) {
    const p = window.state?.profile || {};
    const isSilent = p.gamificationMode === 'SILENT_MINIMAL';

    container.innerHTML = `
        <div class="max-w-2xl mx-auto space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 class="text-2xl font-black tracking-tight text-white">Ajustes y Perfil</h3>
                    <p class="text-xs text-gray-400 mt-1">Configura tu identidad social, estilo de experiencia y suscripción</p>
                </div>
                <button type="button" onclick="navigate('progress')" class="px-4 py-2.5 rounded-xl bg-[#121216] border border-[#8B5CF6]/50 text-[#8B5CF6] text-xs font-extrabold">
                    Ver Progreso y Analíticas →
                </button>
            </div>

            <!-- Identidad y @usuario único -->
            <form onsubmit="saveUserSettingsForm(event)" class="p-6 rounded-2xl bg-[#121216] border border-[#1F1F26] space-y-4 text-xs">
                <h4 class="text-sm font-black text-white">👤 Perfil y Comunidad</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="text-[10px] font-bold uppercase text-gray-400">Nombre visible</label>
                        <input id="set-name" required value="${p.name || ''}" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-bold">
                    </div>
                    <div>
                        <label class="text-[10px] font-bold uppercase text-gray-400">Nombre de usuario (@username)</label>
                        <input id="set-username" required value="${p.username || ''}" placeholder="ej. marce_fit" class="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-bold">
                    </div>
                </div>

                <div>
                    <label class="text-[10px] font-bold uppercase text-gray-400 block mb-1.5">Modo de Experiencia</label>
                    <select id="set-gamification" class="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0A0C] border border-[#1F1F26] text-white font-bold">
                        <option value="GAMIFIED_XP" ${!isSilent ? 'selected' : ''}>🔥 Gamificado (XP, Niveles y Rachas con Escudos)</option>
                        <option value="SILENT_MINIMAL" ${isSilent ? 'selected' : ''}>🧘 Modo Silencioso Minimalista (Oculta barras de XP y niveles)</option>
                    </select>
                </div>

                <button type="submit" class="w-full py-2.5 rounded-xl bg-[#8B5CF6] text-white font-extrabold">Guardar Cambios</button>
            </form>

            <!-- Estado de Suscripción -->
            <div class="p-6 rounded-2xl bg-[#121216] border border-[#1F1F26] flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h4 class="text-sm font-black text-white">💎 Plan Actual: ${p.isPro ? 'WeaVax Pro Activo' : 'Plan Gratuito'}</h4>
                    <p class="text-xs text-gray-400 mt-1">Registro manual ilimitado sin anuncios. Desbloquea IA y Excel avanzado en Pro.</p>
                </div>
                <button type="button" onclick="openWeavaxProPaywall()" class="px-4 py-2.5 rounded-xl bg-[#8B5CF6]/15 border border-[#8B5CF6] text-[#8B5CF6] text-xs font-extrabold">
                    Ver Planes Pro →
                </button>
            </div>
        </div>
    `;
}

window.saveUserSettingsForm = async (e) => {
    e.preventDefault();
    const name = document.getElementById('set-name').value.trim();
    const rawUser = document.getElementById('set-username').value.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_.]/g, '');
    const gamificationMode = document.getElementById('set-gamification').value;

    if (rawUser.length < 3) return alert('El @usuario debe tener al menos 3 caracteres.');
    const available = await isUsernameAvailable(rawUser);
    if (!available) return alert(`El usuario @${rawUser} ya está en uso por otro atleta.`);

    await fsActions.updateProfile({ name, username: rawUser, gamificationMode });
    await syncPublicProfile({ name, username: rawUser });
    applySilentModeClass(gamificationMode);
    alert('Perfil actualizado y sincronizado.');
};
