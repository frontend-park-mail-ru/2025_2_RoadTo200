class Dispatcher {

    constructor(){
        console.log("created disp")
        this.subscribers = [];
    }

    register(store) { 
        this.subscribers.push(store);
    }

    process(action){
        console.log(this.subscribers)
        for (let store of this.subscribers){
            store.handleAction(action)
        }
    }

};

export const dispatcher = new Dispatcher();