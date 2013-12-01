
var EventEmitter = require('events').EventEmitter;

WindowEventManager.prototype = new EventEmitter;
WindowEventManager.constructor = WindowEventManager;

/********
// This class handles tracking window events, like the UI state
// Drop the usual abstraction stuff that you use for GLX or GLUT in here
********/
function WindowEventManager()
{
  //  ui state
  this.keyboard = []; // keyboard state
  this.mouseButton = [false, false, false];
  this.mousePos = [0, 0];
  this.mousePrev = [0, 0];
  this.mouseDownPos = [0, 0];
  this.mouseDiff = [0, 0];
  this.mouseLastClickTime = new Date();
  this.pointerLock = false;
}

/********
// UI handler functions
// The update the UI state, then emit() the event for any listener
********/
WindowEventManager.prototype.mouseUp = function(event) {
  this.mouseButton[event.button] = false;
  this.mousePos[0] = event.clientX;
  this.mousePos[1] = event.clientY;
  this.emit( "mouseUp", event );
}
WindowEventManager.prototype.mouseDown = function(event) {
  this.mouseButton[event.button] = true;
  this.mousePos[0] = event.clientX;
  this.mousePos[1] = event.clientY;
  this.mouseDownPos = this.mousePos.slice();
  this.emit( "mouseDown", event );
  this.mouseLastClickTime = new Date();
}
WindowEventManager.prototype.mouseMove = function(event) {
  this.mousePrev = this.mousePos.slice();
  this.mousePos[0] = event.clientX;
  this.mousePos[1] = event.clientY;
  if ( this.pointerLock )
  {
    this.mouseDiff[0] = event.movementX ||
            event.mozMovementX ||
            event.webkitMovementX ||
            0;
    this.mouseDiff[1] = event.movementY ||
            event.mozMovementY ||
            event.webkitMovementY ||
            0;
  }
  else
  {
    this.mouseDiff[0] = this.mousePos[0]-this.mousePrev[0];
    this.mouseDiff[1] = this.mousePos[1]-this.mousePrev[1];
  }
  this.emit( "mouseMove", event );
}
WindowEventManager.prototype.keyUp = function(event) {
  this.keyboard[event.which] = false;
  // deal with combinations of shift+alt keys
  if ( event.which==224 )
    this.keyboard[18] = false;
  this.emit( "keyUp", event );
}
WindowEventManager.prototype.keyDown = function(event) {
  this.keyboard[event.which] = true;
  // deal with combinations of shift+alt keys
  if ( event.which==224 )
    this.keyboard[18] = true;
  this.emit( "keyDown", event );
}
WindowEventManager.prototype.onResize = function(event)
{
  this.emit( "onResize", event );
}
WindowEventManager.prototype.onLoad = function(event)
{
  this.emit( "onLoad", event );
}
WindowEventManager.prototype.mouseWheel = function(event)
{
  this.emit( "mouseWheel", event );
}

/********
// start listening on UI events
// The manager won't be active until this is called
********/
WindowEventManager.prototype.bindUIListeners = function()
{
  var self = this;
  window.onkeydown=function(event){self.keyDown("keyDown", event);};
  window.onkeyup=function(event){self.keyUp("keyUp", event);};
  window.onmousedown=function(event){self.mouseDown("mouseDown", event);};
  window.onmouseup=function(event){self.mouseUp("mouseUp", event);};
  window.onmousemove=function(event){self.mouseMove("mouseMove", event);};
  window.onmousewheel=function(event){self.mouseWheel("mouseWheel", event);};
  window.onresize=function(event){self.onResize("onResize", event);};
  window.onload=function(event){self.onLoad("onLoad", event);};
}

/********
// static helper functions
********/
WindowEventManager.loadScript = function(filename, key, callback)
{
  // see if we've already got a script with corresponding key
  var allscripts=document.getElementsByTagName("script");
  var prevscript = 0;
  for (var i=allscripts.length; i>=0; i--)
  {
    if (allscripts[i]!=undefined && allscripts[i].getAttribute("key")==key )
    {
      prevscript = allscripts[i];
      break;
    }
  }
  var fileref=document.createElement('script')
  fileref.setAttribute("type","text/javascript");
  fileref.setAttribute("src", filename);
  fileref.setAttribute("key", key);
  if ( callback!=undefined )
    fileref.onload = callback;//setTimeout( callback, 10000 );
  var head = document.head;
  if ( head==undefined )  // this is for IE
  {
    head = document.getElementsByTagName('head')[0];
    head.appendChild(fileref);
  }
  else
  {
    if ( prevscript==0 )
      head.appendChild(fileref);
    else
      head.replaceChild(prevscript, fileref);
  }
}
WindowEventManager.getOffset = function( element )
{
  var position = [0, 0];
  while( element && !isNaN( element.offsetLeft ) && !isNaN( element.offsetTop ) ) {
      position[0] += element.offsetLeft - element.scrollLeft;
      position[1] += element.offsetTop - element.scrollTop;
      element = element.offsetParent;
  }
  return position;
}

module.exports.WindowEventManager = WindowEventManager;

