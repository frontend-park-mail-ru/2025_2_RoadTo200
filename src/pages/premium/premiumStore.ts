import {
    Actions,
    type Action,
    type PremiumAction,
    type PaymentAction,
} from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { premium } from './premium';
import PaymentsApi from '@/apiHandler/paymentsApi';
import ProfileApi from '@/apiHandler/profileApi';

type PlanId = 'week' | 'month' | 'quarter';

class PremiumStore implements Store {
    private selectedPlan: { planId: PlanId; amount: number } = {
        planId: 'month',
        amount: 2000,
    };
    private hasActivePremium = false;

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_PREMIUM:
                await premium.render();
                await this.fetchPremiumStatus();
                await this.readPaymentStatusFromQuery();
                break;

            case Actions.SELECT_TARIFF:
                this.selectedPlan = (action as PremiumAction).payload!;
                premium.setActivePlan(this.selectedPlan.planId);
                break;

            case Actions.REQUEST_PREMIUM_PAYMENT:
                await this.createPayment();
                break;

            case Actions.PAYMENT_STATUS_UPDATED:
                premium.showStatus(
                    (action as PaymentAction).payload?.message || ''
                );
                break;

            case Actions.PAYMENT_ERROR:
                premium.showError(
                    (action as PaymentAction).payload?.message ||
                        'Ошибка оплаты'
                );
                premium.setLoading(false);
                break;

            default:
                break;
        }
    }

    private async fetchPremiumStatus(): Promise<void> {
        try {
            const profile = await ProfileApi.getProfile();
            const isPremium = Boolean(profile.user?.is_premium);
            this.hasActivePremium = isPremium;

            if (isPremium) {
                premium.showError('');
                premium.showStatus('У вас уже активный Premium');
                this.toggleSubmitDisabled(true);
            } else {
                this.hasActivePremium = false;
                premium.showStatus('');
                this.toggleSubmitDisabled(false);
            }
        } catch (error) {
            // Не блокируем покупку, если статус не удалось получить
            this.toggleSubmitDisabled(false);
            this.hasActivePremium = false;
        }
    }

    private toggleSubmitDisabled(disabled: boolean): void {
        const submit = document.getElementById(
            'premiumSubmit'
        ) as HTMLButtonElement | null;
        if (submit) {
            submit.disabled = disabled;
        }
    }

    private async createPayment(): Promise<void> {
        try {
            premium.showError('');
            premium.showStatus('Создаём платёж...');
            premium.setLoading(true);

            if (this.hasActivePremium) {
                premium.showStatus('У вас уже активный Premium');
                this.toggleSubmitDisabled(true);
                return;
            }

            const response = await PaymentsApi.createPremiumPayment({
                planId: this.selectedPlan.planId,
                amount: this.selectedPlan.amount,
            });

            const paymentUrl =
                response.payment_url ||
                (response as unknown as { paymentUrl?: string }).paymentUrl;

            if (paymentUrl) {
                window.location.href = paymentUrl;
            } else {
                throw new Error('Не получили ссылку на оплату');
            }
        } catch (error) {
            const err = error as { status?: number; message?: string };
            if (err.status === 409) {
                dispatcher.process({
                    type: Actions.PAYMENT_ERROR,
                    payload: {
                        message: 'У вас уже есть активная подписка',
                    },
                });
                await this.fetchPremiumStatus();
                return;
            }

            dispatcher.process({
                type: Actions.PAYMENT_ERROR,
                payload: {
                    message:
                        (error as Error)?.message ||
                        'Не удалось создать платёж в YooMoney',
                },
            });
        } finally {
            premium.setLoading(false);
        }
    }

    private async readPaymentStatusFromQuery(): Promise<void> {
        // Поддерживаем старый параметр, но проверяем факт наличия премиума по профилю
        const params = new URLSearchParams(window.location.search);
        if (!params.toString()) {
            return;
        }

        await this.fetchPremiumStatus();
    }
}

export default new PremiumStore();
