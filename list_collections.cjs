const https = require('https');
const fs = require('fs');

https.get('https://api.weather.gc.ca/collections?f=json', (resp) => {
    let data = '';
    resp.on('data', (chunk) => {
        data += chunk;
    });
    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            const ids = json.collections.map(c => c.id);
            fs.writeFileSync('collections_list.txt', ids.join('\n'));
            console.log("Wrote collections to collections_list.txt");
        } catch (e) {
            console.log("Error parsing JSON");
        }
    });
}).on("error", (err) => {
    console.log("Error: " + err.message);
});
