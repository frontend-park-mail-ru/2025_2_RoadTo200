import Handlebars from 'handlebars';
import { dispatcher } from '@/Dispatcher';
import { Actions } from '@/actions';

const TEMPLATE_PATH = '/src/pages/statisticsPage/statistics.hbs';

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

// Data interface
interface Ticket {
    id: string;
    category: string;
    text: string;
    email: string;
    status: string;
    created_at: string;
}

interface StatisticsData {
    total_tickets: number;
    tickets_by_category: {
        technical: number;
        feature: number;
        question: number;
        security: number;
        billing: number;
        device: number;
    };
    tickets_by_status: {
        open: number;
        work: number;
        closed: number;
    };
    average_response_time: string;
    all_tickets: Ticket[];
}

export class Statistics {
    parent: HTMLElement | null = null;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
    }

    async render(): Promise<void> {
        if (!this.parent) return;

        // Sample data - in real app, this would come from API
        const rawData = {
            total_tickets: 155,
            tickets_by_category: {
                technical: 50,
                feature: 40,
                question: 35,
                security: 15,
                billing: 10,
                device: 5
            },
            tickets_by_status: {
                open: 25,
                work: 15,
                closed: 115
            },
            average_response_time: "2h30m",
            all_tickets: [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "category": "technical",
                    "text": "При попытке загрузить фото приложение вылетает",
                    "email": "user@example.com",
                    "status": "open",
                    "created_at": "2024-01-15T10:30:00Z"
                },
                {
                    "id": "660e8400-e29b-41d4-a716-446655440000",
                    "category": "feature",
                    "text": "Предлагаю добавить видео-звонки",
                    "email": "user2@example.com",
                    "status": "work",
                    "created_at": "2024-01-14T15:20:00Z"
                },
                {
                    "id": "770e8400-e29b-41d4-a716-446655440000",
                    "category": "question",
                    "text": "Как восстановить пароль?",
                    "email": "user3@example.com",
                    "status": "closed",
                    "created_at": "2024-01-13T09:15:00Z"
                },
                {
                    "id": "880e8400-e29b-41d4-a716-446655440000",
                    "category": "security",
                    "text": "Обнаружена уязвимость в системе аутентификации",
                    "email": "user4@example.com",
                    "status": "open",
                    "created_at": "2024-01-12T14:45:00Z"
                }
            ]
        };

        // Calculate percentages for visualization
        const data = this.calculatePercentages(rawData);

        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const pageTemplate = Handlebars.compile(templateString);
        this.parent.innerHTML = pageTemplate(data);
        
        // Add CSS styles
        this.addStyles();
        
        // Initialize any interactive elements
        this.initializeVisualizations();
    }

    private calculatePercentages(rawData: any): any {
        const data = JSON.parse(JSON.stringify(rawData));
        
        const categoryAbsolutes = {...data.tickets_by_category};
        const totalCategory = Object.values(categoryAbsolutes).reduce((sum: number, count: number) => sum + count, 0);
        
        data.tickets_by_category = {};
        Object.keys(categoryAbsolutes).forEach(key => {
            const percentage = Math.round((categoryAbsolutes[key] / totalCategory) * 100);
            data.tickets_by_category[key] = {
                absolute: categoryAbsolutes[key],
                percentage: percentage
            };
        });

        const statusAbsolutes = {...data.tickets_by_status};
        const totalStatus = Object.values(statusAbsolutes).reduce((sum: number, count: number) => sum + count, 0);
        
        data.tickets_by_status = {};
        Object.keys(statusAbsolutes).forEach(key => {
            const percentage = Math.round((statusAbsolutes[key] / totalStatus) * 100);
            data.tickets_by_status[key] = {
                absolute: statusAbsolutes[key],
                percentage: percentage
            };
        });

        return data;
    }

    private addStyles(): void {
        const style = document.createElement('style');
        style.textContent = ``;
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

    destroy(): void {
        // Cleanup if needed
    }
}

export const statistics = new Statistics(null);