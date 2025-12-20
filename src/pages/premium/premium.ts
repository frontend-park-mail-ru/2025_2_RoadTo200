import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

interface Feature {
    title: string;
    description: string;
    icon: string;
}

interface Plan {
    id: 'week' | 'month' | 'quarter';
    label: string;
    price: number;
    amount: number;
    isActive?: boolean;
}

const TEMPLATE_PATH = '/src/pages/premium/premium.hbs';
const ICON_BASE = '/src/assets/premium/';

export class PremiumPage {
    parent: HTMLElement | null = null;
    private plans: Plan[] = [];
    private isActive = false;

    async render(): Promise<void> {
        if (!this.parent) return;

        this.plans = [
            { id: 'week', label: 'Неделя', price: 300, amount: 300 },
            { id: 'month', label: 'Месяц', price: 600, amount: 600, isActive: true },
            { id: 'quarter', label: '3 Месяца', price: 1000, amount: 1000 },
        ];

        const features: Feature[] = [
            
            {
                title: 'Вы видите тех кому вы понравились',
                description: 'Не сковывайте себя в выборе',
                icon: `${ICON_BASE}heart.svg`,
            },
            {
                title: 'Суперлайк',
                description: 'Вас точно заметят',
                icon: `${ICON_BASE}star.svg`,
            },
        ];

        try {
            const response = await fetch(TEMPLATE_PATH);
            const templateString = await response.text();
            const template = Handlebars.compile(templateString);

            this.parent.innerHTML = template({ plans: this.plans, features });
            this.attachEvents();
        } catch (error) {
            this.parent.innerHTML =
                '<div class="page">Не удалось загрузить Premium</div>';
        }
    }

    setActivePlan(planId: Plan['id']): void {
        this.plans = this.plans.map((plan) => ({
            ...plan,
            isActive: plan.id === planId,
        }));

        const buttons = this.parent?.querySelectorAll('[data-plan]');
        buttons?.forEach((btn) => {
            const element = btn as HTMLButtonElement;
            const isActive = element.dataset.plan === planId;
            element.classList.toggle('premium-page__plan--active', isActive);
        });
    }

    getActivePlan(): Plan {
        return this.plans.find((p) => p.isActive) || this.plans[0];
    }

    setLoading(isLoading: boolean): void {
        const submit = this.parent?.querySelector(
            '#premiumSubmit'
        ) as HTMLButtonElement | null;
        if (submit) {
            submit.disabled = isLoading;
        }
    }

    showError(message: string): void {
        const el = this.parent?.querySelector(
            '#premiumError'
        ) as HTMLElement | null;
        if (el) {
            el.textContent = message;
            el.style.display = message ? 'block' : 'none';
        }
    }

    showStatus(message: string): void {
        const el = this.parent?.querySelector(
            '#premiumStatus'
        ) as HTMLElement | null;
        if (el) {
            el.textContent = message;
            el.style.display = message ? 'block' : 'none';
        }
    }

    toggleCtaBlock(show: boolean): void {
        const cta = this.parent?.querySelector(
            '.premium-page__cta-block'
        ) as HTMLElement | null;
        if (cta) {
            cta.style.display = show ? 'flex' : 'none';
        }
    }

    setPremiumActive(active: boolean): void {
        this.isActive = active;
        this.toggleCtaBlock(!active);
    }

    private attachEvents(): void {
        if (!this.parent) return;

        this.parent.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            const planButton = target.closest(
                '[data-plan]'
            ) as HTMLButtonElement | null;

            if (planButton) {
                const planId = planButton.dataset.plan as Plan['id'];
                const amount = Number(planButton.dataset.amount || 0);
                this.setActivePlan(planId);
                dispatcher.process({
                    type: Actions.SELECT_TARIFF,
                    payload: { planId, amount },
                });
                return;
            }

            if (target.id === 'premiumSubmit') {
                const active = this.getActivePlan();
                dispatcher.process({
                    type: Actions.REQUEST_PREMIUM_PAYMENT,
                    payload: { planId: active.id, amount: active.amount },
                });
            }
        });
    }
}

export const premium = new PremiumPage();
