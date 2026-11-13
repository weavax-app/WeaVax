// Categorías exactas de MainViewModel.kt
export const DEFAULT_NORMAL_CATEGORIES = [
    "Alimentación", "Transporte", "Servicios", "Salud", "Ocio", "Educación", "Compras", "Hogar"
];

export const DEFAULT_SUB_CATEGORIES = [
    "Streaming", "Música", "Gimnasio", "Software & Apps", "Cloud & Almacenamiento", "Gaming", "Membresías"
];

export const DEFAULT_INCOME_CATEGORIES = [
    "Salario", "Freelance", "Ventas", "Regalos", "Inversiones", "Otros"
];

export const finState = {
    subScreen: 'PRINCIPAL', // PRINCIPAL | CUENTAS | MOVIMIENTOS | PRESUPUESTOS | METAS | CATEGORIAS
    catTab: 'GASTO', // GASTO | SUSCRIPCION | INGRESO
    goalsTab: 'ACTIVAS', // ACTIVAS | COMPLETADAS
    txFilterType: 'TODOS', // TODOS | gasto | ingreso | transferencia
    selectedAccountId: null,
    customCategories: JSON.parse(localStorage.getItem('weavax_custom_categories') || '[]'),
    fastPresets: JSON.parse(localStorage.getItem('weavax_fast_expenses_prefs') || '[]'),
    qrAliases: JSON.parse(localStorage.getItem('weavax_qr_aliases') || '{}')
};

export function saveCustomCategories() {
    localStorage.setItem('weavax_custom_categories', JSON.stringify(finState.customCategories));
}

export function saveFastPresets() {
    localStorage.setItem('weavax_fast_expenses_prefs', JSON.stringify(finState.fastPresets));
}

export function getCategoriesByType(type = 'GASTO') {
    const custom = finState.customCategories.filter(c => c.type === type).map(c => c.name);
    if (type === 'INGRESO') return [...new Set([...DEFAULT_INCOME_CATEGORIES, ...custom])];
    if (type === 'SUSCRIPCION') return [...new Set([...DEFAULT_SUB_CATEGORIES, ...custom])];
    return [...new Set([...DEFAULT_NORMAL_CATEGORIES, ...custom])];
}

export function getAllExpenseCategories() {
    return [...new Set([
        ...getCategoriesByType('GASTO'),
        ...getCategoriesByType('SUSCRIPCION')
    ])];
}

// Calcula el gasto del mes actual para una categoría (igual que getMonthlySpentForCategory en FinanceDao.kt)
export function getMonthlySpentForCategory(category) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const txs = window.state.transactions || [];
    return txs
        .filter(tx => (tx.type === 'gasto' || Number(tx.amount) < 0) &&
                      String(tx.category || '').toLowerCase() === String(category || '').toLowerCase() &&
                      Number(tx.date || 0) >= startOfMonth)
        .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
}

export function formatMoney(amount, currency = 'Bs') {
    if (!window.state.isBalanceVisible) return `${currency} •••••`;
    return `${currency} ${Number(amount || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
