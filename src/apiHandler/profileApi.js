import serverURL from './serverURL.JS';

const API_URL = `${serverURL}/api`;

class ProfileApi {
    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    async getProfile() {
        
        const response = await fetch(`${this.baseURL}/profile/profile`, { 
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    async updateProfileInfo(profileData) {
        const response = await fetch(`${this.baseURL}/profile/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'updateInfo',
                ...profileData
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    async uploadPhoto(photos) {
        const formData = new FormData();
        formData.append('action', 'uploadPhotos');
        
        const photoArray = Array.isArray(photos) ? photos : [photos];
        photoArray.forEach((photo) => {
            formData.append('photos', photo);
        });
        
        const response = await fetch(`${this.baseURL}/profile/uploadPhotos`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const error = await response.json();
                errorMessage = error.error || errorMessage;
            } catch (e) {
                const text = await response.text();
                errorMessage = text || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    }

    async deletePhoto(photoId) {
        const response = await fetch(`${this.baseURL}/profile/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'deletePhoto',
                photoId
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    async setPrimaryPhoto(photoId) {
        const response = await fetch(`${this.baseURL}/profile/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'setPrimaryPhoto',
                photoId
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    async changePassword(oldPassword, newPassword) {
        const response = await fetch(`${this.baseURL}/profile/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'changePassword',
                oldPassword,
                newPassword
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }

    async deleteAccount() {
        const response = await fetch(`${this.baseURL}/profile/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'deleteAccount'
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json();
    }
}

export default new ProfileApi(API_URL);