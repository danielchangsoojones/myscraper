exports.runScraperScheduler = function runScraperScheduler() {
     runScrapes();
}

runScrapes();
function runScrapes() {
    runScraper();
    runAgainInFiveMinutes();
}

//The Heroku scheduler only lets us do 10 minute intervals for a scraper
//So, I just run it every 10 minutes and then it does the call twice
//to break it up into 5 minute intervals
function runAgainInFiveMinutes() {
    var fiveMinutes = 300000;
    setTimeout(function() {
        console.log("running the next 5 minute batch of scheduler");
        runScraper();
    }, fiveMinutes);
}

function runScraper() {
    var GiantScrape = require('./uber-scraper');
    GiantScrape.runGiantScrape();
}