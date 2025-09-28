const TEMPLATE_PATH = './src/components/SmallHeart/smallHeart.hbs';

const fetchTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('Ошибка: Не удалось загрузить шаблон маленького сердца');
        }
        return await response.text();
    } catch (error) {
        console.error('Ошибка загрузки шаблона маленького сердца:', error);
        return '<div class="heart-small"></div>';
    }
};

const SmallHeart = {
    render: async () => {
        const templateString = await fetchTemplate(TEMPLATE_PATH);
        const template = Handlebars.compile(templateString);
        return template({});
    }
};

export default SmallHeart;