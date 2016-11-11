var firebase        = require('firebase');
var config          = require('./config');
var weapons         = require('./weapons');
var joke            = require('./joke');
var steam           = require('./steam');
var log             = require('./log')(module);
var fs              = require('fs');
//var bashOrg         = require('./steam');

function chatBotSendMsg(msg, room) {
    firebase.database().ref('chat/'+room).push({
        img: config.chatBot.img,
        username: config.chatBot.username,
        text: msg,
        group: 'chatbot',
        uid: 'TrgkhCFTfVWdgOhZVUEAwxKyIo33',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    })
}

var lastMessages = {};

var helloArr = {
    RU: ["Hello!", "Привет.", "Дратути", "Хай", "Тут я", "Кто звал?", "Слушаю", "Ало. Да, да. ChatBot, да"],
    EN: ["Hello!", "Sup?", "What m8?", "Hi", "What's up dog!", "Look at my horse! My horse is amazing!", "Hey"]
}

var help = {
    RU: `Доступные команды:<br>
        <b>!stats</b> - Статистика игрока<br>
        <b>!wp (id)</b> или <b>!weapon (id)</b> - информация об оружии по id (0-818)<br>
        <b>!donate</b> - Ссылка на Patreon и кнопка для показа рекламы<br>
        <b>!steam (steamID)</b> - немного информации о профиле в стим<br>
        <b>!joke</b> или <b>!шутка</b> - случайная шутка`,
    EN: `Available commands:<br>
        <b>!stats</b> or <b>!stats@(nickname),</b> - Player statistic<br>
        <b>!wp (id)</b> or <b>!weapon (id)</b> - get weapon info by id (0-818)<br>
        <b>!donate</b> - Link to Patreon and button that shows video ad.<br>
        <b>!steam (steamID)</b> - Steam info<br>
        <b>!joke</b> - random joke (temporarily only in Russian)`
}

var resetsTimeout = {};

var items = [{
    "type" : "item",
    "skinName": "Name Tag",
    "img": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXX7gNTPcUmqBxiQE3CQOHj05yGCgkjdVdTsL6mKAI416bMIW1Aud7vxIHdkqCsMOmJwGgJvZIlj6fR-4vX_1cVUg"
}];

function listenAllRooms() {
    log.debug('Listeting for all rooms');
    var rooms = "RU,EN,PL,DE,TR,RO,FI,PT,FR";
    
    var roomsArr = rooms.split(',');
    for (var i = 0; i < roomsArr.length; i++) {
        listenChatRoom(roomsArr[i]);
    }
}

function stopListen(rooms) {
    
}

function getLocalizedArr(arr, room) {
    return typeof arr[room] == 'undefined' ? arr.EN : arr[room];
}

function listenChatRoom(room) {
    var chatRef = firebase.database().ref('chat/'+room);
    chatRef.limitToLast(1).on('child_added', function(snapshot) {
        var msg = snapshot.val().text;
        var msgInfo = {
            text: msg,
            uid : snapshot.val().uid,
            username: snapshot.val().username
        }
        log.debug('%s: %s', snapshot.val().username, msg);
        
        if (typeof lastMessages[room] == 'undefined')
            lastMessages[room] = [];
        if (lastMessages[room].length > 15) 
            lastMessages[room] = lastMessages[room].slice(1);
        lastMessages[room].push(msgInfo);
        
        if (/^[@]?(chatbot)/i.test(msg)) {
            var hello = typeof helloArr[room] == 'undefined' ? helloArr.EN : helloArr[room];
            var sayHello = hello[Math.floor(Math.random()*(hello.length))];
            chatBotSendMsg(sayHello, room);
        }
        
        if (/^!(donate|patreon)/i.test(msg)) {
            var textMsg = "<div style=\"padding: 5px;background: #E6461A;color: #fff;border-radius: 10px;text-align: center;text-shadow: 1px 1px RGBA(0, 0, 0, 0.42);border-bottom: 2px solid #953419;margin-bottom: 5px;\"><a href=\"https://www.patreon.com/VLADOS776\" target=\"_blank\" style=\"text-decoration: none;color: #fff;display: block;\">Patreon</a></div><div onclick='if(isAndroid()){client.showVideoAd(\"#\")}' style=\"padding: 5px;background: #63a7ff;color: #fff;border-radius: 10px;text-align: center;text-shadow: 1px 1px RGBA(0, 0, 0, 0.42);border-bottom: 2px solid #186ad7;\">Watch ad</div>";
            chatBotSendMsg(textMsg, room);
        }
        
        if (/^(?:!stats)(?: ?@(.*?),)?/i.test(msg)) {
            var uid = snapshot.val().uid;
            var user = msg.match(/^(?:!stats)(?:[ ]?@(.*?),)?/i)[1];
            if (typeof user != 'undefined' && user != "") {
                for (var i = 0; i < lastMessages[room].length; i++) {
                    if (lastMessages[room][i].username == user) {
                        uid = lastMessages[room][i].uid;
                        break;
                    }
                }
            }
            firebase.database().ref('users/'+uid).once('value')
            .then(function(data) {
                var userInfo = data.val();
                var textMsg = "@"+userInfo.public.nickname+", "+userInfo.public.points+" EXP | "+userInfo.private.double+" double | Trades: "+(userInfo.public.betaTrade == true ? "On" : "Off");
                if (typeof userInfo.moder != 'undefined' && typeof userInfo.moder.tradeban != 'undefined')
                    textMsg+= " | Tradeban: \""+userInfo.moder.tradeban+"\"";
                chatBotSendMsg(textMsg, room);
            })
        }
        
        if (/^!(?:wp|weapon) ?(\d+)/i.test(msg)) {
            var wpNum = parseInt(snapshot.val().text.match(/^!(?:wp|weapon)[ ]?(\d+)/i)[1]);
            log.debug('Weapon num: '+wpNum);
            var wpInfo = weapons.getWeaponById(wpNum);
            if (wpInfo) {
                var textMsg = "<img src=\""+getImgUrl(wpInfo.img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                        "<br>"+wpInfo.type+" | "+wpInfo.skinName;
                chatBotSendMsg(textMsg, room);
            }
        }
        
        if (/^!(?:joke|шутка)/i.test(msg)) {
            joke('RU')
            .then(function(joke) {
                chatBotSendMsg(joke, room);
            })
        }
        
        //if(/^!(?:trade))
        
        if (/^!(?:report) ?@(.*?),(.*$)?/i.test(msg)) {
            var reported = msg.match(/^!(?:report)[ ]?@(.*?),(.*$)?/i)[1];
            var reason   = msg.match(/^!(?:report)[ ]?@(.*?),(.*$)?/i)[2];
            log.debug('Reported: %s. Reason: %s', reported, reason);
            for (var i = 0; i < lastMessages[room].length; i++) {
                if (lastMessages[room][i].username == reported) {
                    var textMsg = "Reported @"+reported+',';
                    if (typeof reason != "undefined" && reason != "")
                        textMsg +="for "+reason;
                    chatBotSendMsg(textMsg, room);
                    var reportedLine = new Date().toLocaleString("ru")+"\n("+msgInfo.uid+") "+msgInfo.username+": "+reason+" \n" +
                                       "\t\t\t\t↓\n"+
                                       "("+lastMessages[room][i].uid+")"+lastMessages[room][i].username+" \n================\n";
                    fs.appendFile(process.env.OPENSHIFT_DATA_DIR+'reported.txt', reportedLine, function(err) {
                        if(err) {
                            log.debug(err)
                            throw err;
                        }
                    });
                    break;
                }
            }
        }
        
        if (/^!(?:item|itm) ?(\d+)/i.test(msg)) {
            var itmNum = parseInt(msg.match(/^!(?:item|itm)[ ]?(\d+)/i)[1]);
            if (typeof items[itmNum] == 'undefined') return;
            var textMsg = "<img src=\""+getImgUrl(items[itmNum].img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                          "<br>"+items[itmNum].type+" | "+items[itmNum].skinName;
            chatBotSendMsg(textMsg, room);
        }
        
        if (/^!(?:help|commands|info)/i.test(msg)) {
            var answer = getLocalizedArr(help, room);
            chatBotSendMsg(answer, room);
        }
        
        if (/^!(?:steam) (.*?)$/i.test(msg)) {
            var steamID = msg.match(/^!(?:steam) (.*?)$/i)[1];
            if (steamID) {
                steam.profile(steamID)
                .then(function(profile) {
                    var answer = steam.profileToString(profile);
                    chatBotSendMsg(answer, room);
                })
                .catch(function(err) {
                    var answer = `User ${req.params.id} not found.`;
                    chatBotSendMsg(answer, room);
                })
            }
        }
        
    })
        resetsTimeout[room] = setTimeout(clearChat(room), config.chat.clearTimeout);
        log.debug("Clear timeout starts. Room \"%s\" will be cleared in %s", room,config.chat.clearTimeout)
}

function clearChat (room) {
    var chatRef = firebase.database().ref('chat/'+room);
    (function(chatRef) {
        chatRef.limitToLast(40).once('value', function(snapshot) {
            chatRef.set(snapshot.val());
            
            log.debug("Chat room: '"+room+"' was cleared!");
            clearTimeout(resetsTimeout[room]);
            resetsTimeout[room] = setTimeout(function() {clearChat(room)}, config.chat.clearTimeout);
        });
    })(chatRef)
}

function getImgUrl(img, size) {
    log.debug("img: %s, size: %s", img, size);
    size = typeof size == 'undefined' ? "/124fx124f" : "/"+size+"fx"+size+"f";
    
    var prefix = "https://steamcommunity-a.akamaihd.net/economy/image/";
    //prefix = window.location.protocol == "http:" ? prefix.replace("https", "http") : prefix;
    
    if (typeof img == 'undefined') return "../images/none.png";
    
    if (img.indexOf(".png") != -1) return "../images/Weapons/" + img;
    else if (img.indexOf("steamcommunity") == -1) return prefix + img + size;
    else return img;
}

module.exports.chatBotSendMsg = chatBotSendMsg;
module.exports.listenChatRoom = listenChatRoom;
module.exports.listenAllRooms = listenAllRooms;
module.exports.clearChat = clearChat;