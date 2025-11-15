import handleFetch from './handler';
import supportURL from './supportURL';

const API_URL = `${supportURL}/api`;

export type TicketCategory = 'technical' | 'feature' | 'question' | 'security' | 'billing' | 'device';
export type TicketStatus = 'open' | 'work' | 'closed';

export interface CreateTicketRequest {
    category: TicketCategory;
    text: string;
    email: string;
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
    ticket: Ticket;
}

export interface GetTicketsResponse {
    tickets: Ticket[];
    total: number;
}

export interface GetTicketResponse {
    ticket: Ticket;
}

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
        const options = {
            method: 'POST',
            body: JSON.stringify(ticketData),
        };
        return handleFetch<CreateTicketResponse>(this.baseURL, '/support', options);
    }

    /**
     * GET /support - Получить все обращения текущего пользователя
     * @returns Promise со списком тикетов
     */
    async getMyTickets(): Promise<GetTicketsResponse> {
        return handleFetch<GetTicketsResponse>(this.baseURL, '/support', { method: 'GET' });
    }

    /**
     * GET /support/:ticketId - Получить конкретное обращение
     * @param ticketId ID тикета
     * @returns Promise с данными тикета
     */
    async getTicket(ticketId: string): Promise<GetTicketResponse> {
        return handleFetch<GetTicketResponse>(this.baseURL, `/support/${ticketId}`, { method: 'GET' });
    }
}

export default new SupportApi(API_URL);
