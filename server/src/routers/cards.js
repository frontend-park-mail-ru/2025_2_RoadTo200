const router = require('express').Router();

const cardsData = {
    1: {id:1, Name: 'Kirill', Age: "19", Description: 'It uses a template and an input object to generate HTML or other text formats. Handlebars templates look like regular text with embedded Handlebars expressions.', img1: 'https://plus.unsplash.com/premium_photo-1758365571222-568d44cbe933?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', img2: 'https://images.unsplash.com/photo-1758411897725-0bd3f733c66d?q=80&w=776&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    2: {id:2, Name: 'Ilya', Age: "20", Description: 'You can use comments in your handlebars code just as you would in your code. Since there is generally some level of logic, this is a good practice.', img1: 'https://images.unsplash.com/photo-1758513305697-8be64c4817a5?q=80&w=974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    3: {id:3, Name: 'Dima', Age: "20", Description: 'Block expressions allow you to define helpers that will invoke a section of your template with a different context than the current.', img1: 'https://images.unsplash.com/photo-1741732311869-098397c9d19c?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
    4: {id:4, Name: 'Misha', Age: "19", Description: 'Block helpers have more features, such as the ability to create an else section (used, for instance, by the built-in if helper).', img1: 'https://images.unsplash.com/photo-1725653811863-8ca1776e126a?q=80&w=928&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'},
}

// Middleware для применения к конкретным роутам
const applyAuth = (req, res, next) => {
    const {requireAuth} = req.app.locals;
    if (requireAuth) {
        requireAuth(req, res, next);
    } else {
        next();
    }
};

router.route('/swipe').post(applyAuth, (req, res, next) => {
    
    const { card_id, action, timestamp } = req.body;

    if (!card_id || !action) {
        return res.status(400).json({ error: 'card_id или action' });
    }

    // console.log(`Card ID: ${card_id}: Action: ${action}`);

    res.status(200).json({ status: 'ok', message: 'Действие зарегистрировано' });
})

router.route('/feed/:cardId').get(applyAuth, (req, res, next) => {
    const id = req.params.cardId;
    if(id && cardsData[id]) {
        res.json(cardsData[id]);
    } else  {
        res.status(404).send();
    }
})

router.route('/feed/').get(applyAuth, (req, res, next) => {
    res.json(cardsData);
})

module.exports = router;