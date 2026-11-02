const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('QuantScrow Core Service Active');
        } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
