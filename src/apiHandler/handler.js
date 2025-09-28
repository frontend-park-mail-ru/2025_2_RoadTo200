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
      let errorDetails = null;
      try {
        errorDetails = await response.json();
      } catch (e) {
        // Игнорируем, если не JSON
      }
      
      const error = new Error(`Request failed with status ${response.status}`);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError') {
      error.isNetworkError = true;
    }
    throw error;
  }
}

export default handleFetch;