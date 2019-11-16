const puppeteer = require('puppeteer');

exports.runGiantScrape = function runGiantScrape() {
    getPlaces().then(function(places) {
        return scrapePlaces(places);
    })
}

function getPlaces() {
    var promise = new Promise(function(resolve, reject) {
        var Places = require('./uberPlaces');
        resolve(Places.placesArray);
    });

    return promise;
}

async function scrapePlaces(places) {
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        await scrapeUberPrice(place).then(function(result) {
            //save the result to my parse database
            var Save = require('./saveRidesharePrice');
            Save.saveRidesharePrice(result.current_uber_price, place.normal_uber_price, place.box_identifier);
        })
    }
}

async function scrapeUberPrice(place) {
    //so I can run this correctly on heroku
    const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      });
      
    // const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    await page.goto('https://uberestimator.com/');
    await page.waitFor(1000);

    var pickUpStr = place.start_destination;

    await page.focus("#pickup");
    for (var i = 0; i < pickUpStr.length; i++) {
        var char = pickUpStr.charAt(i);
        page.keyboard.type(char);

        if (i >= pickUpStr.length - 3) {
            await page.waitFor(500);
        }
    }

    await page.waitFor(3000);

    //For some reason, I can't get it to click off a selector.
    //So i just push the down arrow and then enter to choose the first option
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    var dropOffStr = place.end_destination;
    await page.focus("#dropoff");
    for (var i = 0; i < dropOffStr.length; i++) {
        var char = dropOffStr.charAt(i);
        page.keyboard.type(char);

        if (i >= dropOffStr.length - 3) {
            await page.waitFor(500);
        }
    }

    await page.waitFor(1000);

    //For some reason, I can't get it to click off a selector.
    //So i just push the down arrow and then enter to choose the first option
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    var areCorrectInputs = await page.evaluate((place) => {
        var areCorrectInputs = true;

        var elements = document.getElementsByClassName("autocomplete-suggestions");
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var choices = element.getElementsByClassName("autocomplete-suggestion");
            if (choices.length > 0) {
                var firstChoice = choices[0];
                if (firstChoice != undefined) {
                    var text = firstChoice.textContent;
                    var isPickUpAutoComplete = i == 0;
                    var textToMatch = place.end_destination;
                    if (isPickUpAutoComplete) {
                        textToMatch = place.exact_start_destination_name;
                    }
    
                    var isMatching = text == textToMatch;
                    if (!isMatching) {
                        areCorrectInputs = false;
                    }
                } else {
                    areCorrectInputs = false;
                }
            }
        }

        return areCorrectInputs;
    }, place)

    await page.waitFor(3000);

    if (!areCorrectInputs) {
        await browser.close();

        var finalResult = {
            place: place,
            current_uber_price: 0
        }
        return finalResult;
    } else {
        await Promise.all([
            await page.click("#getfare"),
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
        ]).catch(function(error) {
            var finalResult = {
                place: place,
                current_uber_price: -1
            }
            return finalResult;
        })

        const result = await page.evaluate(() => {
            let priceElement = document.querySelector("body > div > div.row > div:nth-child(1) > ul > li:nth-child(1)");
            return priceElement.innerHTML;
        });
    
        await browser.close();
    
        var finalPrice = translate(result);
    
        var finalResult = {
            place: place,
            current_uber_price: finalPrice
        }
    
        return finalResult;
    }
}

function translate(result) {
    var finalPrice = 0;

    var objectType = typeof result;
    if (objectType == "string") {
        var priceStr = result.split('$')[1];
        if (priceStr != undefined) {
            var priceAsFloat = parseFloat(priceStr);
            if (priceAsFloat != NaN) {
                finalPrice = priceAsFloat;
            }
        }
    }

    return finalPrice;
}

