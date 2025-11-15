import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

// Updated interfaces to match the actual API response structure
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
    in_progress: number;
    closed: number;
}

export interface Ticket {
    id: string;
    category: string;
    text: string;
    email: string;
    status: string;
    created_at: string;
}

export interface StatisticsPayload {
    total_tickets: number;
    tickets_by_category: TicketsByCategory;
    tickets_by_status: TicketsByStatus;
    average_response_time: string;
    all_tickets: Ticket[];  // Added missing field
}

const TEMPLATE_PATH = '/src/pages/statisticsPage/statistics.hbs';

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class Statistics {
    parent: HTMLElement | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(statsData: StatisticsPayload): Promise<void> {
        if (!this.parent) return;

        // Calculate percentages for visualization
        const data = this.calculatePercentages(statsData);

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        
        // Add CSS styles
        this.addStyles();
        
        // Initialize any interactive elements
        this.initializeVisualizations();
        this.initializeTableInteractions();
    }

    private calculatePercentages(rawData: StatisticsPayload): any {
        const data = JSON.parse(JSON.stringify(rawData));
        
        // Process categories
        const categoryAbsolutes = {...data.tickets_by_category};
        const totalCategory = Object.values(categoryAbsolutes).reduce((sum: number, count: number) => sum + count, 0);
        
        data.tickets_by_category = {};
        Object.keys(categoryAbsolutes).forEach(key => {
            const count = categoryAbsolutes[key];
            const percentage = totalCategory > 0 ? Math.round((count / totalCategory) * 100) : 0;
            data.tickets_by_category[key] = {
                absolute: count,
                percentage: percentage
            };
        });

        // Process statuses
        const statusAbsolutes = {...data.tickets_by_status};
        const totalStatus = Object.values(statusAbsolutes).reduce((sum: number, count: number) => sum + count, 0);
        
        data.tickets_by_status = {};
        Object.keys(statusAbsolutes).forEach(key => {
            const count = statusAbsolutes[key];
            const percentage = totalStatus > 0 ? Math.round((count / totalStatus) * 100) : 0;
            data.tickets_by_status[key] = {
                absolute: count,
                percentage: percentage
            };
        });

        return data;
    }

    private addStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
          
        `;
        document.head.appendChild(style);
    }

    private initializeVisualizations(): void {
        setTimeout(() => {
            const fillElements = document.querySelectorAll('.category-fill');
            fillElements.forEach(fill => {
                const computedStyle = getComputedStyle(fill);
                const percentage = computedStyle.getPropertyValue('--percentage');
                (fill as HTMLElement).style.width = `${percentage}%`;
            });
        }, 100);
    }

    private initializeTableInteractions(): void {
        // Add click handlers for text truncation
        document.querySelectorAll('.text-truncated').forEach(element => {
            element.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const fullText = target.closest('.ticket-text')?.getAttribute('data-fulltext');
                if (fullText) {
                    alert(fullText); // You can replace this with a modal or tooltip
                }
            });
        });
    }
}

export const statistics = new Statistics(null);