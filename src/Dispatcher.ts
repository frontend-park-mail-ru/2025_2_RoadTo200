import { Action } from './actions';

export interface Store {
    handleAction(action: Action): void | Promise<void>;
}

class Dispatcher {
    private subscribers: Store[] = [];

    register(store: Store): void {
        this.subscribers.push(store);
        // console.log(this.subscribers);
    }

    process(action: Action): void {
        // console.log(`Dispatcher: Processing action ${action.type}`);
        for (const store of this.subscribers) {
            store.handleAction(action);
        }
    }
}

export const dispatcher = new Dispatcher();
