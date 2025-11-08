export const Actions = {
    // login
    RENDER_LOGIN: "RENDER_LOGIN",
    REQUEST_LOGIN: "REQUEST_LOGIN",
    LOGIN_ERROR: "LOGIN_ERROR",

    // register
    REQUEST_REGISTER: "REQUEST_REGISTER",
    RENDER_REGISTER: "RENDER_REGISTER",
    REGISTER_ERROR: "REGISTER_ERROR",

    // main
    RENDER_MAIN: "RENDER_MAIN",
    GET_CARDS: "GET_CARDS",
    SEND_CARD_ACTION: "SEND_CARD_ACTION",
    
    // home
    RENDER_HOME: "RENDER_HOME",
    
    // header
    RENDER_HEADER: "RENDER_HEADER",

    // auth
    AUTH_STATE_UPDATED: "AUTH_STATE_UPDATED",
    REQUEST_LOGOUT: "REQUEST_LOGOUT",

    // menu
    RENDER_MENU: "RENDER_MENU",
    
    // navigation
    NAVIGATE_TO: "NAVIGATE_TO",
    LOAD_ROUTE: "LOAD_ROUTE",

    // cards
    RENDER_CARDS: "RENDER_CARDS",
    
    // matches
    RENDER_MATCHES: "RENDER_MATCHES",
    RENDER_MATCH_PROFILE: "RENDER_MATCH_PROFILE",
    MATCH_CARD_CLICK: "MATCH_CARD_CLICK",
    
    // chats
    RENDER_CHATS: "RENDER_CHATS",
    
    // my profile
    RENDER_MYCARD: "RENDER_MYCARD",
    UPDATE_PROFILE_FIELD: "UPDATE_PROFILE_FIELD",
    DELETE_PHOTO: "DELETE_PHOTO",
    ADD_PHOTO: "ADD_PHOTO",
    UPDATE_ACTIVITY: "UPDATE_ACTIVITY",
    ADD_INTEREST: "ADD_INTEREST",
    DELETE_INTEREST: "DELETE_INTEREST",
    
    // settings
    RENDER_SETTINGS: "RENDER_SETTINGS",
    RENDER_SETTINGS_MENU: "RENDER_SETTINGS_MENU",
    SWITCH_SETTINGS_TAB: "SWITCH_SETTINGS_TAB",
    UPDATE_PROFILE_SETTINGS: "UPDATE_PROFILE_SETTINGS",
    UPDATE_FILTER_SETTINGS: "UPDATE_FILTER_SETTINGS",
    CHANGE_PASSWORD: "CHANGE_PASSWORD",
    DELETE_ACCOUNT: "DELETE_ACCOUNT",
    SETTINGS_ERROR: "SETTINGS_ERROR",
    SETTINGS_RENDER_CONTENT: "SETTINGS_RENDER_CONTENT",
    SETTINGS_CLEAR_ERRORS: "SETTINGS_CLEAR_ERRORS",
    
    // profile menu
    RENDER_PROFILE_MENU: "RENDER_PROFILE_MENU",
    TOGGLE_PROFILE_MENU: "TOGGLE_PROFILE_MENU",
    
    // auth background
    RENDER_AUTH_BACKGROUND: "RENDER_AUTH_BACKGROUND",
    HIDE_AUTH_BACKGROUND: "HIDE_AUTH_BACKGROUND",
    
    // offline banner
    RENDER_OFFLINE_BANNER: "RENDER_OFFLINE_BANNER",
    CONNECTIVITY_CHANGED: "CONNECTIVITY_CHANGED",
    
    // profile setup popup
    SHOW_PROFILE_SETUP_POPUP: "SHOW_PROFILE_SETUP_POPUP",
    HIDE_PROFILE_SETUP_POPUP: "HIDE_PROFILE_SETUP_POPUP",
} as const;

export type ActionType = typeof Actions[keyof typeof Actions];

// Base action interface
export interface Action<T = unknown> {
    type: ActionType;
    payload?: T;
}

// Specific action payload types
export interface LoginPayload {
    email: string;
    password: string;
}

export interface ErrorPayload {
    message: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    passwordConfirm: string;
}

export interface NavigatePayload {
    path: string;
}

export interface LoadRoutePayload {
    path: string;
}

export interface MenuPayload {
    route: string;
}

export interface MatchProfilePayload {
    matchId: string;
    route?: string;
}

export interface UpdateProfileFieldPayload {
    field: string;
    value: string | number;
}

export interface PhotoPayload {
    photoIndex: number;
    file?: File;
}

export interface InterestPayload {
    interest: string;
}

export interface SettingsTabPayload {
    tab: string;
}

export interface ProfileSettingsPayload {
    [key: string]: string | number | boolean;
}

export interface FilterSettingsPayload {
    minAge?: number;
    maxAge?: number;
    gender?: string;
    distance?: number;
}

export interface ChangePasswordPayload {
    oldPassword: string;
    newPassword: string;
}

export interface ConnectivityPayload {
    isOnline: boolean;
}

export interface UpdateActivityPayload {
    [key: string]: boolean;
}

// Typed action creators
export type LoginAction = Action<LoginPayload>;
export type ErrorAction = Action<ErrorPayload>;
export type RegisterAction = Action<RegisterPayload>;
export type NavigateAction = Action<NavigatePayload>;
export type LoadRouteAction = Action<LoadRoutePayload>;
export type MenuAction = Action<MenuPayload>;
export type MatchProfileAction = Action<MatchProfilePayload>;
export type UpdateProfileFieldAction = Action<UpdateProfileFieldPayload>;
export type PhotoAction = Action<PhotoPayload>;
export type InterestAction = Action<InterestPayload>;
export type UpdateActivityAction = Action<UpdateActivityPayload>;
export type SettingsTabAction = Action<SettingsTabPayload>;
export type ProfileSettingsAction = Action<ProfileSettingsPayload>;
export type FilterSettingsAction = Action<FilterSettingsPayload>;
export type ChangePasswordAction = Action<ChangePasswordPayload>;
export type ConnectivityAction = Action<ConnectivityPayload>;
