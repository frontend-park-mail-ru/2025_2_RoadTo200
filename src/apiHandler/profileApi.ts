import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api/profile`;

export interface ProfileUser {
    id: string;
    email: string;
    name: string;
    bio?: string;
    quote?: string;
    birth_date?: string;
    gender?: string;
    artist?: string;
    phone?: string;
    [key: string]: unknown;
}

export interface UserPhoto {
    id: string;
    photo_url: string;
    is_approved: boolean;
    display_order: number;
    is_primary?: boolean;
}

export interface ProfilePreferences {
    age_min?: number;
    age_max?: number;
    max_distance?: number;
    global_search?: boolean;
    show_gender?: string;
}

export interface ProfileResponse {
    user: ProfileUser;
    photos: UserPhoto[];
    preferences?: ProfilePreferences | null;
}

export type ProfileUpdateData = Partial<{
    artist: string;
    bio: string;
    birth_date: string;
    gender: string;
    latitude: number;
    longitude: number;
    name: string;
    phone: string;
    quote: string;
}>;

export type PreferencesUpdateData = ProfilePreferences;

export interface SuccessResponse {
    message?: string;
}

type InterestPayload = {
    theme: string;
};

class ProfileApi {
    private baseURL: string;

    constructor(baseURL = API_URL) {
        this.baseURL = baseURL;
    }

    getProfile(): Promise<ProfileResponse> {
        return handleFetch<ProfileResponse>(this.baseURL, '', {
            method: 'GET',
        });
    }

    updateProfileInfo(profileData: ProfileUpdateData): Promise<SuccessResponse> {
        const sanitizedPayload = Object.entries(profileData).reduce(
            (acc, [key, value]) => {
                if (value === undefined || value === null || value === '') {
                    return acc;
                }

                if (key === 'birth_date' && typeof value === 'string') {
                    acc[key] = value.split('T')[0];
                    return acc;
                }

                acc[key] = value;
                return acc;
            },
            {} as Record<string, unknown>
        );

        return handleFetch<SuccessResponse>(this.baseURL, '/info', {
            method: 'PUT',
            body: JSON.stringify(sanitizedPayload),
        });
    }

    updatePreferences(
        preferences: PreferencesUpdateData
    ): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(this.baseURL, '/preferences', {
            method: 'PUT',
            body: JSON.stringify(preferences),
        });
    }

    updateInterests(interests: InterestPayload[]): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(this.baseURL, '/interests', {
            method: 'PUT',
            body: JSON.stringify(interests),
        });
    }

    uploadPhoto(file: File | File[]): Promise<UserPhoto> {
        const formData = new FormData();
        const files = Array.isArray(file) ? file : [file];
        files.forEach((item) => formData.append('photos', item));

        return handleFetch<UserPhoto>(this.baseURL, '/photo', {
            method: 'POST',
            body: formData,
            isFormData: true,
        });
    }

    setPrimaryPhoto(photoId: string): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(
            this.baseURL,
            `/photo/${photoId}`,
            {
                method: 'PUT',
            }
        );
    }

    deletePhoto(photoId: string): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(
            this.baseURL,
            `/photo/${photoId}`,
            {
                method: 'DELETE',
            }
        );
    }
}

export default new ProfileApi();
