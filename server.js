var http = require('http'),
    cors_headers = {
      'Access-Control-Allow-Origin'  : '*',
      'Access-Control-Allow-Methods' : 'POST, GET, PUT, DELETE',
      'Access-Control-Max-Age'       : '86400', // 24 hours
      'Access-Control-Allow-Headers' : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
    };

var server = http.createServer(function(request, response) {
  var pathArray = request.url.slice(1).split('/'),
      options = {
        host: pathArray[0],
        port: 80,
        path: '/' + pathArray.slice(1).join('/'),
        method: request.method
      }
  
  console.log(options.host, options.method, options.path);
  
  var proxy = http.request(options, function(proxy_response) {
    var headers = proxy_response.headers;
    for (name in cors_headers) {
      headers[name] = cors_headers[name];
    }
    response.writeHead(proxy_response.statusCode, headers);
    
    proxy_response.on('data', function(chunk) {
      response.write(chunk, 'binary');
    });
    proxy_response.on('end', function() {
      response.end();
    });
  });
  
  proxy.on('error', function(e) {
    console.log('problem with request: ', + e.message);
    response.end();
  });
  
  proxy.end();
});

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});