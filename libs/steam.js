var request = require("request"),
    cheerio = require("cheerio");

function profile(id) {
    return new Promise(function(resolve, reject) {
        request("http://steamcommunity.com/id/"+id, function(error, response, body) {
            if(!error) {
                var $ = cheerio.load(body);
                var joke = $($(".quote .text")[0]).html();

                console.log(joke);
                resolve(joke);
            } else {
                console.log('Error: '+error);
                reject(error);
            }
        })
    })
}

module.exports.profile = profile;