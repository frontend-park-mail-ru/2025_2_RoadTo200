import Dispatcher from "../Dispatcher.js";

class AuthStore {
    constructor() {
        this.subscribers = [];
        this.user = null;
        this.error = null;

        Dispatcher.register(this);
    }

    getState() {
        return {
            user: this.user,
            error: this.error
        };
    }

    handleAction(action){
        switch (action.type) {
            case 'LOGIN_SUCCESS':
            case 'REGISTER_SUCCESS':
                this.user = action.payload;
                this.error = null; 
                this.emit();
                break;
            case 'LOGIN_ERROR':
            case 'REGISTER_ERROR':
                this.user = null;  
                this.error = action.payload;
                this.emit();
                break;

            case 'LOGOUT_SUCCESS':
                this.user = null;
                this.error = null;
                this.emit();
                break;
            default:
                break;
        }
    }

    emit(){
        this.subscribers.forEach(cb => cb(this.getState()));
    }

    addSub(view){
        this.subscribers.push(view)
    }

    removeSub(view){
        this.subscribers = this.subscribers.filter(cb => cb !== view);
    }
};

export default new AuthStore();


