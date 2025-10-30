const router = require('express').Router();

// Hardcoded matches data with expiration times
const matchesData = {
    1: {
        id: 1,
        name: 'Kirill',
        age: 19,
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop',
        expiresAt: new Date(Date.now() + 21 * 60 * 60 * 1000 + 48 * 60 * 1000).toISOString(), // 21:48
        isNew: true
    },
    2: {
        id: 2,
        name: 'Ilya',
        age: 20,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
        expiresAt: new Date(Date.now() + 17 * 60 * 60 * 1000 + 34 * 60 * 1000).toISOString(), // 17:34
        isNew: false
    },
    3: {
        id: 3,
        name: 'Anna',
        age: 22,
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // expired
        isNew: false
    },
    4: {
        id: 4,
        name: 'Maria',
        age: 21,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000 + 23 * 60 * 1000).toISOString(), // 5:23
        isNew: false
    },
    5: {
        id: 5,
        name: 'Dima',
        age: 23,
        image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // 12:15
        isNew: false
    },
    6: {
        id: 6,
        name: 'Elena',
        age: 24,
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(), // 2:45
        isNew: true
    }
};

// Middleware для применения к конкретным роутам
const applyAuth = (req, res, next) => {
    const {requireAuth} = req.app.locals;
    if (requireAuth) {
        requireAuth(req, res, next);
    } else {
        next();
    }
};

// GET /matches - Get all matches for the current user
router.route('/').get(applyAuth, (req, res, next) => {
    res.json(matchesData);
});

// GET /matches/:matchId - Get a specific match by ID
router.route('/:matchId').get(applyAuth, (req, res, next) => {
    const id = parseInt(req.params.matchId);
    if (id && matchesData[id]) {
        res.json(matchesData[id]);
    } else {
        res.status(404).json({ error: 'Match not found' });
    }
});

module.exports = router;
