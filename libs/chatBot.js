var firebase        = require('firebase');
var config          = require('./config');
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
    RU: ["Hello!", "Привет.", "Дратути", "Хай", "Тут я", "Кто звал?", "Слушаю", "Ало. Да, да. ChatBot, да", "у меня сосет @BloodY,", "@Пездюк228,"],
    EN: ["Hello!", "Sup?", "What m8?", "Hi", "What's up dog!", "Look at my horse! My horse is amazing!", "Hey"]
}
//function listen

var items = [{
    "type" : "item",
    "skinName": "Name Tag",
    "img": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXX7gNTPcUmqBxiQE3CQOHj05yGCgkjdVdTsL6mKAI416bMIW1Aud7vxIHdkqCsMOmJwGgJvZIlj6fR-4vX_1cVUg"
}];

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
        
        if (/^[@]?(chatbot)/i.test(msg)) {
            var hello = typeof helloArr[room] == 'undefined' ? helloArr.EN : helloArr[room];
            var sayHello = hello[Math.floor(Math.random()*(hello.length))];
            chatBotSendMsg(sayHello, room);
        }
        
        if (/^!(donate|patreon)/i.test(msg)) {
            var textMsg = "<a href=\"https://www.patreon.com/VLADOS776\" target=\"_blank\">Patreon</a>"
            chatBotSendMsg(textMsg, room);
        }
        
        if (/^(!stats)/i.test(msg)) { //[ ]?@(.*?),
            var uid = snapshot.val().uid;
            firebase.database().ref('users/'+uid).once('value')
            .then(function(data) {
                var userInfo = data.val();
                log.debug('msg: %s', userInfo.public.nickname);
                var textMsg = "@"+userInfo.public.nickname+", "+userInfo.public.points+" EXP | "+userInfo.private.double+" double | Trades: "+(userInfo.public.betaTrade == true ? "On" : "Off");
                if (typeof userInfo.moder != 'undefined' && typeof userInfo.moder.tradeban != 'undefined')
                    textMsg+= " | Tradeban: \""+userInfo.moder.tradeban+"\"";
                chatBotSendMsg(textMsg, room);
            })
        }
        
        if (/^!(?:wp|weapon)[ ]?(\d+)/i.test(msg)) {
            var wpNum = parseInt(snapshot.val().text.match(/^!(?:wp|weapon)[ ]?(\d+)/i)[1]);
            log.debug('Weapon num: '+wpNum);
            firebase.database().ref('weapons/'+wpNum).once('value')
            .then(function(data) {
                var wpInfo = data.val();
                var textMsg = "<img src=\""+getImgUrl(wpInfo.img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                            "<br>"+wpInfo.type+" | "+wpInfo.skinName;
                log.debug("chatbot msg: %s", textMsg);
                chatBotSendMsg(textMsg, room);
            })
        }
        
        if (/^!(?:report)[ ]?@(.*?),(.*$)?/i.test(msg)) {
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
                    fs.appendFile('reported.txt', reportedLine);
                    break;
                }
            }
        }
        
        if (/^!(?:item|itm)[ ]?(\d+)/i.test(msg)) {
            var itmNum = parseInt(msg.match(/^!(?:item|itm)[ ]?(\d+)/i)[1]);
            if (typeof items[itmNum] == 'undefined') return;
            var textMsg = "<img src=\""+getImgUrl(items[itmNum].img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                          "<br>"+items[itmNum].type+" | "+items[itmNum].skinName;
            chatBotSendMsg(textMsg, room);
        }
        
        if (/^!(?:help|commands|info)/i.test(msg)) {
            var answer = "Доступные команды:<br><b>!stats</b> - Статистика игрока<br><b>!wp (id)</b> - информация об оружии по id (0-818).";
            chatBotSendMsg(answer, room);
        }
        
        /*if (/^!lastmsg/.test(msg)) {
            log.debug(lastMessages);
        }     */   
        //Last messages log
        if (typeof lastMessages[room] == 'undefined')
            lastMessages[room] = [];
        if (lastMessages[room].length > 15) 
            lastMessages[room] = lastMessages[room].slice(1);
        lastMessages[room].push(msgInfo);
    })
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