import './finance-export.js?v=1';
import {
    finState,
    getCategoriesByType,
    getMonthlySpentForCategory,
    formatMoney,
    saveCustomCategories
} from './finance-state.js';

export function renderFinanceModule(container) {
    const accounts = window.state.accounts || [];
    const txs = window.state.transactions || [];
    const budgets = window.state.budgets || [];
    const goals = window.state.goals || [];

    const totalBs = accounts.reduce((sum, a) => {
        const rate = a.currency === 'USD' ? 6.96 : a.currency === 'EUR' ? 7.5 : 1;
        return sum + (Number(a.balance || 0) * rate);
    }, 0);

    // Actualizar tarjeta de Inicio / Mi Día si existe
    const dashBal = document.getElementById('dashboard-total-balance');
    if (dashBal) dashBal.textContent = formatMoney(totalBs, 'Bs');

    // Barra superior de navegación de subpantallas de Finanzas
    const navBarHtml = `
        <div class="flex flex-wrap items-center justify-between gap-4 pb-2">
            <div>
                <h3 class="text-2xl font-black tracking-tight">Finanzas</h3>
                <p class="text-xs text-gray-400 mt-0.5">Cuentas, transferencias, presupuestos, metas y escáner IA</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button onclick="openReceiptScannerModal()" class="px-3.5 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">📷 Escanear QR / IA</button>
                <button onclick="openTxModal('gasto')" class="px-3.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-xs font-bold">- Gasto</button>
                <button onclick="openTxModal('ingreso')" class="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">+ Ingreso</button>
                <button onclick="openTransferModal()" class="px-3.5 py-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-bold">⇄ Transferir</button>
                <button onclick="openFinanceExcelExportModal()" class="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold">📊 Exportar Excel (.xlsx)</button>
            </div>
        </div>

        <div class="flex flex-wrap gap-2 border-b border-gray-200 dark:border-[#28283C] pb-4">
            ${[
                { id: 'PRINCIPAL', label: '📊 Resumen' },
                { id: 'CUENTAS', label: `🏦 Cuentas (${accounts.length})` },
                { id: 'MOVIMIENTOS', label: `📑 Movimientos (${txs.length})` },
                { id: 'PRESUPUESTOS', label: `🎯 Presupuestos (${budgets.length})` },
                { id: 'METAS', label: `🏆 Metas (${goals.length})` },
                { id: 'CATEGORIAS', label: '🏷️ Categorías' }
            ].map(tab => `
                <button onclick="setFinanceSubScreen('${tab.id}')" class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${finState.subScreen === tab.id ? 'bg-accent text-white shadow-lg' : 'bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] text-gray-400 hover:border-accent'}">
                    ${tab.label}
                </button>
            `).join('')}
        </div>
    `;

    // 1. SUBPANTALLA PRINCIPAL
    if (finState.subScreen === 'PRINCIPAL') {
        container.innerHTML = `
            <div class="space-y-7">
                ${navBarHtml}

                <!-- TARJETA CENTRAL DE BALANCE CONSOLIDADO + ACCIONES RÁPIDAS -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex flex-col justify-between">
                        <div class="flex items-center justify-between">
                            <span class="text-[11px] font-bold uppercase tracking-wider text-gray-400">Patrimonio Consolidado</span>
                            <button onclick="toggleBalancePrivacy()" class="text-sm p-1.5 rounded-lg bg-gray-100 dark:bg-[#0A0A0F]">👁️‍🗨️</button>
                        </div>
                        <div class="text-3xl font-black my-3 text-accent">${formatMoney(totalBs, 'Bs')}</div>
                        <p class="text-[11px] text-gray-400">${accounts.length} cuentas activas sincronizadas</p>
                    </div>

                    <!-- ACCIONES RÁPIDAS (FastExpensePresets de Android) -->
                    <div class="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-3">
                        <div class="flex items-center justify-between">
                            <div>
                                <h4 class="text-sm font-extrabold">⚡ Acciones Rápidas (1 Clic)</h4>
                                <p class="text-[11px] text-gray-400">Precarga tus gastos o ingresos frecuentes al instante</p>
                            </div>
                            <button onclick="openFastPresetCreatorModal()" class="text-xs font-bold text-accent hover:underline">+ Crear Acción Rápida</button>
                        </div>
                        <div class="flex flex-wrap gap-2.5 pt-1">
                            ${finState.fastPresets.length === 0 ? `
                                <p class="text-xs text-gray-500">Sin acciones rápidas configuradas. Crea una para pasajes, almuerzo, café o suscripciones.</p>
                            ` : finState.fastPresets.map(p => `
                                <div class="inline-flex items-center rounded-xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] overflow-hidden">
                                    <button onclick="triggerFastPreset('${p.id}')" class="px-3.5 py-2 text-xs font-bold hover:bg-accent/15 flex items-center space-x-2">
                                        <span>${p.type === 'INGRESO' ? '💰' : '💸'}</span>
                                        <span>${p.title}</span>
                                        ${p.defaultAmount ? `<span class="text-accent font-mono">(Bs ${p.defaultAmount})</span>` : ''}
                                    </button>
                                    <button onclick="deleteFastPreset('${p.id}')" class="px-2 py-2 text-[10px] text-gray-500 hover:text-red-400 border-l border-[#28283C]">✕</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- CUENTAS ACTIVAS -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <h4 class="text-sm font-extrabold">Mis Cuentas</h4>
                        <button onclick="openAccountModal()" class="text-xs font-bold text-accent hover:underline">+ Nueva Cuenta</button>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${accounts.map(a => renderAccountCard(a)).join('')}
                    </div>
                </div>

                <!-- RESUMEN DE PRESUPUESTOS Y METAS -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="text-sm font-extrabold">Presupuestos del Mes</h4>
                            <button onclick="openBudgetModal()" class="text-xs font-bold text-accent">+ Nuevo</button>
                        </div>
                        ${budgets.length === 0 ? '<p class="text-xs text-gray-400">Sin presupuestos activos.</p>' : budgets.map(renderBudgetCard).join('')}
                    </div>

                    <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-3">
                        <div class="flex items-center justify-between">
                            <h4 class="text-sm font-extrabold">Metas de Ahorro Activas</h4>
                            <button onclick="openGoalModal()" class="text-xs font-bold text-accent">+ Nueva Meta</button>
                        </div>
                        ${goals.filter(g => !g.isCompleted).length === 0 ? '<p class="text-xs text-gray-400">Sin metas activas.</p>' : goals.filter(g => !g.isCompleted).map(renderGoalCard).join('')}
                    </div>
                </div>

                <!-- ÚLTIMOS MOVIMIENTOS -->
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-4">
                    <div class="flex items-center justify-between">
                        <h4 class="text-sm font-extrabold">Últimos Movimientos</h4>
                        <button onclick="setFinanceSubScreen('MOVIMIENTOS')" class="text-xs font-bold text-accent hover:underline">Ver todos →</button>
                    </div>
                    <div class="space-y-2">
                        ${txs.slice(0, 8).map(renderTransactionRow).join('')}
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // 2. SUBPANTALLA CUENTAS
    if (finState.subScreen === 'CUENTAS') {
        container.innerHTML = `
            <div class="space-y-6">
                ${navBarHtml}
                <div class="flex justify-between items-center">
                    <h4 class="text-base font-extrabold">Cuentas Activas (${accounts.length})</h4>
                    <button onclick="openAccountModal()" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold">+ Crear Cuenta</button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${accounts.map(a => renderAccountCard(a)).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 3. SUBPANTALLA MOVIMIENTOS DEL MES (MovimientosMesScreen)
    if (finState.subScreen === 'MOVIMIENTOS') {
        const filteredTxs = txs.filter(t => finState.txFilterType === 'TODOS' || t.type === finState.txFilterType);
        container.innerHTML = `
            <div class="space-y-6">
                ${navBarHtml}
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex gap-2">
                        ${['TODOS', 'gasto', 'ingreso', 'transferencia'].map(f => `
                            <button onclick="setTxFilter('${f}')" class="px-3.5 py-1.5 rounded-full text-xs font-bold capitalize ${finState.txFilterType === f ? 'bg-accent text-white' : 'bg-[#181824] border border-[#28283C] text-gray-400'}">${f}</button>
                        `).join('')}
                    </div>
                    <span class="text-xs text-gray-400">Haz clic en ✎ para editar cualquier movimiento y recalcular el saldo</span>
                </div>
                <div class="p-6 rounded-3xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] space-y-2.5">
                    ${filteredTxs.length === 0 ? '<p class="text-xs text-gray-400">Sin movimientos en este filtro.</p>' : filteredTxs.map(renderTransactionRow).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 4. SUBPANTALLA PRESUPUESTOS
    if (finState.subScreen === 'PRESUPUESTOS') {
        container.innerHTML = `
            <div class="space-y-6">
                ${navBarHtml}
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="text-base font-extrabold">Presupuestos por Categoría</h4>
                        <p class="text-xs text-gray-400">Se calculan automáticamente sumando tus gastos del mes en esa categoría</p>
                    </div>
                    <button onclick="openBudgetModal()" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold">+ Crear Presupuesto</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${budgets.length === 0 ? '<p class="text-xs text-gray-400">No tienes presupuestos creados.</p>' : budgets.map(renderBudgetCard).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 5. SUBPANTALLA METAS DE AHORRO (LARGO PLAZO Y REPETIDAS)
    if (finState.subScreen === 'METAS') {
        const activeGoals = goals.filter(g => !g.isCompleted);
        const doneGoals = goals.filter(g => g.isCompleted);
        const list = finState.goalsTab === 'ACTIVAS' ? activeGoals : doneGoals;

        container.innerHTML = `
            <div class="space-y-6">
                ${navBarHtml}
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex gap-2">
                        <button onclick="setGoalsSubTab('ACTIVAS')" class="px-4 py-2 rounded-xl text-xs font-bold ${finState.goalsTab === 'ACTIVAS' ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Activas (${activeGoals.length})</button>
                        <button onclick="setGoalsSubTab('COMPLETADAS')" class="px-4 py-2 rounded-xl text-xs font-bold ${finState.goalsTab === 'COMPLETADAS' ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">Completadas (${doneGoals.length})</button>
                    </div>
                    <button onclick="openGoalModal()" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold">+ Nueva Meta de Ahorro</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${list.length === 0 ? '<p class="text-xs text-gray-400">No hay metas en esta sección.</p>' : list.map(renderGoalCard).join('')}
                </div>
            </div>
        `;
        return;
    }

    // 6. SUBPANTALLA CATEGORÍAS (3 PESTAÑAS: GASTO, SUSCRIPCIÓN, INGRESO)
    if (finState.subScreen === 'CATEGORIAS') {
        const cats = getCategoriesByType(finState.catTab);
        container.innerHTML = `
            <div class="space-y-6">
                ${navBarHtml}
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex gap-2">
                        <button onclick="setCategoryTab('GASTO')" class="px-4 py-2 rounded-xl text-xs font-bold ${finState.catTab === 'GASTO' ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">💸 Gastos</button>
                        <button onclick="setCategoryTab('SUSCRIPCION')" class="px-4 py-2 rounded-xl text-xs font-bold ${finState.catTab === 'SUSCRIPCION' ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">🔄 Suscripciones</button>
                        <button onclick="setCategoryTab('INGRESO')" class="px-4 py-2 rounded-xl text-xs font-bold ${finState.catTab === 'INGRESO' ? 'bg-accent text-white' : 'bg-[#181824] text-gray-400'}">💰 Ingresos</button>
                    </div>
                    <button onclick="openNewCategoryModal('${finState.catTab}')" class="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold">+ Añadir Categoría</button>
                </div>

                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    ${cats.map(cName => {
                        const isCustom = finState.customCategories.some(x => x.name === cName && x.type === finState.catTab);
                        return `
                            <div class="p-4 rounded-2xl bg-white dark:bg-[#181824] border border-gray-200 dark:border-[#28283C] flex items-center justify-between">
                                <span class="text-xs font-bold">${cName}</span>
                                ${isCustom ? `<button onclick="deleteCustomCategory('${cName}', '${finState.catTab}')" class="text-xs text-gray-500 hover:text-red-400">✕</button>` : '<span class="text-[10px] text-gray-500">Base</span>'}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

function renderAccountCard(a) {
    const defaultAccId = localStorage.getItem('weavax_default_account_id') || '';
    const isDefault = String(a.id) === String(defaultAccId) || String(a.docId) === String(defaultAccId);

    return `
        <div class="p-5 rounded-2xl bg-white dark:bg-[#181824] border ${isDefault ? 'border-accent' : 'border-gray-200 dark:border-[#28283C]'} flex justify-between items-start hover:border-accent transition-all">
            <div>
                <div class="flex items-center space-x-1.5">
                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-accent/15 text-accent">${a.type || 'Banco'} · ${a.currency || 'Bs'}</span>
                    ${isDefault ? '<span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-accent text-white">★ Predeterminada</span>' : ''}
                </div>
                <h5 class="text-base font-extrabold mt-2">${a.name}</h5>
                <p class="text-xl font-black mt-1">${formatMoney(a.balance, a.currency || 'Bs')}</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="setDefaultFinanceAccount('${a.id}')" class="text-sm ${isDefault ? 'text-accent' : 'text-gray-400 hover:text-white'}" title="${isDefault ? 'Quitar como predeterminada' : 'Marcar como cuenta predeterminada'}">
                    ${isDefault ? '★' : '☆'}
                </button>
                <button onclick="openEditAccountModal('${a.docId}')" class="text-xs text-gray-400 hover:text-white" title="Editar cuenta">✎</button>
                <button onclick="deleteDocItem('accounts', '${a.docId}')" class="text-xs text-gray-500 hover:text-red-400" title="Eliminar cuenta">✕</button>
            </div>
        </div>
    `;
}

window.setDefaultFinanceAccount = (accId) => {
    const current = localStorage.getItem('weavax_default_account_id') || '';
    if (String(current) === String(accId)) {
        localStorage.removeItem('weavax_default_account_id');
    } else {
        localStorage.setItem('weavax_default_account_id', String(accId));
    }
    window.renderFinances();
};

function renderBudgetCard(b) {
    const dynamicSpent = getMonthlySpentForCategory(b.category);
    const spent = Math.max(Number(b.spentAmount || 0), dynamicSpent);
    const totalLimit = Number(b.limitAmount || 1) + (b.accumulateSurplus ? Number(b.accumulatedSurplusAmount || 0) : 0);
    const pct = Math.min(100, Math.round((spent / totalLimit) * 100));
    const barColor = spent > totalLimit ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500';

    return `
        <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-2">
            <div class="flex justify-between items-center text-xs font-bold">
                <div>
                    <span>${b.category}</span>
                    <span class="ml-1.5 text-[10px] px-2 py-0.5 rounded bg-[#181824] text-gray-400">${b.periodType || 'Mensual'}</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span>${formatMoney(spent, b.currency || 'Bs')} / ${formatMoney(totalLimit, b.currency || 'Bs')} (${pct}%)</span>
                    <button onclick="openBudgetModal('${b.docId}')" class="text-gray-400 hover:text-white">✎</button>
                    <button onclick="deleteDocItem('budgets', '${b.docId}')" class="text-gray-500 hover:text-red-400">✕</button>
                </div>
            </div>
            <div class="w-full h-2 bg-[#181824] rounded-full overflow-hidden">
                <div class="h-full ${barColor} transition-all" style="width:${pct}%"></div>
            </div>
        </div>
    `;
}

function renderGoalCard(g) {
    const tar = Number(g.targetAmount || 1);
    const cur = Number(g.currentAmount || 0);
    const pct = Math.min(100, Math.round((cur / tar) * 100));
    return `
        <div class="p-4 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] space-y-2">
            <div class="flex justify-between items-center text-xs font-bold">
                <div>
                    <span>${g.name}</span>
                    <span class="ml-1.5 text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent">${g.goalType === 'REPETIDA' ? `🔄 ${g.recurrencePeriod || 'Mensual'}` : '🎯 Largo Plazo'}</span>
                </div>
                <div class="flex items-center space-x-1.5">
                    <button onclick="openGoalContributionModal('${g.docId}', true)" class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold">+ Abonar</button>
                    <button onclick="openGoalContributionModal('${g.docId}', false)" class="px-2 py-1 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold">- Retirar</button>
                    <button onclick="deleteDocItem('goals', '${g.docId}')" class="text-gray-500 hover:text-red-400 ml-1">✕</button>
                </div>
            </div>
            <div class="flex justify-between text-[11px] text-gray-400">
                <span>Progreso: ${formatMoney(cur, g.currency || 'Bs')} de ${formatMoney(tar, g.currency || 'Bs')}</span>
                <span class="font-bold text-white">${pct}%</span>
            </div>
            <div class="w-full h-2 bg-[#181824] rounded-full overflow-hidden">
                <div class="h-full bg-accent transition-all" style="width:${pct}%"></div>
            </div>
        </div>
    `;
}

function renderTransactionRow(tx) {
    const isTransfer = tx.type === 'transferencia';
    const isIncome = tx.type === 'ingreso' || tx.type === 'income' || (!isTransfer && Number(tx.amount) > 0);
    const absAmt = Math.abs(Number(tx.amount || 0));
    const dateStr = tx.date ? (isNaN(tx.date) ? tx.date : new Date(Number(tx.date)).toLocaleDateString('es-BO')) : '';

    const badgeColor = isTransfer ? 'text-blue-400' : isIncome ? 'text-emerald-400' : 'text-red-400';
    const sign = isTransfer ? '⇄ ' : isIncome ? '+' : '-';

    return `
        <div class="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#0A0A0F] border border-gray-200 dark:border-[#28283C] hover:border-accent/40 transition-all">
            <div class="flex items-center space-x-3">
                <div class="w-9 h-9 rounded-xl bg-[#181824] border border-[#28283C] flex items-center justify-center text-sm">
                    ${isTransfer ? '⇄' : isIncome ? '💰' : '💸'}
                </div>
                <div>
                    <p class="text-xs font-extrabold">${tx.title}</p>
                    <p class="text-[10px] text-gray-400">
                        ${tx.category || 'General'} · ${tx.accountName || 'Cuenta'} ${isTransfer && tx.toAccountName ? `→ ${tx.toAccountName}` : ''} · ${dateStr}
                    </p>
                </div>
            </div>
            <div class="flex items-center space-x-2.5">
                <span class="text-xs font-black ${badgeColor}">
                    ${sign}${formatMoney(absAmt, tx.currency || 'Bs')}
                </span>
                ${!isTransfer ? `<button onclick="openEditTxModal('${tx.docId}')" class="text-xs text-gray-400 hover:text-white" title="Editar">✎</button>` : ''}
                <button onclick="deleteTxWithReversal('${tx.docId}')" class="text-xs text-gray-500 hover:text-red-400" title="Eliminar y revertir saldo">✕</button>
            </div>
        </div>
    `;
}

// Navegación interna de Finanzas
window.setFinanceSubScreen = (sub) => { finState.subScreen = sub; window.renderFinances(); };
window.setTxFilter = (f) => { finState.txFilterType = f; window.renderFinances(); };
window.setGoalsSubTab = (t) => { finState.goalsTab = t; window.renderFinances(); };
window.setCategoryTab = (t) => { finState.catTab = t; window.renderFinances(); };

window.deleteCustomCategory = (name, type) => {
    finState.customCategories = finState.customCategories.filter(c => !(c.name === name && c.type === type));
    saveCustomCategories();
    window.renderFinances();
};
