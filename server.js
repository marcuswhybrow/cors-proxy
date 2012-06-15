var http = require('http'),
    url = require('url'),
    corsHeaders = {
      'Access-Control-Allow-Origin'  : '*',
      'Access-Control-Allow-Methods' : 'POST, GET, PUT, DELETE',
      'Access-Control-Max-Age'       : '86400', // 24 hours
      'Access-Control-Allow-Headers' : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
    },
    invalidContentTypes = [
      'text/html'
    ];

var server = http.createServer(function(req, res) {
  
  var path = req.url.slice(1);
  
  if (path.indexOf('http://') != 0) {
    res.statusCode = 404
    res.end();
    return
  }
  
  var proxyUrl = url.parse(path),
      options = {
        host: proxyUrl.hostname,
        port: proxyUrl.port || 80,
        path: proxyUrl.path,
        method: 'GET'
      };
  
  function validContentType(type) {
    var re = new RegExp('(' + invalidContentTypes.join('|') + ')');
    return ! re.test(type);
  }
  
  function handleRes(proxyRes) {
    if ([301, 302, 307, 308].indexOf(proxyRes.statusCode) >= 0 && proxyRes.headers['location']) {
      var location = url.parse(proxyRes.headers['location']),
          options = {
            host: location.host,
            post: location.port || 80,
            path: location.path,
            method: 'GET'
          };
        http.request(options, handleRes).end();
    } else {
      if (validContentType(proxyRes.headers['content-type'])) {
        var headers = proxyRes.headers;
        if (req.headers['x-corsproxy-override-mime-type'])
          headers['content-type'] = req.headers['x-corsproxy-override-mime-type']
        for (name in corsHeaders)
          headers[name] = corsHeaders[name];
        res.writeHead(proxyRes.statusCode, headers);

        proxyRes.on('data', function(chunk) {
          res.write(chunk, 'binary');
        });
        proxyRes.on('end', function() {
          res.end();
        });
      } else {
        res.statusCode = 415 // Unsupported Media Type
        res.end();
      }
    }
  }
  
  console.log(options.host, options.method, options.path);
  
  var proxy = http.request(options, handleRes);
  proxy.on('error', function() {
    console.log('error: ' + options);
    res.end();
  });
  
  proxy.end();
});

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});