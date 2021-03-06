var express          = require('express');
var path             = require('path');
var favicon          = require('serve-favicon');
var bodyParser       = require('body-parser');
var methodOverride   = require('method-override');

var log              = require('./libs/log')(module);
var fbDB             = require('./libs/firebaseDatabase');
var chatBot          = require('./libs/chatBot');
var jokes            = require('./libs/joke');
var steam            = require('./libs/steam');
var app              = express();

app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(express.logger('dev'));
app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, "public")));


app.get('/api/weapons', function(req, res) {
   res.send('Weapons now not working..'); 
});

/*app.get('/api/weapons/:id', function(req, res) {
    res.send(weapons.getWeaponById(req.params.id));
});*/

app.get('/api/chatBot', function(req, res) {
    log.debug('Chatbot params: %s', req.query);
    if (req.query.command == 'listen') {
        chatBot.listenChatRoom(req.query.room);
    } else if (req.query.command == 'clearChat') {
        chatBot.clearChat(req.query.room);
    }
    res.send('{success: true}');
})

app.get('/api/joke', function(req, res) {
    log.debug("joke!");
    jokes('EN')
    .then(function(joke) {
        res.send(joke);
    })
})

app.get('/api/steam/:id', function(req, res) {
    //res.send(`Steam id: ${req.params.id}`);
    steam.profile(req.params.id)
    .then(function(profile) {
        res.send(steam.profileToString(profile));
        
    })
    .catch(function(err) {
        res.send(`User ${req.params.id} not found.`);
    })
});

app.get('/api', function(req, res) {
    res.send('API is running');
});

app.use(function(req, res, next) {
    res.status(404);
    log.debug('Not found URL: %s', req.url);
    res.send({error: 'Not found'});
    return;
});

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    log.error('Internal error(%d): %s', res.statusCode, err.message);
    res.send({error: err.message});
    return;
});

chatBot.listenAllRooms();
//chatBot.listenChatRoom("FR");
//chatBot.listenChatRoom("test");

app.listen(process.env.PORT || 8080, function() {
    console.log(`Express server on port ${process.env.PORT || 8080}`);
})