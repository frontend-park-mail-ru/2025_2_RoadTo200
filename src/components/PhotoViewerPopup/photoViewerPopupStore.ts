import { Actions, type Action } from '@/actions';
import { dispatcher, type Store } from '@/Dispatcher';
import photoViewerPopup from './photoViewerPopup';

class PhotoViewerPopupStore implements Store {
    constructor() {
        dispatcher.register(this);
    }

    async handleAction(action: Action): Promise<void> {
        switch (action.type) {
            case Actions.OPEN_PHOTO_VIEWER:
                if (action.payload?.imageUrl) {
                    await photoViewerPopup.open(action.payload.imageUrl);
                }
                break;
            case Actions.CLOSE_PHOTO_VIEWER:
                photoViewerPopup.close();
                break;
            default:
                break;
        }
    }
}

export default new PhotoViewerPopupStore();
