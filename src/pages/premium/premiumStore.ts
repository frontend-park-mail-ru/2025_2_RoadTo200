import { Actions, type Action, type PremiumAction, type PaymentAction } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import { premium } from './premium';
import PaymentsApi from '@/apiHandler/paymentsApi';

type PlanId = 'week' | 'month' | 'quarter';

class PremiumStore implements Store {
    private selectedPlan: { planId: PlanId; amount: number } = {
        planId: 'month',
        amount: 2000,
    };

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.RENDER_PREMIUM:
                await premium.render();
                this.readPaymentStatusFromQuery();
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

    private async createPayment(): Promise<void> {
        try {
            premium.showError('');
            premium.showStatus('Создаём платёж...');
            premium.setLoading(true);

            const returnUrl = `${window.location.origin}/premium`;
            const response = await PaymentsApi.createPremiumPayment({
                planId: this.selectedPlan.planId,
                amount: this.selectedPlan.amount,
                returnUrl,
            });

            if (response.confirmationUrl) {
                window.location.href = response.confirmationUrl;
            } else {
                throw new Error('Не получили ссылку на оплату');
            }
        } catch (error) {
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
        const params = new URLSearchParams(window.location.search);
        const paymentId = params.get('paymentId');
        if (!paymentId) return;

        try {
            premium.showStatus('Проверяем статус платежа...');
            const status = await PaymentsApi.getPaymentStatus(paymentId);

            dispatcher.process({
                type: Actions.PAYMENT_STATUS_UPDATED,
                payload: {
                    status: status.status,
                    message:
                        status.status === 'succeeded'
                            ? 'Оплата прошла успешно'
                            : status.message || 'Статус платежа обновлён',
                    paymentId,
                },
            });
        } catch (_err) {
            dispatcher.process({
                type: Actions.PAYMENT_ERROR,
                payload: { message: 'Не удалось получить статус платежа' },
            });
        }
    }
}

export default new PremiumStore();
