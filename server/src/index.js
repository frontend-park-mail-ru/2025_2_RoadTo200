var cors = require('cors')
const express = require('express');

const app = express();
app.use(cors())


const PORT = 3000;




function onStart(){
    console.log(`Server running on port ${PORT}`);
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const cardsRouter = require('./routers/cards');

app.use('/api', cardsRouter);

app.listen(PORT, onStart);

module.exports = app;