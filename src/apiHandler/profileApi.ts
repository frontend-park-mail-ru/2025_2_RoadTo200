import handleFetch from './handler';
import serverURL from './serverURL';

const API_URL = `${serverURL}/api/profile`;

const formatBirthDateForApi = (dateValue: string | Date): string | null => {
    const date =
        dateValue instanceof Date ? dateValue : new Date(dateValue ?? '');

    if (!date || Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString();
};

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
    city?: string;
    is_verified?: boolean;
    is_premium?: boolean;
    super_likes_count?: number;
    premium_until?: string;
    last_active?: string;
    created_at?: string;
    updated_at?: string;
    interests?: Array<{ theme: string; user_id: string }>;
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
    interests?: InterestPayload[];
    is_matched?: boolean;
    is_liked?: boolean;
}

export type ProfileUpdateData = Partial<{
    artist: string;
    bio: string;
    birth_date: string;
    email: string;
    gender: string;
    latitude: number;
    longitude: number;
    name: string;
    phone: string;
    quote: string;
    city: string;
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

    getProfileById(id: string): Promise<ProfileResponse> {
        return handleFetch<ProfileResponse>(this.baseURL, `/${id}`, {
            method: 'GET',
        });
    }

    updateProfileInfo(profileData: ProfileUpdateData): Promise<SuccessResponse> {
        const sanitizedPayload = Object.entries(profileData).reduce(
            (acc, [key, value]) => {
                // Пропускаем только undefined и null
                if (value === undefined || value === null) {
                    return acc;
                }

                if (key === 'birth_date') {
                    const isoBirthDate = formatBirthDateForApi(
                        value as string | Date
                    );

                    if (isoBirthDate) {
                        acc[key] = isoBirthDate;
                    }
                    return acc;
                }

                // Если пустая строка, отправляем пробел
                acc[key] = value === '' ? ' ' : value;
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

    updatePassword(passwordData: {
        old_password: string;
        new_password: string;
        new_password_confirm: string;
    }): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(this.baseURL, '/password', {
            method: 'PUT',
            body: JSON.stringify(passwordData),
        });
    }

    deleteProfile(): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(this.baseURL, '', {
            method: 'DELETE',
        });
    }

    updateInterests(interests: InterestPayload[]): Promise<SuccessResponse> {
        return handleFetch<SuccessResponse>(this.baseURL, '/interest', {
            method: 'PUT',
            body: JSON.stringify(interests),
        });
    }

    uploadPhoto(file: File | File[]): Promise<UserPhoto[]> {
        const formData = new FormData();
        const files = Array.isArray(file) ? file : [file];
        files.forEach((item) => formData.append('photos', item));

        return handleFetch<UserPhoto[]>(this.baseURL, '/photo', {
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
