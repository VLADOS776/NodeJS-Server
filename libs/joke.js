var request = require("request");
var r       = require("nraw");

var Reddit = new r('ChatBot');

var url = {
    RU: "http://bash.im/forweb/?u",
    EN: "http://api.icndb.com/jokes/random"
};
var prefix = {
    RU: "<b>Случайная шутка:</b><br>",
    EN: "<b>Random joke from /r/Jokes:</b><br>"
}



var timeout = 0;

function randomJoke(lang) {
    return new Promise(function(resolve, reject) {
        if (timeout > Date.now() - 10000) {
            resolve("Timeout 10 seconds!");
            return false;
        }
        if (lang == 'RU') {
            RussianJoke()
            .then(function(joke){
                resolve(prefix.RU+joke)
            })
        } else {
            EnglishJoke()
            .then(function (joke) {
                resolve(prefix.EN+joke)
            })
        }
    })
}

function RussianJoke() {
    return new Promise(function(resolve, reject){
        request(url.RU, function(error, response, body) {
            if(!error) {
                var joke = body.match(/padding: 1em 0;">(.*?)<' \+ '\/div>/)[1];
                joke = joke.replace(/<' \+ 'br(?: \/)?>/gi, '<br>');
                timeout = Date.now();
                resolve(joke);
            } else {
                console.log('Error: '+error);
                reject(error);
            }
        })
    })
}
function EnglishJoke() {
    return new Promise(function(resolve, reject){
        Reddit.subreddit('Jokes').sort('top').random().limit(1).exec(function(data) {
            var joke = `<span style='color:#0000ff'>${data[0].data.children[0].data.title}</span><br>${data[0].data.children[0].data.selftext}`
            resolve(joke);
        })
    })
}

module.exports = randomJoke;