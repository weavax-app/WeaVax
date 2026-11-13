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

const FREE_THEME_COLORS = ['#8b5cf6', '#3b82f6', '#ef4444'];

export function renderSettings() {
    const p = window.state.profile || {};
    const u = window.state.user || {};
    const pro = window.state.pro || {};
    const container = document.getElementById('settings-full-container');
    if (!container) return;

    const currentColor = p.themeColor || localStorage.getItem('weavax_theme_color') || '#8B5CF6';
    const isDark = document.documentElement.classList.contains('dark');
    const prefCurr = p.preferredCurrency || localStorage.getItem('weavax_pref_currency') || 'Bs';
    const enabledCurrs = p.enabledCurrencies || JSON.parse(localStorage.getItem('weavax_enabled_currencies') || '["Bs","USD","EUR"]');

    container.innerHTML = `
        <!-- TARJETA SUPERIOR DE SUSCRIPCIÓN WEAVAX PRO -->
        <div class="mb-6 p-6 rounded-3xl bg-gradient-to-r from-[#181824] via-purple-900/20 to-[#181824] border border-accent/40 flex flex-wrap items-center justify-between gap-4">
            <div>
                <div class="flex items-center space-x-2">
                    <span class="text-lg">👑</span>
                    <h4 class="text-base font-black">Suscripción WeaVax Pro · ${pro.isPro ? `Activa (${pro.planName \vert{}\vert{} 'Pro'})` : 'Plan Gratuito'}</h4> </div> <p class="text-xs text-gray-400 mt-1"> Escaneos IA usados este mes: ${pro.isPro ? 'Ilimitados' : `${pro.scansUsed || 0} / 5`} · 
                    <span ondblclick="toggleSecretAdminMode()" class="cursor-pointer select-none underline decoration-dotted" title="Doble clic para abrir generador Admin">Código de activación</span>
                </p>
            </div>
            <div class="flex gap-2">
                <button onclick="openProPaywall()" class="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-extrabold shadow-lg">
                    ${pro.isPro ? 'Ver Mi Plan / Canjear' : '👑 Activar WeaVax Pro'}
                </button>
            </div>
        </div>

        ${pro.isAdmin ? `
            <div class="mb-6 p-5 rounded-2xl bg-[#181824] border border-amber-500/40 space
