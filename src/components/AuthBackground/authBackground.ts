import {
    CircleActivity,
    getAvailableSvgIcons,
} from '../CircleActivity/circleActivity';

export class AuthBackground {
    private container: HTMLElement | null;
    private circles: CircleActivity[];
    private svgIcons: string[];

    constructor(container: HTMLElement | null = null) {
        this.container = container;
        this.circles = [];
        this.svgIcons = getAvailableSvgIcons();
    }

    setContainer(container: HTMLElement): void {
        if (!container) {
            throw new Error('AuthBackground requires a container element');
        }
        this.container = container;
    }

    render(): void {
        // Если уже отрисован, ничего не делаем
        if (this.circles.length > 0) {
            return;
        }

        if (!this.container) {
            // console.error('AuthBackground: container is not set');
            return;
        }

        const tablet = this.container.querySelector(
            '.auth-background__circle-activity-tablet'
        ) as HTMLElement;
        if (!tablet) {
            // console.error('AuthBackground: .auth-background__circle-activity-tablet not found in container!');
            return;
        }

        tablet.textContent = '';

        
        const rows = 8;
        const cols = 11;
        const circleSpacing = 270;
        const verticalSpacing = 270;
        const circleSize = 250;

        let iconIndex = 0;

        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const circle = new CircleActivity({
                    svgPath: this.svgIcons[iconIndex % this.svgIcons.length],
                    size: circleSize,
                    opacity: 0.4,
                    className: 'auth-background__background-variant',
                });

                const element = circle.render();
                element.style.left = `${col * circleSpacing}px`;
                element.style.top = `${row * verticalSpacing}px`;

                tablet.appendChild(element);
                this.circles.push(circle);
                iconIndex += 1;
            }
        }
    }




    destroy(): void {
        this.circles.forEach((circle) => circle.destroy());
        this.circles = [];

        if (this.container) {
            const tablet = this.container.querySelector(
                '.auth-background__circle-activity-tablet'
            );
            if (tablet) {
                tablet.innerHTML = '';
            }
        }
    }
}

export const authBackground = new AuthBackground();
