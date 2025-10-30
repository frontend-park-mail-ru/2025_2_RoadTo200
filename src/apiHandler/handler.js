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
    headers,
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
      
      // Формируем понятное сообщение об ошибке
      let errorMessage = 'Неверный email или пароль';
      if (errorDetails && errorDetails.error) {
        errorMessage = errorDetails.error;
      } else if (response.status === 500) {
        errorMessage = 'Ошибка сервера. Попробуйте позже';
      } else if (response.status === 404) {
        errorMessage = 'Сервис недоступен';
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.details = errorDetails;
      throw error;
    }
    
    return response.json();
  } catch (error) {
    if (error.name === 'TypeError') {
      error.message = 'Ошибка соединения с сервером';
      error.isNetworkError = true;
    }
    throw error;
  }
}

export default handleFetch;