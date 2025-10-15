class Dispatcher {

    constructor(){
        this.subscribers = [];
    }

    register(store) { 
        this.subscribers.push(store);
    }

    process(action){
        for (let store of this.subscribers){
            store.handleAction(action)
        }
    }

};

export default new Dispatcher();