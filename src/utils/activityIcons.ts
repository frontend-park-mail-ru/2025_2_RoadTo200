/**
 * Маппинг активностей к иконкам
 * Используется для отображения активностей пользователя на всех страницах
 */
export interface Activity {
    name: string;
    icon: string;
}

export const ACTIVITY_ICONS: { [key: string]: Activity } = {
    workout: { 
        name: 'Тренировки', 
        icon: '/src/assets/ActivityCircleSVG/fluent_run-20-regular.svg' 
    },
    fun: { 
        name: 'Веселье', 
        icon: '/src/assets/ActivityCircleSVG/smile.svg' 
    },
    party: { 
        name: 'Вечеринки', 
        icon: '/src/assets/ActivityCircleSVG/hugeicons_party.svg' 
    },
    chill: { 
        name: 'Отдых', 
        icon: '/src/assets/ActivityCircleSVG/lucide_tree-palm.svg' 
    },
    love: { 
        name: 'Любовь', 
        icon: '/src/assets/ActivityCircleSVG/bi_arrow-through-heart.svg' 
    },
    relax: { 
        name: 'Релакс', 
        icon: '/src/assets/ActivityCircleSVG/healthicons_sad-outline.svg' 
    },
    yoga: { 
        name: 'Йога', 
        icon: '/src/assets/ActivityCircleSVG/lotus.svg' 
    },
    friendship: { 
        name: 'Дружба', 
        icon: '/src/assets/ActivityCircleSVG/material-symbols-light_handshake-outline.svg' 
    },
    culture: { 
        name: 'Культура', 
        icon: '/src/assets/ActivityCircleSVG/streamline-plump_theater-mask.svg' 
    },
    cinema: { 
        name: 'Кино', 
        icon: '/src/assets/ActivityCircleSVG/ph_film-reel-light.svg' 
    }
};

/**
 * Получить список активных активностей из данных пользователя
 * @param data - Объект с полями активностей (workout, fun, party, и т.д.)
 * @returns Массив активностей с их названиями и иконками
 */
export function getActivitiesFromData(data: any): Activity[] {
    const activities: Activity[] = [];
    
    Object.keys(ACTIVITY_ICONS).forEach(key => {
        if (data[key] === true) {
            activities.push(ACTIVITY_ICONS[key]);
        }
    });
    
    return activities;
}
