/**
* Вспомогательная функция отправляющая запрос
* @param {string} endpoint Относительный путь.
* @param {Object} options Настройки запроса.
* @returns {Promise<Response>} Ответ сервера.
*/
export async function handleFetch(baseURL, endpoint, options = {}) {
  const url = `${baseURL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  const fetchOptions = {
    ...options,
    headers: headers,
    credentials: 'include'
  };
  
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    return response.json();
  } catch (error) {
    throw error;
  }
}

export default handleFetch;