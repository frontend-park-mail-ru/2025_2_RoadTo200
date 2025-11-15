import handleFetch from './handler';
import supportURL from './supportURL';

const API_URL = `${supportURL}/api`;

export interface TicketsByCategory {
    technical: number;
    feature: number;
    question: number;
    security: number;
    billing: number;
    device: number;
}

export interface TicketsByStatus {
    open: number;
    work: number;
    closed: number;
}

export interface Statistics {
    total_tickets: number;
    tickets_by_category: TicketsByCategory;
    tickets_by_status: TicketsByStatus;
    average_response_time: string;
}

export interface StatisticsResponse {
    statistics: Statistics;
}

class StatisticsApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    /**
     * GET /statistics - Получить статистику поддержки
     * @returns Promise со статистикой поддержки
     */
    async getStatistics(): Promise<StatisticsResponse> {
        return handleFetch<StatisticsResponse>(this.baseURL, '/statistics', { method: 'GET' });
    }
}

export default new StatisticsApi(API_URL);
