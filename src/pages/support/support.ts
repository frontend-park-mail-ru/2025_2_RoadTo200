import Handlebars from 'handlebars';
import SupportApi, { type Ticket, type TicketCategory } from '@/apiHandler/supportApi';

const TEMPLATE_PATH = '/src/pages/support/support.hbs';
const CLOSED_WIDGET_SIZE = { width: 200, height: 72 } as const;
const OPEN_WIDGET_SIZE = { width: 360, height: 520 } as const;

type SupportTab = 'form' | 'tickets';

interface SupportState {
    isPopupOpen: boolean;
    activeTab: SupportTab;
    isSubmitting: boolean;
    formError: string | null;
    formSuccess: string | null;
    tickets: Ticket[];
    ticketsLoading: boolean;
    ticketsLoaded: boolean;
    ticketsError: string | null;
}

interface SupportFormValues {
    category: TicketCategory | '';
    text: string;
    email: string;
}

const categoryOptions: Array<{ value: TicketCategory; label: string }> = [
    { value: 'Технические проблемы', label: 'Технические проблемы' },
    { value: 'Предложения по улучшению', label: 'Предложения по улучшению' },
    { value: 'Вопросы по использованию', label: 'Вопросы по использованию' },
    { value: 'Проблемы с безопасностью', label: 'Проблемы с безопасностью' },
    { value: 'Оплата и подписки', label: 'Оплата и подписки' },
    { value: 'Сбои приложения', label: 'Сбои приложения' },
];

const categoryLabels = categoryOptions.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

const statusLabels: Record<string, string> = {
    open: 'Открыто',
    work: 'В работе',
    closed: 'Закрыто'
};

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Ошибка: не удалось загрузить шаблон');
    return await response.text();
};

export class Support {
    parent: HTMLElement | null = null;
    private template: Handlebars.TemplateDelegate | null = null;
    private state: SupportState = {
        isPopupOpen: false,
        activeTab: 'form',
        isSubmitting: false,
        formError: null,
        formSuccess: null,
        tickets: [],
        ticketsLoading: false,
        ticketsLoaded: false,
        ticketsError: null
    };
    private formValues: SupportFormValues = {
        category: '',
        text: '',
        email: ''
    };
    private selectedFileName: string | null = null;
    private successTimer: number | null = null;
    private globalListenersAttached = false;
    private readonly isEmbedded: boolean = window.parent !== window;

    constructor(parent: HTMLElement | null) {
        this.parent = parent;
        this.restoreEmail();
        this.registerHelpers();
    }

    async render(): Promise<void> {
        if (!this.parent) return;

        if (!this.template) {
            const templateString = await fetchTemplate(TEMPLATE_PATH);
            this.template = Handlebars.compile(templateString);
        }

        this.renderView();
        this.attachGlobalListeners();
    }

    private registerHelpers(): void {
        if (!Handlebars.helpers.eq) {
            Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
        }
    }

    private restoreEmail(): void {
        try {
            const savedEmail = window.localStorage.getItem('support-email');
            if (savedEmail) {
                this.formValues.email = savedEmail;
            }
        } catch (_) {
            // ignore storage errors
        }
    }

    private saveEmail(email: string): void {
        try {
            window.localStorage.setItem('support-email', email);
        } catch (_) {
            // ignore quota/storage errors
        }
    }

    private renderView(): void {
        if (!this.parent || !this.template) return;

        const context = {
            isPopupOpen: this.state.isPopupOpen,
            activeTab: this.state.activeTab,
            isSubmitting: this.state.isSubmitting,
            formError: this.state.formError,
            formSuccess: this.state.formSuccess,
            categories: categoryOptions,
            formValues: this.formValues,
            selectedFileName: this.selectedFileName,
            tickets: this.mapTickets(this.state.tickets),
            hasTickets: this.state.tickets.length > 0,
            ticketsLoading: this.state.ticketsLoading,
            ticketsError: this.state.ticketsError
        };

        this.parent.innerHTML = this.template(context);
        this.attachEventListeners();
        this.updateFileLabel();
        this.syncWidgetSize();
    }

    private mapTickets(tickets: Ticket[]): Array<{ categoryLabel: string; formattedDate: string; status: Ticket['status']; statusLabel: string; id: string; }> {
        return tickets.map(ticket => ({
            id: ticket.id,
            categoryLabel: categoryLabels[ticket.category] || ticket.category,
            formattedDate: this.formatDate(ticket.created_at),
            status: ticket.status,
            statusLabel: statusLabels[ticket.status] || ticket.status
        }));
    }

    private attachGlobalListeners(): void {
        if (this.globalListenersAttached) return;
        document.addEventListener('keydown', this.handleEscClose);
        this.globalListenersAttached = true;
    }

    private handleEscClose = (event: KeyboardEvent): void => {
        if (event.key === 'Escape' && this.state.isPopupOpen) {
            this.setState({ isPopupOpen: false });
        }
    };

    private attachEventListeners(): void {
        if (!this.parent) return;

        const toggleButton = this.parent.querySelector('#support-widget-toggle');
        toggleButton?.addEventListener('click', () => {
            this.togglePopup(!this.state.isPopupOpen);
        });

        const closeButton = this.parent.querySelector('#support-popup-close');
        closeButton?.addEventListener('click', () => {
            this.togglePopup(false);
        });

        const tabButtons = this.parent.querySelectorAll<HTMLButtonElement>('[data-tab]');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab as SupportTab;
                if (targetTab && targetTab !== this.state.activeTab) {
                    this.setState({ activeTab: targetTab });
                    if (targetTab === 'tickets') {
                        this.loadTickets();
                    }
                }
            });
        });

        const form = this.parent.querySelector<HTMLFormElement>('#support-form');
        form?.addEventListener('submit', this.handleSubmit);

        const categorySelect = this.parent.querySelector<HTMLSelectElement>('#support-topic-select');
        categorySelect?.addEventListener('change', (event) => {
            const value = (event.target as HTMLSelectElement).value as TicketCategory | '';
            this.formValues.category = value;
        });

        const problemField = this.parent.querySelector<HTMLTextAreaElement>('#support-problem');
        problemField?.addEventListener('input', (event) => {
            this.formValues.text = (event.target as HTMLTextAreaElement).value;
        });

        const emailField = this.parent.querySelector<HTMLInputElement>('#support-email');
        emailField?.addEventListener('input', (event) => {
            const email = (event.target as HTMLInputElement).value;
            this.formValues.email = email;
            if (this.validateEmail(email)) {
                this.saveEmail(email);
            }
        });

        const fileInput = this.parent.querySelector<HTMLInputElement>('#support-screenshot');
        fileInput?.addEventListener('change', (event) => {
            const file = (event.target as HTMLInputElement).files?.[0] || null;
            this.selectedFileName = file ? file.name : null;
            this.updateFileLabel();
        });

        const refreshButton = this.parent.querySelector<HTMLButtonElement>('#support-refresh-tickets');
        refreshButton?.addEventListener('click', () => {
            this.loadTickets(true);
        });
    }

    private updateFileLabel(): void {
        if (!this.parent) return;
        const fileNameElement = this.parent.querySelector('#support-file-name');
        if (fileNameElement) {
            fileNameElement.textContent = this.selectedFileName || 'Файл не выбран';
        }
    }

    private togglePopup(open: boolean): void {
        this.setState({ isPopupOpen: open });
        this.syncWidgetSize(open);
        if (open && this.state.activeTab === 'tickets') {
            this.loadTickets();
        }
    }

    private async loadTickets(force = false): Promise<void> {
        if (this.state.ticketsLoading) return;
        if (this.state.ticketsLoaded && !force) return;

        this.setState({ ticketsLoading: true, ticketsError: null });
        try {
            const response = await SupportApi.getMyTickets();
            const baseTickets = response?.tickets ?? [];
            const sorted = [...baseTickets].sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            this.setState({
                tickets: sorted,
                ticketsLoading: false,
                ticketsLoaded: true,
                ticketsError: null
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось загрузить обращения';
            this.setState({ ticketsLoading: false, ticketsError: message });
        }
    }

    private handleSubmit = async (event: Event): Promise<void> => {
        event.preventDefault();

        const validationError = this.validateForm();
        if (validationError) {
            this.setState({ formError: validationError, formSuccess: null });
            return;
        }

        const payload = {
            category: this.formValues.category as TicketCategory,
            text: this.formValues.text.trim(),
            email: this.formValues.email.trim()
        };

        this.setState({ isSubmitting: true, formError: null, formSuccess: null });

        try {
            await SupportApi.createTicket(payload);
            this.saveEmail(payload.email);
            this.formValues = { category: '', text: '', email: payload.email };
            this.selectedFileName = null;
            this.setState({
                isSubmitting: false,
                formSuccess: 'Обращение отправлено. Мы ответим на почту.',
                formError: null
            });
            this.scheduleSuccessReset();
            this.loadTickets(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Не удалось отправить обращение';
            this.setState({ isSubmitting: false, formError: message, formSuccess: null });
        }
    };

    private scheduleSuccessReset(): void {
        if (this.successTimer) {
            window.clearTimeout(this.successTimer);
        }
        this.successTimer = window.setTimeout(() => {
            this.setState({ formSuccess: null });
        }, 4000);
    }

    private validateForm(): string | null {
        if (!this.formValues.category) {
            return 'Выберите тему обращения';
        }
        if (!this.formValues.text || this.formValues.text.trim().length < 10) {
            return 'Опишите проблему подробнее (минимум 10 символов)';
        }
        if (!this.formValues.email || !this.validateEmail(this.formValues.email)) {
            return 'Укажите корректный email для связи';
        }
        return null;
    }

    private validateEmail(email: string): boolean {
        const emailRegex = /^[\w.!#$%&'*+/=?`{|}~-]+@[\w-]+(\.[\w-]+)+$/i;
        return emailRegex.test(email.trim());
    }

    private setState(partial: Partial<SupportState>): void {
        this.state = { ...this.state, ...partial };
        this.renderView();
    }

    private formatDate(dateString: string): string {
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    private syncWidgetSize(forceState?: boolean): void {
        if (!this.isEmbedded) return;
        const isOpen = forceState ?? this.state.isPopupOpen;
        const payload = isOpen ? OPEN_WIDGET_SIZE : CLOSED_WIDGET_SIZE;
        window.parent.postMessage({
            type: 'SUPPORT_WIDGET_RESIZE',
            payload
        }, window.location.origin);
    }
}

export const support = new Support(null);
