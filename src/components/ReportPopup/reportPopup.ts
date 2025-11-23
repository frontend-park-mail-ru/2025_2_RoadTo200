import Handlebars from 'handlebars';
import './reportPopup.scss';
import StrikesApi, {
    type StrikeCreateRequest,
    type StrikeType,
} from '@/apiHandler/strikesApi';

const TEMPLATE_PATH = '/src/components/ReportPopup/reportPopup.hbs';

const REASON_OPTIONS: Array<{ label: string; value: StrikeType }> = [
    { label: 'Мошенничество', value: 'fake_profile' },
    { label: 'Неприемлемый контент', value: 'inappropriate_content' },
    { label: 'Оскорбления', value: 'harassment' },
    { label: 'Спам', value: 'spam' },
];

export interface ReportPopupContext {
    targetUserId: string;
    targetName?: string;
    targetAge?: number | string;
}

const fetchTemplate = async (): Promise<HandlebarsTemplateDelegate> => {
    const response = await fetch(TEMPLATE_PATH);
    if (!response.ok) {
        throw new Error('Не удалось загрузить шаблон окна жалобы');
    }
    const templateString = await response.text();
    return Handlebars.compile(templateString);
};

export class ReportPopup {
    private container: HTMLElement | null = null;
    private popupElement: HTMLElement | null = null;
    private templatePromise: Promise<HandlebarsTemplateDelegate> | null = null;
    private context: ReportPopupContext | null = null;
    private isSubmitting = false;

    async show(context: ReportPopupContext): Promise<void> {
        this.context = context;

        if (!this.templatePromise) {
            this.templatePromise = fetchTemplate();
        }

        const template = await this.templatePromise;
        const html = template({
            reasons: REASON_OPTIONS,
            targetLine: this.composeTargetLine(context),
        });

        this.destroy();

        this.container = document.createElement('div');
        this.container.innerHTML = html;
        document.body.appendChild(this.container);

        this.popupElement = this.container.querySelector(
            '.report-popup'
        ) as HTMLElement | null;
        requestAnimationFrame(() => {
            this.popupElement?.classList.add('report-popup--visible');
        });

        document.body.classList.add('report-popup-open');
        document.addEventListener('keydown', this.handleKeydown);

        this.attachEventListeners();
    }

    private composeTargetLine(context: ReportPopupContext): string {
        const parts: string[] = [];
        if (context.targetName) {
            parts.push(context.targetName);
        }
        if (context.targetAge) {
            parts.push(`${context.targetAge}`);
        }
        return parts.length ? parts.join(', ') : 'Пользователь';
    }

    private attachEventListeners(): void {
        if (!this.container) return;
        const closeElements = this.container.querySelectorAll(
            '[data-report-close]'
        );
        closeElements.forEach((element) => {
            element.addEventListener('click', () => this.hide());
        });

        const form = this.container.querySelector(
            '#reportPopupForm'
        ) as HTMLFormElement | null;
        form?.addEventListener('submit', (event) => this.handleSubmit(event));
    }

    private async handleSubmit(event: Event): Promise<void> {
        event.preventDefault();
        if (!this.context || this.isSubmitting) return;

        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const reasonValue = (formData.get('reportReason') as StrikeType) ||
            REASON_OPTIONS[0].value;
        const comment = (formData.get('reportComment') as string)?.trim() || '';
        const submitButton = form.querySelector(
            '.report-popup__submit'
        ) as HTMLButtonElement | null;

        this.toggleLoadingState(submitButton, true);
        this.clearMessages();
        this.isSubmitting = true;

        const reasonLabel =
            REASON_OPTIONS.find((reason) => reason.value === reasonValue)
                ?.label || REASON_OPTIONS[0].label;

        const payload: StrikeCreateRequest = {
            target_user_id: this.context.targetUserId,
            type: reasonValue,
            reason: comment || reasonLabel,
        };

        try {
            await StrikesApi.createStrike(payload);
            this.showSuccess('Жалоба отправлена. Спасибо!');
            form.reset();
            setTimeout(() => this.hide(), 900);
        } catch (error: any) {
            const message =
                error?.message || 'Не удалось отправить жалобу. Попробуйте позже.';
            this.showError(message);
        } finally {
            this.toggleLoadingState(submitButton, false);
            this.isSubmitting = false;
        }
    }

    private toggleLoadingState(
        button: HTMLButtonElement | null,
        isLoading: boolean
    ): void {
        if (!button) return;
        button.classList.toggle('is-loading', isLoading);
        button.disabled = isLoading;
    }

    private showError(message: string): void {
        if (!this.container) return;
        const errorElement = this.container.querySelector(
            '#reportPopupError'
        );
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    private showSuccess(message: string): void {
        if (!this.container) return;
        const successElement = this.container.querySelector(
            '#reportPopupSuccess'
        );
        if (successElement) {
            successElement.textContent = message;
        }
    }

    private clearMessages(): void {
        if (!this.container) return;
        const errorElement = this.container.querySelector(
            '#reportPopupError'
        );
        const successElement = this.container.querySelector(
            '#reportPopupSuccess'
        );
        if (errorElement) errorElement.textContent = '';
        if (successElement) successElement.textContent = '';
    }

    private handleKeydown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
            this.hide();
        }
    };

    hide(): void {
        if (this.popupElement) {
            this.popupElement.classList.remove('report-popup--visible');
        }
        this.destroy();
    }

    private destroy(): void {
        document.removeEventListener('keydown', this.handleKeydown);
        document.body.classList.remove('report-popup-open');

        if (this.container) {
            this.container.remove();
            this.container = null;
            this.popupElement = null;
        }
        this.isSubmitting = false;
    }
}

export const reportPopup = new ReportPopup();
