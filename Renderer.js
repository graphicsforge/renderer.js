
var EventEmitter = require('events').EventEmitter;
var WindowEventManager = require('./classes/WindowEventManager.js').WindowEventManager;
var Camera = require('./classes/Camera.js').Camera;
var CanvasMatrix4 = require('./classes/Camera.js').CanvasMatrix4;
var Model = require('./classes/Model.js').Model;
var Texture = require('./classes/Texture.js').Texture;
var Shader = require('./classes/Shader.js').Shader;

Renderer.prototype = new EventEmitter;
Renderer.constructor = Renderer;

function Renderer()
{
  this.dirty = true;
  this.sceneObjects = [];
  this.models = [];
  this.windowEventManager = new WindowEventManager();
  this.windowEventManager.bindUIListeners();
}

// TODO add this to a scene class
Renderer.prototype.loadJSONModels = function(url, callback, progresscallback)
{
  var self = this;
  var xhr = new XMLHttpRequest();
  xhr.overrideMimeType("application/json");
  xhr.open("GET", url, true);

  xhr.onprogress = function(event) {
    if ( event.lengthComputable && typeof(progresscallback)=='function' )
      progresscallback(event.loaded / event.total)
  };
  xhr.onreadystatechange=function() {
    if (xhr.readyState==4) {
      if ( xhr.status==200 ) {
        var json = JSON.parse(xhr.responseText);

        if ( typeof(json.length)!='undefined' ) {
          for ( var i=0; i<json.length; i++ )
            self.sceneObjects.push(new Model(self.gl, json[i]));
        } else {
          self.sceneObjects.push(new Model(self.gl, json));
        }
 
        if ( typeof(callback)=='function')
          callback(self);
      }
      if ( xhr.status==500 )
        console.error( 'Renderer::loadModels() load error:'+xhr.responseText );
    }
  }
  xhr.send();
}


Renderer.prototype.displayloop = function()
{
  // update the time
  var now = new Date();
  if ( this.lastRendererTime!=undefined )
    var renderTimeDiff = now.getTime()-this.lastRendererTime.getTime();
  this.lastRendererTime = now;
  if ( false ) //autorotate
  {
    this.camera.rotate([0,.5,0]);
    this.camera.translate([0.05,0,0]);
    this.dirty = true;
  }
  this.drawGL();
  var self = this;
  setTimeout(function(){self.displayloop();}, 10);
}

Renderer.prototype.initGL = function()
{
  var gl = this.gl;
  var self = this;
  // matrixes
  this.camera = new Camera();
  this.camera.bindDefaultControls(this.windowEventManager);
  this.prMatrix = new CanvasMatrix4();
  this.mvMatrix = new CanvasMatrix4();
  // application setup
  this.videoAlpha = 1;
  // opengl settings
  gl.clearColor(0.2, 0.2, 0.2, 1);
  gl.clearDepth(1);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable( gl.DEPTH_TEST );

  // load textures
  this.textures = [];
  //this.textures['background'] = new Texture(gl, '/test.jpg', function(){ self.dirty=true; });
  this.textures['crosshair'] = new Texture(gl, '/crosshair.png');
  this.textures['model'] = new Texture(gl, '/colormap.png', function(){ self.dirty=true; });

  this.loadJSONModels('/square.json', function() {
    self.models['square'] = self.sceneObjects.pop();
  });

  // load shaders
  this.shaders = [];
  this.shaders['basic'] = new Shader(gl, {"vertex_element_id":"vs-raymarch","fragment_element_id":"fs-raymarch"});

  // share event
  this.emit( "initgl", gl );
}

Renderer.prototype.replaceTexture = function(index, url)
{
  var self = this;
  this.textures[index] = new Texture(gl, url, function(){
    self.dirty=true;
  });
}

Renderer.prototype.bindCanvas = function(canvasID)
{
  this.canvas = document.getElementById(canvasID);
  var self = this;
  // wait until such a dom element exists
  if ( this.canvas==undefined )
    return setTimeout(function(){self.doLoad(canvasID);}, 10);
  // attach ui listeners
  if ( this.windowEventManager!=undefined )
  {
    this.canvasPos = WindowEventManager.getOffset(this.canvas);
    this.windowEventManager.addListener('mousemove', function(event){self.onMouseMove(event);});
    this.windowEventManager.addListener('mousewheel', function(event){self.dirty=true;});
    this.windowEventManager.addListener('resize', this.onResize, self);
    this.windowEventManager.addListener('mousedown', function(event){self.emit(event)});
  }
  this.canvas.width = parseInt(this.canvas.clientWidth);
  this.canvas.height = parseInt(this.canvas.clientHeight);
  // generate webgl context
  this.gl = this.canvas.getContext("experimental-webgl", { antialias: true });
  if ( !this.gl )
  {
    alert("Warning: no webGL context available!");
    return;
  }
  this.initGL();
  this.dirty = true;
  // starting displayloop
  this.displayloop();
}

Renderer.prototype.onResize = function(event)
{
  if ( this.canvas==undefined )
    return;
  this.canvasPos = WindowEventManager.getOffset(this.canvas);
  // reshape canvas contents
  this.canvas.width = parseInt(this.canvas.clientWidth);
  this.canvas.height = parseInt(this.canvas.clientHeight);
  this.dirty = true;
}

Renderer.prototype.onMouseMove = function(event)
{
  if ( this.canvas==undefined )
    return;
  // grab relative mouse position ( range -0.5 to 0.5 )
  this.mousePos = this.windowEventManager.mousePos.slice(0);
  this.mousePos[0] = (this.mousePos[0]-this.canvasPos[0]);
  this.mousePos[1] = (this.mousePos[1]-this.canvasPos[1]);
  this.dirty = true;
  this.emit( event );
}

Renderer.prototype.drawGL = function()
{
  if ( !this.gl )
    return 0;
  // check if we're marked for a redraw before doing anything
  if ( typeof(this.dirty)!='undefined' && this.dirty!=undefined && this.dirty==false )
    return 1;
  this.dirty = false;

  var gl = this.gl;
  var camera = this.camera;
  var canvas = this.canvas;

  // set up viewport
  gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
  // set up scene
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  // ortho view
  this.prMatrix.makeIdentity();
  this.prMatrix.ortho(0, 1, 1, 0, -1, 1);
  gl.uniformMatrix4fv( this.vs_basic_prMatrix, false, new Float32Array(this.prMatrix.getAsArray()) );
  this.mvMatrix.makeIdentity();
  this.textures['model'].bind(gl);
  this.shaders['basic'].bind(this);
  this.shaders['basic'].drawModel(this, this.models['square']);

  gl.clear( gl.DEPTH_BUFFER_BIT );

  // perspective view
  this.prMatrix.makeIdentity();
  this.prMatrix.perspective(camera.vfov, canvas.width/canvas.height*camera.pixelAspectRatio, camera.frustrumNear, camera.frustrumFar);

  this.mvMatrix.makeIdentity();
  this.mvMatrix.scale(.01,.01,.01);
  this.mvMatrix.multRight(camera.extrinsic);

  // bind stuff
  this.textures['model'].bind(gl);
  this.shaders['basic'].bind(this);

  // draw stuff
  for ( var i=0; i<this.sceneObjects.length; i++ )
    this.shaders['basic'].drawModel(this, this.sceneObjects[i]);
}


module.exports.Renderer = Renderer;
/*
for ( attribute in Renderer )
  if ( typeof(Renderer[attribute])=='function' )
    module.exports[attribute] = Renderer[attribute];
*/
