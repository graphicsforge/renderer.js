
var EventEmitter = require('events').EventEmitter;
var WindowEventManager = require('./classes/WindowEventManager.js').WindowEventManager;
var Camera = require('./classes/Camera.js').Camera;
var CanvasMatrix4 = require('./classes/Camera.js').CanvasMatrix4;
var Model = require('./classes/Model.js').Model;
var Texture = require('./classes/Texture.js').Texture;

Renderer.prototype = new EventEmitter;
Renderer.constructor = Renderer;

function Renderer(canvasID)
{
  this.dirty = true;
  this.sceneObjects = [];
  this.windowEventManager = new WindowEventManager();
  this.windowEventManager.bindUIListeners();
  this.doLoad(canvasID);
}

Renderer.prototype.setModel = function(index, filename, progresscallback)
{
  var self = this;
  this.sceneObjects[0] = new Model(this.gl, filename, function(){self.dirty=true;}, progresscallback);
}

  // TODO goes to scene
  function getShader( gl, id )
  {
    var shaderScript = document.getElementById ( id );
    var str = "";
    var k = shaderScript.firstChild;
    while ( k ){
     if ( k.nodeType == 3 ) str += k.textContent;
     k = k.nextSibling;
    }
    var shader;
    if ( shaderScript.type == "x-shader/x-fragment" )
       shader = gl.createShader ( gl.FRAGMENT_SHADER );
    else if ( shaderScript.type == "x-shader/x-vertex" )
       shader = gl.createShader(gl.VERTEX_SHADER);
    else return null;
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
    {
      alert("error on shader:"+id+" "+gl.getShaderInfoLog(shader));
    }
    return shader;
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
  this.prMatrix = new CanvasMatrix4();
  this.mvMatrix = new CanvasMatrix4();
  // application setup
  this.videoAlpha = 1;
  // shaders
  this.prog = gl.createProgram();
  var prog = this.prog;
  gl.attachShader(prog, getShader( gl, "vs-basic" ));
  gl.attachShader(prog, getShader( gl, "fs-basic" ));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  this.posLoc = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray( this.posLoc );
  this.normLoc = gl.getAttribLocation(prog, "aNorm");
  gl.enableVertexAttribArray( this.normLoc );
  this.texLoc = gl.getAttribLocation(prog, "aTexCoord");
  gl.enableVertexAttribArray( this.texLoc );
  gl.uniform1f(gl.getUniformLocation(prog, "alpha"), 1);
  // initialize shader transform variables
  this.vs_basic_prMatrix = gl.getUniformLocation(prog, "prMatrix");
  this.vs_basic_mvMatrix = gl.getUniformLocation(prog, "mvMatrix");
  // opengl settings
  gl.clearColor(0.2, 0.2, 0.2, 0);
  gl.clearDepth(1);
  gl.depthFunc(gl.LEQUAL);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable( gl.DEPTH_TEST );
  // load models
  this.models = [];
  this.models['square'] = new Model(gl, '/square.json');
  // load textures
  this.textures = [];
  //this.textures['background'] = new Texture(gl, '/test.jpg', function(){ self.dirty=true; });
  this.textures['crosshair'] = new Texture(gl, '/crosshair.png');
  this.textures['model'] = new Texture(gl, '/colormap.png', function(){ self.dirty=true; });
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

Renderer.prototype.doLoad = function(canvasID)
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
    //this.canvas.style.height = document.body.clientHeight-150;
    //this.canvas.style.width = parseInt(document.body.clientWidth/2)-10;
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

  Renderer.prototype.set3DScene = function()
  {
    // draw 3D scene
    this.prMatrix.makeIdentity();
    this.prMatrix.perspective(this.camera.vfov, this.canvas.width/this.canvas.height*this.camera.pixelAspectRatio, this.camera.frustrumNear, this.camera.frustrumFar);
    this.gl.uniformMatrix4fv( this.vs_basic_prMatrix, false, new Float32Array(this.prMatrix.getAsArray()) );
    this.gl.uniform1f(this.gl.getUniformLocation(this.prog, "alpha"), .9);
    this.mvMatrix.makeIdentity();
    this.mvMatrix.rotate(90, 1,0,0);
    this.mvMatrix.multRight(this.camera.extrinsic);
    this.gl.uniformMatrix4fv( this.vs_basic_mvMatrix, false, new Float32Array(this.mvMatrix.getAsArray()) );
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
  var prMatrix = this.prMatrix;
  var mvMatrix = this.mvMatrix;
  var camera = this.camera;
  var canvas = this.canvas;

  // TODO: check to see if we're loaded yet
  // set up viewport
  gl.viewport( 0, 0, this.canvas.width, this.canvas.height );
  // set up scene
  gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

  // setup background texture, 2D origin in centre
  if ( false )
  {
    prMatrix.makeIdentity();
    prMatrix.ortho(0, this.canvas.width, this.canvas.height, 0, -1, 1);
    gl.uniformMatrix4fv( this.vs_basic_prMatrix, false, new Float32Array(prMatrix.getAsArray()) );
    mvMatrix.makeIdentity();
    var backgroundAspectRatio = (parseInt(this.canvas.height)/parseInt(this.canvas.width) * this.textures['test'].aspect);   // maintain aspect ratio
    if ( backgroundAspectRatio>=1 )
      mvMatrix.scale( backgroundAspectRatio, 1, 1 );
    else
      mvMatrix.scale( 1, 1/backgroundAspectRatio, 1 );
    mvMatrix.translate(0, -.25, 0);
    mvMatrix.scale( this.canvas.width, this.canvas.width, 1 );
    gl.uniformMatrix4fv( this.vs_basic_mvMatrix, false, new Float32Array(mvMatrix.getAsArray()) );
    gl.uniform1f(gl.getUniformLocation(this.prog, "alpha"), 1);

    this.textures['background'].bind(gl);
    this.models['square'].draw(gl, this.posLoc, this.normLoc, this.texLoc);
  }

  mvMatrix.makeIdentity();
  mvMatrix.translate(-.5, -.5, 0);
  mvMatrix.scale( 100, 100, 100 );
  if ( this.mousePos )
    mvMatrix.translate(this.mousePos[0], this.mousePos[1], 0);
  gl.uniformMatrix4fv( this.vs_basic_mvMatrix, false, new Float32Array(mvMatrix.getAsArray()) );
  this.textures['crosshair'].bind(gl);
  this.models['square'].draw(gl, this.posLoc, this.normLoc, this.texLoc);

  gl.clear( gl.DEPTH_BUFFER_BIT )

  prMatrix.makeIdentity();
  prMatrix.perspective(camera.vfov, canvas.width/canvas.height*camera.pixelAspectRatio, camera.frustrumNear, camera.frustrumFar);
  gl.uniformMatrix4fv( this.vs_basic_prMatrix, false, new Float32Array(prMatrix.getAsArray()) );
  mvMatrix.makeIdentity();
  mvMatrix.rotate(90, 1,0,0);
  mvMatrix.scale(.01,.01,.01);
  mvMatrix.multRight(camera.extrinsic);
  gl.uniformMatrix4fv( this.vs_basic_mvMatrix, false, new Float32Array(mvMatrix.getAsArray()) );
  this.textures['model'].bind(gl);
  for ( var i=0; i<this.sceneObjects.length; i++ )
    this.sceneObjects[i].draw(gl, this.posLoc, this.normLoc, this.texLoc);
  gl.clear( gl.DEPTH_BUFFER_BIT )
}


module.exports.Renderer = Renderer;
/*
for ( attribute in Renderer )
  if ( typeof(Renderer[attribute])=='function' )
    module.exports[attribute] = Renderer[attribute];
*/
