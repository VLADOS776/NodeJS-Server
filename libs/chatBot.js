var firebase        = require('firebase');
var config          = require('./config');
var Items           = require('./items');
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

var opacityUsers = {
    users: {},
    addUser: function(uid, byWho) {
        var now = new Date();
        
        opacityUsers.users[uid] = {
            start: now.getTime(),
            end: now.setMinutes(now.getMinutes() + 10), // 10 min
            vip: byWho
        }
    },
    check: function() {
        var now = new Date();
        for (key in opacityUsers.users) {
            if (opacityUsers.users[key].end < now)
                opacityUsers.removeUser(key);
        }
    },
    removeUser: function(uid) {
        delete opacityUsers.users[key]
    },
    main: function(msg) {
        opacityUsers.check();
        if (typeof opacityUsers.users[msg.uid] != 'undefined' /*&& opacityUsers.users[msg.uid].end < new Date().getTime()*/) {         
            var textMsg = "...<script>$(\"li[data-msgkey='" + msg.msgID + "']\").addClass('vip-blur')</script>"
            chatBotSendMsg(textMsg, msg.room);
        }
    }
};

var helloArr = {
    RU: ["Hello!", "Привет.", "Дратути", "Хай", "Тут я", "Кто звал?", "Слушаю", "Ало. Да, да. ChatBot, да"],
    EN: ["Hello!", "Sup?", "What m8?", "Hi", "What's up dog!", "Look at my horse! My horse is amazing!", "Hey"]
}

var help = {
    RU: `Доступные команды:<br>
        <b>!stats</b> - Статистика игрока<br>
        <b>!wp (id)</b> или <b>!weapon (id)</b> - информация об оружии по id (0-${(Items.count)})<br>
        <b>!donate</b> - Ссылка на Patreon и кнопка для показа рекламы<br>
        <b>!steam (steamID)</b> - немного информации о профиле в стим<br>
        <b>!joke</b> или <b>!шутка</b> - случайная шутка`,
    EN: `Available commands:<br>
        <b>!stats</b> or <b>!stats@(nickname),</b> - Player statistic<br>
        <b>!wp (id)</b> or <b>!weapon (id)</b> - get weapon info by id (0-${(Items.count)})<br>
        <b>!donate</b> - Link to Patreon and button that shows video ad.<br>
        <b>!steam (steamID)</b> - Steam info<br>
        <b>!joke</b> - random joke`
}

var vipHelp = {
    RU: `Стоимость VIP - $5/месяц<br>
        Чтобы купить вип, пишите в VK: <a href="http://vk.com/vlados776">vk.com/vlados776</a><br><br>
        Доступные команды:<br>
        <b>!vip all</b> - Сделать всех игроков VIP на 1 секунду<br>
        <b>!vip rorate</b> - Перевернуть чат<br>
        <b>!vip opacity @(nickname)</b> - Сообщения игрока будут полупрозрачными в течение 10 минут`,
    EN: `No translation yet ;(`
}

var resetsTimeout = {};

var items = [{
    "type" : "item",
    "skinName": "Name Tag",
    "img": "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXX7gNTPcUmqBxiQE3CQOHj05yGCgkjdVdTsL6mKAI416bMIW1Aud7vxIHdkqCsMOmJwGgJvZIlj6fR-4vX_1cVUg"
}, {
    "type" : "DreamHack Cluj-Napoca",
    "skinName": "VLADOS776",
    "img": "VLADOS776DreamHack.png"
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
        var inf = snapshot.val();
        var msgInfo = {
            text: inf.text,
            uid : inf.uid,
            username: inf.username,
            group: inf.group || "",
            msgID: snapshot.key,
            room: room
        }
        log.debug('%s: %s', snapshot.val().username, msgInfo.text);
        
        opacityUsers.main(msgInfo);
        
        if (typeof lastMessages[room] == 'undefined')
            lastMessages[room] = [];
        if (lastMessages[room].length > 15) 
            lastMessages[room] = lastMessages[room].slice(1);
        lastMessages[room].push(msgInfo);
        
        if (/^[@]?(chatbot)/i.test(msgInfo.text)) {
            var hello = typeof helloArr[room] == 'undefined' ? helloArr.EN : helloArr[room];
            var sayHello = hello[Math.floor(Math.random()*(hello.length))];
            chatBotSendMsg(sayHello, room);
        }
        
        if (/^!(donate|patreon)/i.test(msgInfo.text)) {
            var textMsg = "<div style=\"padding: 5px;background: #E6461A;color: #fff;border-radius: 10px;text-align: center;text-shadow: 1px 1px RGBA(0, 0, 0, 0.42);border-bottom: 2px solid #953419;margin-bottom: 5px;\"><a href=\"https://www.patreon.com/VLADOS776\" target=\"_blank\" style=\"text-decoration: none;color: #fff;display: block;\">Patreon</a></div><div onclick='if(isAndroid()){client.showVideoAd(\"#\")}' style=\"padding: 5px;background: #63a7ff;color: #fff;border-radius: 10px;text-align: center;text-shadow: 1px 1px RGBA(0, 0, 0, 0.42);border-bottom: 2px solid #186ad7;\">Watch ad</div>";
            chatBotSendMsg(textMsg, room);
        }
        
        if (/^(?:!stats)(?:[ ]?@(.*?),)?/i.test(msgInfo.text)) {
            var uid = msgInfo.uid;
            var user = msgInfo.text.match(/^(?:!stats)(?:[ ]?@(.*?),)?/i)[1];
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
                var balanceRegExp = /(\d)(?=(\d\d\d)+([^\d]|$))/g;
                var userInfo = data.val();
                userInfo.moder = userInfo.moder || {};
                var textMsg = "@"+userInfo.public.nickname+", " + calcLvl(userInfo.public.points) + " LVL | "+((""+userInfo.private.double).replace(balanceRegExp, '$1&#8198;'))+" double | Trades: "+(userInfo.public.betaTrade == true ? "On" : "Off");
                
                if (userInfo.private.double > 10000000000 && !userInfo.moder.tradeban && !userInfo.moder.unbanable) {
                    userInfo.moder.tradeban = 'Auto ban. Too much money.';
                    
                    firebase.database().ref('users/' + uid + '/moder/tradeban').set(userInfo.moder.tradeban);
                    firebase.database().ref('bans/' + uid + '/tradeban').set(userInfo.moder.tradeban);
                    
                    if (userInfo.private.androidID)
                        firebase.database().ref('androidIDBans/' + userInfo.private.androidID + '/tradeban').set(userInfo.moder.tradeban);
                }
                
                if (typeof userInfo.moder.tradeban != 'undefined')
                    textMsg+= " | Tradeban: \""+userInfo.moder.tradeban+"\"";
                
                chatBotSendMsg(textMsg, room);
            })
        }
        
        if (/^!(?:wp|weapon)[ ]?(\d+)/i.test(msgInfo.text)) {
            var wpNum = parseInt(snapshot.val().text.match(/^!(?:wp|weapon)[ ]?(\d+)/i)[1]);
            log.debug('Weapon num: '+wpNum);
            var wpInfo = Items.getItemByID(wpNum, 'weapons');
            if (wpInfo) {
                var textMsg = "<img src=\""+getImgUrl(wpInfo.img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                        "<br>"+wpInfo.type+" | "+wpInfo.skinName;
                chatBotSendMsg(textMsg, room);
            }
        }
        
        if (/^!(?:sticker)[ ]?(\d+)/i.test(msgInfo.text)) {
            var id = parseInt(snapshot.val().text.match(/^!(?:sticker)[ ]?(\d+)/i)[1]);
            log.debug('Sticker ID: '+id);
            var info = Items.getItemByID(id, 'stickers');
            if (info) {
                var textMsg = "<img src=\""+getImgUrl(info.img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                        "<br>"+info.name;
                chatBotSendMsg(textMsg, room);
            }
        }
        
        if (/^!(?:joke|шутка)/i.test(msgInfo.text)) {
            joke(room)
            .then(function(joke) {
                chatBotSendMsg(joke, room);
            })
        }
        
        if (/^!(?:report)[ ]?@(.*?),(.*$)?/i.test(msgInfo.text)) {
            var reported = msgInfo.text.match(/^!(?:report)[ ]?@(.*?),(.*$)?/i)[1];
            var reason   = msgInfo.text.match(/^!(?:report)[ ]?@(.*?),(.*$)?/i)[2];
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
        
        if (/^!(?:item|itm)[ ]?(\d+)/i.test(msgInfo.text)) {
            var itmNum = parseInt(msgInfo.text.match(/^!(?:item|itm)[ ]?(\d+)/i)[1]);
            if (typeof items[itmNum] == 'undefined') return;
            var textMsg = "<img src=\""+getImgUrl(items[itmNum].img, 150)+"\" style='width:150px;height:150px;border-radius:0;cursor:default;'>" +
                          "<br>"+items[itmNum].type+" | "+items[itmNum].skinName;
            chatBotSendMsg(textMsg, room);
        }
        
        if (/^!(?:help|commands|info)/i.test(msgInfo.text)) {
            var answer = getLocalizedArr(help, room);
            chatBotSendMsg(answer, room);
        }
        
        if (/^!(?:steam) (.*?)$/i.test(msgInfo.text)) {
            var steamID = msgInfo.text.match(/^!(?:steam) (.*?)$/i)[1];
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
        
        if (/^!vip$/.test(msgInfo.text)) {
            chatBotSendMsg(getLocalizedArr(vipHelp, room), room);
        }
        
        if (/^!(?:vip)[ _]?(?:all)/ig.test(msgInfo.text) && /vip/.test(msgInfo.group)) {
            chatBotSendMsg("<script>$('.chat__message').each(function() {if(!$(this).hasClass('vip'))$(this).addClass('vip');})</script>", room);
        }
        
        if (/^!(?:vip)[ _]?(?:rotate)/ig.test(msgInfo.text) && /vip/.test(msgInfo.group)) {
            chatBotSendMsg("<script>$('.chat__message').each(function() {if(!$(this).hasClass('my_message'))$(this).addClass('my_message');})</script>", room);
        }
        
        if (/^!(?:vip)[ _]?(?:blur)[ _]?@(.*?),?$/ig.test(msgInfo.text) && /vip/.test(msgInfo.group)) {
            var uid = "";
            try {
                var user = msgInfo.text.match(/^!(?:vip)[ _]?(?:blur)[ _]?@(.*?),/i)[1];
            } catch (e) {
                console.log(e);
                return false;
            }
            
            if (typeof user != 'undefined' && user != "") {
                for (var i = 0; i < lastMessages[room].length; i++) {
                    if (lastMessages[room][i].username == user) {
                        uid = lastMessages[room][i].uid;
                        break;
                    }
                }
            }
            console.log(`VIP changed opacity to ${user} | ${uid}`);
            
            if (uid == "" || opacityUsers.users[msgInfo.uid])
                return false;
            
            opacityUsers.addUser(uid, msgInfo.username);
        }
    })
    //resetsTimeout[room] = setTimeout(function(){clearChat(room)}, config.chat.clearTimeout);
    //log.debug("Clear timeout starts. Room \"%s\" will be cleared in %s", room,config.chat.clearTimeout)
}

function calcLvl(exp) {
    exp = exp || 0;
    var i = 1;
    while (true) {
        if (exp < lvlEXP(i))
            return i-1;
        i++;
      }
}

function lvlEXP(lvl) {
    if (lvl <= 1) 
        return 0;
    else 
        return lvlEXP(lvl-1) + lvl*2;
}

function clearChat(room) {
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