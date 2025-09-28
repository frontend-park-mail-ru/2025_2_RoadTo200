/**
* Вспомогательная функция отправляющая запрос
* @param {string} endpoint Относительный путь.
* @param {Object} options Настройки запроса.
* @returns {Promise<Response>} Ответ сервера.
*/
export async function handleFetch(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
        
    const fetchOptions = {
        ...options,
        credentials: 'include', 
        headers: {
            'Content-Type': 'application/json',
            ...options.headers 
        }
    }; 

    try { 
        const response = await fetch(url, fetchOptions);
        
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
    }
    catch(error) {
        throw error;
    }
}

export default handleFetch;