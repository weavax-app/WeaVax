import { renderFinanceModule } from './finance/finance-views.js?v=3';
import './finance/finance-modals.js?v=3';

export function renderFinances() {
    const container = document.getElementById('view-finances');
    if (!container) return;
    renderFinanceModule(container);
}

window.renderFinances = renderFinances;
