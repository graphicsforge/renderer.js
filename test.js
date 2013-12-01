
var http = require('http'); // HTTP server
var fs = require('fs'); // File System

var previewJSON = require('./test/previewJSON.js');

// distribute our render.min.js file
var HTTP_PORT = 3000;
httpServer = http.createServer(function(req, res){
  req.url = decodeURI(req.url);
  fs.exists("./bin"+req.url, function(exists) {  
    if(!exists) {  
      res.writeHead(404, {"Content-Type": "text/plain"});  
      res.end("404 Not Found\n");  
      return;
    }
    try {
      fs.stat("./bin"+req.url, function( error, stat ) {
        if ( error ) { throw error; }
        res.writeHead(200, {
          'Content-Length' : stat.size
        });
        var fileStream = fs.createReadStream("./bin"+req.url, {start:0});
        fileStream.on("data", function(data) {
          res.write(data, 'binary');
        });
        fileStream.on("end", function() {
          res.end();
        });
      });
    } catch ( error ) { res.end(error) }
  });
  return;
});
httpServer.listen(HTTP_PORT);


previewJSON.setBasePath("./test/previewJSON");
previewJSON.setRenderJsUrl("http://localhost:"+HTTP_PORT+"/renderer.min.js");
previewJSON.setPort(3001);
previewJSON.startServer();
