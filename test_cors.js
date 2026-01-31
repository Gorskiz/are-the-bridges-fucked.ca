
try {
    const response = await fetch('https://api.weather.gc.ca/collections/citypageweather-realtime/items/ns-19?f=json');
    console.log('Status:', response.status);
    console.log('CORS headers:', response.headers.get('access-control-allow-origin'));
} catch (e) {
    console.error('Error:', e.message);
}
