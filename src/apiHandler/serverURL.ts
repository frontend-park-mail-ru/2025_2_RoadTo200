// В dev и preview используем относительные пути (proxy)
// В production на terabithia.online - используем полный URL
const serverURL: string = import.meta.env.PROD 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '' // localhost в preview - используем proxy
        : 'http://terabithia.online:8080') // production сервер
    : ''; // dev - всегда proxy

export default serverURL;
