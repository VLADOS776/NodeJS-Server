var request      = require("request"),
    parseString  = require("xml2js").parseString;

function profile(id) {
    return new Promise(function(resolve, reject) {
        request("http://steamcommunity.com/id/"+id+"/?xml=1", function(error, response, body) {
            if(!error) {
                parseString(body, function(err, profileInfo) {
                    //console.dir(profileInfo)
                    resolve(profileInfo.profile);
                })
            } else {
                console.log('Error: '+error);
                reject(error);
            }
        })
    })
}

function profileToString(profile) {
    var mostPlayedGames = "";
    for (var i = 0; i < profile.mostPlayedGames[0].mostPlayedGame.length; i++) {
        var game = profile.mostPlayedGames[0].mostPlayedGame[i];
        mostPlayedGames += `<tr><td>${game.gameName}</td><td>${game.hoursOnRecord}</td></tr>`;
    }
    var stat = profile.stateMessage[0].replace('<br/>', " ");
    var vac = profile.vacBanned != 0 ? ' | VAC: '+profile.vacBanned : "";
    var tamp = `<img src="${profile.avatarFull[0]}" style="width: 80px; height: 80px; border-radius: 0;"><br>    
                <b>${profile.steamID}</b> [${stat}]${vac}<br>Most played games:
                <table><tr><th>Game</th><th>Hours</th></tr>
                ${mostPlayedGames}
                </table>`
    return tamp
}

module.exports.profile = profile;
module.exports.profileToString = profileToString;