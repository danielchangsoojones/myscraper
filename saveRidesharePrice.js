
exports.saveRidesharePrice = function saveRidesharePrice(current_uber_price, normal_uber_price, box_identifier) {
    var multiplier = calcMultiplier(current_uber_price, normal_uber_price);
    saveWithAPICall(multiplier, box_identifier, normal_uber_price, current_uber_price);
}

function calcMultiplier(current_uber_price, normal_uber_price) {
    var multiplier = 1;
    if (normal_uber_price != 0 && current_uber_price != undefined) {
        multiplier = current_uber_price / normal_uber_price;
    }

    return multiplier;
}

function saveWithAPICall(multiplier, box_identifier, normal_uber_price, current_uber_price) {
    const https = require('https');

    var url = "https://btown-rides-development.herokuapp.com/hackyPrice?";
    url += "multiplier=" + multiplier;
    url += "&box_identifier=" + box_identifier;
    url += "&normal_price=" + normal_uber_price;
    url += "&current_price=" + current_uber_price;

    console.log(url);

    https.get(url, (resp) => {
    let data = '';

    // A chunk of data has been recieved.
    resp.on('data', (chunk) => {
        data += chunk;
    });

    // The whole response has been received. Print out the result.
    resp.on('end', () => {
        console.log(data);
    });

    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}