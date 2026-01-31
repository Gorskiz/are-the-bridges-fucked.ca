const https = require('https');

https.get('https://api.weather.gc.ca/collections/citypageweather-realtime/items?limit=2000&f=json', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            const halifax = json.features.filter(f => f.properties.name.en.toLowerCase().includes('halifax'));
            console.log("Found Halifax:", JSON.stringify(halifax, null, 2));
        } catch (e) {
            console.log("Error parsing JSON");
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
