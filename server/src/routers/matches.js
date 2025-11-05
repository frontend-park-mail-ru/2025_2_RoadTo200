const router = require('express').Router();
const { users } = require('../fake_db/users.js');
const { photos } = require('../fake_db/photos.js');

const getFullImageUrl = (imagePath) => {
    const baseUrl = `http://localhost:8080`;
    return `${baseUrl}${imagePath}`;
};

// Hardcoded matches data with expiration times
const matchesData = {
    1: {
        id: 1,
        name: 'Kirill',
        age: 19,
        image: '/uploads/users/blue2.png',
        expiresAt: new Date(Date.now() + 21 * 60 * 60 * 1000 + 48 * 60 * 1000).toISOString(), // 21:48
        isNew: true
    },
    2: {
        id: 2,
        name: 'Misha',
        age: 22,
        image: '/uploads/users/red.avif',
        expiresAt: new Date(Date.now() + 17 * 60 * 60 * 1000 + 34 * 60 * 1000).toISOString(), // 17:34
        isNew: false
    },
    3: {
        id: 3,
        name: 'Anna',
        age: 25,
        image: '/uploads/users/green.png',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // expired
        isNew: false
    },
    4: {
        id: 4,
        name: 'David',
        age: 30,
        image: '/uploads/users/red2.avif',
        expiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000 + 23 * 60 * 1000).toISOString(), // 5:23
        isNew: false
    },
    5: {
        id: 5,
        name: 'Sophia',
        age: 27,
        image: '/uploads/users/blue.png',
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(), // 12:15
        isNew: false
    }
};

// Helper function to get full user data with photos
function getFullMatchData(matchId) {
    const match = matchesData[matchId];
    if (!match) return null;

    const user = users.find(u => u.id === matchId);
    if (!user) {
        // Return match with full image URL
        return {
            ...match,
            image: getFullImageUrl(match.image)
        };
    }

    const userPhotos = photos
        .filter(p => p.userId === matchId && !p.isDeleted)
        .sort((a, b) => {
            if (a.isPrimary) return -1;
            if (b.isPrimary) return 1;
            return a.order - b.order;
        });

    return {
        ...match,
        image: getFullImageUrl(match.image),
        description: user.description || '',
        quote: user.quote || '',
        musician: user.musician || '',
        interests: [
            { id: 1, name: 'Кино' },
            { id: 2, name: 'Музыка' },
            { id: 3, name: 'Путешествия' }
        ],
        photos: userPhotos.map(p => ({
            id: p.id,
            imageUrl: getFullImageUrl(p.imageUrl),
            isPrimary: p.isPrimary
        }))
    };
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

// GET /matches - Get all matches for the current user
router.route('/').get(applyAuth, (req, res) => {
    // Convert matches to array and add full image URLs
    const matchesArray = Object.values(matchesData).map(match => ({
        ...match,
        image: getFullImageUrl(match.image)
    }));
    
    // Convert back to object format if needed
    const matchesWithFullUrls = {};
    matchesArray.forEach(match => {
        matchesWithFullUrls[match.id] = match;
    });
    
    res.json(matchesWithFullUrls);
});

// GET /matches/:matchId - Get a specific match by ID
router.route('/:matchId').get(applyAuth, (req, res) => {
    const id = parseInt(req.params.matchId, 10);
    const fullMatchData = getFullMatchData(id);
    
    if (fullMatchData) {
        res.json(fullMatchData);
    } else {
        res.status(404).json({ error: 'Match not found' });
    }
});

module.exports = router;
