import { Actions } from "../../actions.js";
import { dispatcher } from "../../Dispatcher.js";
import { home } from "./home.js";

class HomeStore {
    selectedActivities = [];

    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action) {
        switch (action.type) {
            case Actions.RENDER_HOME:
                await home.render();
                break;
            default:
                break;
        }
    }

    setSelectedActivities(activities) {
        this.selectedActivities = activities;
    }

    getSelectedActivities() {
        return this.selectedActivities;
    }
}

export default new HomeStore();
