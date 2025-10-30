class Dispatcher {

    constructor(){
        this.subscribers = [];
    }

    register(store) { 
        
        this.subscribers.push(store);
        console.log(this.subscribers);
    }

    process(action){
        for (let store of this.subscribers){
            store.handleAction(action)
        }
    }

};

export const dispatcher = new Dispatcher();
