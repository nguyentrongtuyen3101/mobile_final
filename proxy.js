const httpProxy = require('http-proxy');
const proxy = httpProxy.createProxyServer({});

require('http').createServer((req, res) => {
  proxy.web(req, res, { target: 'http://localhost:9090' });
}).listen(8080);

console.log('Proxy running on http://localhost:8080');