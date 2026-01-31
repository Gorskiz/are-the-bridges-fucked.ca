const https = require('https');

https.get('https://api.weather.gc.ca/collections?f=json', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            const alertCollections = json.collections.filter(c => c.id.includes('alert') || c.id.includes('cap') || (c.title && c.title.toLowerCase().includes('alert')));
            console.log("Found collections:", alertCollections.map(c => c.id));
        } catch (e) {
            console.log("Error parsing JSON");
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
