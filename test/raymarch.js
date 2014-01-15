
var http = require('http'); // HTTP server
var util = require('util');
var fs = require('fs'); // File System

var PATH = ".";
var RENDER_JS_URL;
var HTTP_PORT = 80;
var httpServer;
var chatServer;

function sendMainPage(req, res)
{
  // render main page
  res.writeHead(200, {'Content-Type': 'text/html'});
  try {
  var output = ""+
    "\n<script src='"+RENDER_JS_URL+"'></script>"+
    "\n"+fs.readFileSync(PATH+'/shaders.glsl', 'utf8')+
    "\n"+fs.readFileSync(PATH+'/raymarch.glsl', 'utf8')+
        fs.readFileSync(PATH+'/index.html', 'utf8')
  } catch ( error ) { console.log( error.toString() ) }
  res.end(output);
}

function startServer()
{
  console.log("launching raymarch server on port "+HTTP_PORT);
  // make a standard http server
  httpServer = http.createServer(function(req, res){
    // respond to web requests
    if ( req.url[req.url.length-1]=='/' )
    {
      sendMainPage(req, res);
      return;
    }
    // otherwise see if this is a resource request
    req.url = decodeURI(req.url);
    fs.exists(PATH+req.url, function(exists) {  
      if(!exists) {  
        res.writeHead(404, {"Content-Type": "text/plain"});  
        res.end("404 Not Found\n");  
        return;
      }
      try {
        fs.stat(PATH+req.url, function( error, stat ) {
          if ( error ) { throw error; }
          res.writeHead(200, {
            'Content-Length' : stat.size
          });
          var fileStream = fs.createReadStream(PATH+req.url, {start:0});
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
  httpServer.on("error", function(err) {
    console.log("httpServer "+err.code);
  });
  httpServer.listen(HTTP_PORT);
}

module.exports = {
  setBasePath: function( basePath ) {
    PATH = basePath;
  },
  setRenderJsUrl: function( url ) {
    RENDER_JS_URL = url;
  },
  setPort: function( port ) {
    HTTP_PORT = port;
  },
  startServer: startServer,
  getHttpServer: function() { return httpServer; }
}

