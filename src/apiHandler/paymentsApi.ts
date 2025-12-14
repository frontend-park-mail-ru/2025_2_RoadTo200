import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api/payment`;

export interface CreatePaymentPayload {
    planId: string;
    amount: number;
    description?: string;
}

export interface CreatePaymentResponse {
    payment_url: string;
}

class PaymentsApi {
    private baseURL: string;
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    createPremiumPayment(
        payload: CreatePaymentPayload
    ): Promise<CreatePaymentResponse> {
        return handleFetch<CreatePaymentResponse>(this.baseURL, '/create', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }
}

export default new PaymentsApi();
