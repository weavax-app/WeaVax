import { renderFinanceModule } from './finance/finance-views.js';
import './finance/finance-modals.js';

export function renderFinances() {
    const container = document.getElementById('view-finances');
    if (!container) return;
    renderFinanceModule(container);
}

window.renderFinances = renderFinances;
