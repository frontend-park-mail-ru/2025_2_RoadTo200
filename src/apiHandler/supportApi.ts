import handleFetch from './handler';
import supportURL from './supportURL';

const API_URL = `${supportURL}/api`;

export type TicketCategory = string;
export type TicketStatus = 'open' | 'work' | 'closed';

export interface CreateTicketRequest {
    category: TicketCategory;
    text: string;
    email: string;
    screenshot?: File;
}

export interface Ticket {
    id: string;
    category: TicketCategory;
    status: TicketStatus;
    created_at: string;
    text?: string;
    email?: string;
}

export interface CreateTicketResponse {
    id: string;
    category: TicketCategory;
    status: TicketStatus;
    created_at: string;
    text: string;
    email: string;
}

export interface GetTicketsResponse {
    tickets: Ticket[];
    total: number;
}

export type GetTicketResponse = Ticket;

class SupportApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * POST /support - Создать обращение в поддержку
     * @param ticketData Данные обращения
     * @returns Promise с созданным тикетом
     */
    async createTicket(ticketData: CreateTicketRequest): Promise<CreateTicketResponse> {
        const formData = new FormData();
        formData.append('category', ticketData.category);
        formData.append('text', ticketData.text);
        formData.append('email', ticketData.email);
        if (ticketData.screenshot) {
            formData.append('screenshot', ticketData.screenshot);
        }

        const shouldUseFormData = typeof ticketData.screenshot !== 'undefined';

        const options = shouldUseFormData ? {
            method: 'POST',
            body: formData,
            isFormData: true
        } : {
            method: 'POST',
            body: JSON.stringify({
                category: ticketData.category,
                text: ticketData.text,
                email: ticketData.email
            })
        };
        return handleFetch<CreateTicketResponse>(this.baseURL, '/report', options);
    }

    /**
     * GET /support - Получить все обращения текущего пользователя
     * @returns Promise со списком тикетов
     */
    async getMyTickets(): Promise<GetTicketsResponse> {
        return handleFetch<GetTicketsResponse>(this.baseURL, '/report', { method: 'GET' });
    }

    /**
     * GET /support/:ticketId - Получить конкретное обращение
     * @param ticketId ID тикета
     * @returns Promise с данными тикета
     */
    async getTicket(ticketId: string): Promise<GetTicketResponse> {
        return handleFetch<GetTicketResponse>(this.baseURL, `/report/${ticketId}`, { method: 'GET' });
    }
}

export default new SupportApi(API_URL);
