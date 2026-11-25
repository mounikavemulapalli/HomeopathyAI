const http = require('http');

const url = "http://localhost:5000/api/repertarize";
const payload = {
    structuredSymptoms: [
        {field: "Aversions", value: "milk"}
    ]
};

const postData = JSON.stringify(payload);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/repertarize',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log("Request successful!");
            console.log("Status Code:", res.statusCode);
            console.log("Response Body:", JSON.stringify(parsedData, null, 2));
        } catch (e) {
            console.error("Error parsing response body:", e.message);
            console.error("Raw Response Body:", rawData);
        }
    });
});

req.on('error', (e) => {
    console.error(`Request failed: ${e.message}`);
});

req.write(postData);
req.end();