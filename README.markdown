CORS Proxy
==========

A simple node.js server, which can be used as a service to retrieve any HTTP
document and return it will accepting CORS headers. This enables the use of
cross-domain calls for images and scripts on a website.
  
  
Usage
-----

1. Just start the server using node:

        $ node server.js

2. Then send it an HTTP request (GET, PUT, POST or DELETE) putting the url in the path:

        http://cors-proxy-address.com/s3.amazonaws.com/MinecraftSkins/craftysaurus.png
