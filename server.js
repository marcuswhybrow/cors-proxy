var http = require('http'),
    url = require('url'),
    corsHeaders = {
      'Access-Control-Allow-Origin'  : '*',
      'Access-Control-Allow-Methods' : 'POST, GET, PUT, DELETE, OPTIONS',
      'Access-Control-Max-Age'       : '86400', // 24 hours
      'Access-Control-Allow-Headers' : 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept'
    },
    invalidContentTypes = [
      'text/html'
    ];

require('bufferjs/concat');

var server = http.createServer(function(req, res) {
  
  if (req.method == 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return
  }
  
  function getDocument(path, type) {
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
          if (type == 'raw')
            headers['content-type'] = 'text/plain; charset=x-user-defined';
          if (type == 'base64') {
            headers['content-type'] = 'text/plain; charset=x-user-defined';
            // headers['content-transfer-encoding'] = 'base64';
          }
          for (name in corsHeaders)
            headers[name] = corsHeaders[name];

          if (type == 'base64') {
            var buffers = [];
            proxyRes.on('data', function(chunk) {
              buffers.push(chunk);
            })
            proxyRes.on('end', function() {
              var result = new Buffer.concat(buffers).toString('base64')
              headers['content-length'] = result.length;
              res.writeHead(proxyRes.statusCode, headers);
              res.write(result, 'binary');
              res.end();
            });
          } else {
            proxyRes.on('data', function(chunk) {
              res.write(chunk, 'binary');
            });
            proxyRes.on('end', function() {
              res.end();
            });
          }
        } else {
          res.statusCode = 415 // Unsupported Media Type
          res.end();
        }
      }
    }

    console.log(type, options.host, options.method, options.path);

    var proxy = http.request(options, handleRes);
    proxy.on('error', function() {
      console.log('error: ' + options);
      res.end();
    });

    proxy.end();
  }
  
  if (req.url.indexOf('/http://') == 0) {
    getDocument(req.url.slice(1));
  } else if (req.url.indexOf('/raw/http://') == 0) {
    getDocument(req.url.slice(5), 'raw');
  } else if (req.url.indexOf('/base64/http://') == 0) {
    getDocument(req.url.slice(8), 'base64');
  } else {
    res.statusCode = 404
    res.end();
    return
  }
});

var port = process.env.PORT || 5000;
server.listen(port, function() {
    console.log("Listening on " + port);
});