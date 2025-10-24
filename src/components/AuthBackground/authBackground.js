import { CircleActivity, getAvailableSvgIcons } from '../CircleActivity/circleActivity.js';

export class AuthBackground {
    constructor(container) {
        this.container = container;
        this.animationId = null;
        this.circles = [];
        this.textElements = [];
        this.svgIcons = getAvailableSvgIcons();
    }

    render() {
        // Если уже отрисован, ничего не делаем
        if (this.circles.length > 0) {
            return;
        }

        const tablet = this.container.querySelector('.circle-activity-tablet');
        if (!tablet) return;

        // Получаем текст из содержимого div
        const textContent = tablet.textContent.trim();
        tablet.textContent = ''; 

        // Получаем конфигурацию из CSS переменных
        const computedStyle = getComputedStyle(tablet);
        const rows = parseInt(computedStyle.getPropertyValue('--bg-rows'), 10);
        const cols = parseInt(computedStyle.getPropertyValue('--bg-cols'), 10);
        const circleSpacing = parseInt(computedStyle.getPropertyValue('--bg-circle-spacing'), 10);
        const verticalSpacing = parseInt(computedStyle.getPropertyValue('--bg-vertical-spacing'), 10);
        const circleSize = parseInt(computedStyle.getPropertyValue('--bg-circle-size'), 10);

        let iconIndex = 0;

        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const circle = new CircleActivity({
                    svgPath: this.svgIcons[iconIndex % this.svgIcons.length],
                    size: circleSize,
                    opacity: 0.5,
                    className: 'background-variant',
                });
                
                const element = circle.render();
                element.style.left = `${col * circleSpacing}px`;
                element.style.top = `${row * verticalSpacing}px`;
                
                tablet.appendChild(element);
                this.circles.push(circle);
                iconIndex += 1;
            }
            
            if (row % 2 === 1) {
                this.createTextRow(tablet, row, textContent, verticalSpacing, circleSpacing, cols);
            }
        }

        this.startAnimation(textContent, circleSpacing);
    }

    createTextRow(container, rowIndex, textContent, verticalSpacing, circleSpacing, cols) {
        const textY = rowIndex * verticalSpacing + verticalSpacing / 2 + 50;
        const textRowNumber = Math.floor(rowIndex / 2);
        const isOddTextRow = textRowNumber % 2 === 1;
        
        const textWidth = textContent.length * 23;
        const textSpacing = textWidth + 60;
        const totalWidth = circleSpacing * cols + 1000;
        const numberOfTexts = Math.ceil(totalWidth / textSpacing) + 3;
        
        for (let i = 0; i < numberOfTexts; i += 1) {
            const textElement = document.createElement('div');
            textElement.className = 'background-text';
            textElement.textContent = textContent;
            
            const baseX = i * textSpacing - 200;
            const offset = isOddTextRow ? textSpacing / 2 : 0;
            
            textElement.style.left = `${baseX + offset}px`;
            textElement.style.top = `${textY}px`;
            
            container.appendChild(textElement);
            this.textElements.push(textElement);
        }
    }

    startAnimation(textContent, circleSpacing) {
        const tablet = this.container.querySelector('.circle-activity-tablet');
        if (!tablet) return;

        const computedStyle = getComputedStyle(tablet);
        const circleSpeedNum = parseInt(computedStyle.getPropertyValue('--bg-circle-speed'), 10);
        const textSpeedNum = parseInt(computedStyle.getPropertyValue('--bg-text-speed'), 10);
        
        let circlePosition = 0;
        let textPosition = 0;
        
        const circleResetPoint = circleSpacing * 10;
        const textWidth = textContent.length * 23;
        const textResetPoint = textWidth + 60;

        const animate = () => {
            circlePosition += circleSpeedNum;
            if (circlePosition >= circleResetPoint) {
                circlePosition -= circleResetPoint;
            }

            textPosition += textSpeedNum;
            if (textPosition >= textResetPoint) {
                textPosition -= textResetPoint;
            }

            this.circles.forEach((circle) => {
                const element = circle.getElement();
                if (element) {
                    element.style.transform = `translate3d(${circlePosition - 2500}px,-500px, 0)`;
                }
            });

            this.textElements.forEach((textEl) => {
                const element = textEl;
                element.style.transform = `translate3d(${textPosition - 2500}px, -500px, 0)`;
            });
            
            this.animationId = requestAnimationFrame(animate);
        };

        animate();
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        this.circles.forEach((circle) => circle.destroy());
        this.circles = [];

        this.textElements.forEach((textEl) => {
            if (textEl && textEl.parentNode) {
                textEl.parentNode.removeChild(textEl);
            }
        });
        this.textElements = [];

        const tablet = this.container.querySelector('.circle-activity-tablet');
        if (tablet) {
            tablet.innerHTML = '';
        }
    }
}
