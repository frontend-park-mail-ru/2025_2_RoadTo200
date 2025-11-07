import serverURL from './serverURL';

const API_URL = `${serverURL}/api/profile`;

export interface Profile {
    id: string;
    email: string;
    name: string;
    age: number;
    birthDate: string;
    gender: string;
    bio?: string;
    photos: string[];
    interests?: string[];
    location?: {
        latitude: number;
        longitude: number;
    };
    preferences?: {
        minAge: number;
        maxAge: number;
        gender: string;
        distance: number;
    };
}

export interface ProfileResponse {
    profile: Profile;
}

export interface UpdateProfileData {
    name?: string;
    bio?: string;
    birthDate?: string;
    gender?: string;
    interests?: string[];
}

export interface ApiResponse {
    success: boolean;
    message?: string;
}

export interface UploadPhotoResponse extends ApiResponse {
    photos?: string[];
}

class ProfileApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    async getProfile(): Promise<ProfileResponse> {
        const response = await fetch(`${this.baseURL}/profile`, { 
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json() as ProfileResponse;
    }

    async updateProfileInfo(profileData: UpdateProfileData): Promise<ApiResponse> {
        const response = await fetch(`${this.baseURL}/changeProfile`, {
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
        
        return await response.json() as ApiResponse;
    }

    async uploadPhoto(photos: File | File[]): Promise<UploadPhotoResponse> {
        const formData = new FormData();
        formData.append('action', 'uploadPhotos');
        
        const photoArray = Array.isArray(photos) ? photos : [photos];
        photoArray.forEach((photo) => {
            formData.append('photos', photo);
        });
        
        const response = await fetch(`${this.baseURL}/changeProfile`, {
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
        
        return await response.json() as UploadPhotoResponse;
    }

    async deletePhoto(photoId: string | number): Promise<ApiResponse> {
        const response = await fetch(`${this.baseURL}/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'deletePhoto',
                photoId: photoId
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json() as ApiResponse;
    }

    async setPrimaryPhoto(photoId: string | number): Promise<ApiResponse> {
        const response = await fetch(`${this.baseURL}/changeProfile`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                action: 'setPrimaryPhoto',
                photoId: photoId
            })
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }
        
        return await response.json() as ApiResponse;
    }

    async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse> {
        const response = await fetch(`${this.baseURL}/changeProfile`, {
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
        
        return await response.json() as ApiResponse;
    }

    async deleteAccount(): Promise<ApiResponse> {
        const response = await fetch(`${this.baseURL}/changeProfile`, {
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
        
        return await response.json() as ApiResponse;
    }
}

export default new ProfileApi(API_URL);
