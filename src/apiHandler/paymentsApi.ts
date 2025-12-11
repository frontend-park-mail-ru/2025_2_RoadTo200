import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api/payments`;

export interface CreatePaymentPayload { planId: string; amount: number; returnUrl: string; description?: string; }
export interface CreatePaymentResponse { confirmationUrl: string; paymentId: string; status: 'pending' | 'succeeded' | 'canceled'; }
export interface PaymentStatusResponse { paymentId: string; status: 'pending' | 'succeeded' | 'canceled'; message?: string; }

class PaymentsApi {
    private baseURL: string;
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    createPremiumPayment(payload: CreatePaymentPayload): Promise<CreatePaymentResponse> {
        return handleFetch<CreatePaymentResponse>(this.baseURL, '/yoomoney', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    getPaymentStatus(paymentId: string): Promise<PaymentStatusResponse> {
        return handleFetch<PaymentStatusResponse>(this.baseURL, `/status/${paymentId}`, {
            method: 'GET',
        });
    }
}

export default new PaymentsApi();
