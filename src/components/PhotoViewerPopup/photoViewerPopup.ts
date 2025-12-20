import Handlebars from 'handlebars';
import './photoViewerPopup.scss';

const TEMPLATE_PATH = '/src/components/PhotoViewerPopup/photoViewerPopup.hbs';

const fetchTemplate = async (path: string): Promise<string> => {
    const response = await fetch(path);
    if (!response.ok) throw new Error('Failed to load template');
    return await response.text();
};

class PhotoViewerPopup {
    private popupElement: HTMLElement | null = null;
    private templateCache: HandlebarsTemplateDelegate | null = null;

    async open(imageUrl: string): Promise<void> {
        if (!this.templateCache) {
            const templateString = await fetchTemplate(TEMPLATE_PATH);
            this.templateCache = Handlebars.compile(templateString);
        }

        const html = this.templateCache({ imageUrl });

        if (this.popupElement) {
            this.close();
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        this.popupElement = tempDiv.firstElementChild as HTMLElement;

        document.body.appendChild(this.popupElement);
        document.body.classList.add('photo-viewer-popup-open');

        setTimeout(() => {
            if (this.popupElement) {
                this.popupElement.setAttribute('aria-hidden', 'false');
            }
        }, 10);

        this.addEventListeners();
    }

    close(): void {
        if (!this.popupElement) return;

        this.popupElement.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('photo-viewer-popup-open');

        setTimeout(() => {
            if (this.popupElement && this.popupElement.parentNode) {
                this.popupElement.parentNode.removeChild(this.popupElement);
                this.popupElement = null;
            }
        }, 250);
    }

    private addEventListeners(): void {
        if (!this.popupElement) return;

        const closeElements = this.popupElement.querySelectorAll(
            '[data-photo-viewer-close]'
        );
        closeElements.forEach((el) => {
            el.addEventListener('click', () => this.close());
        });

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

export default new PhotoViewerPopup();
