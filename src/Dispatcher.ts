import { Action } from './actions';

export interface Store {
    handleAction(action: Action): void | Promise<void>;
}

class Dispatcher {
    private subscribers: Store[] = [];

    register(store: Store): void {
        this.subscribers.push(store);
    }

    process(action: Action): void {
        for (const store of this.subscribers) {
            store.handleAction(action);
        }
    }
}

export const dispatcher = new Dispatcher();
