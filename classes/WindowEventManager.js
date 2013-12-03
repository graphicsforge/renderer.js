
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
  this.mousedownPos = [0, 0];
  this.mouseDiff = [0, 0];
  this.mouseLastClickTime = new Date();
  this.pointerLock = false;
}

/********
// UI handler functions
// The update the UI state, then emit() the event for any listener
********/
WindowEventManager.prototype.mouseup = function(event) {
  this.mouseButton[event.button] = false;
  this.mousePos[0] = event.clientX;
  this.mousePos[1] = event.clientY;
  this.emit( "mouseup", event );
}
WindowEventManager.prototype.mousedown = function(event) {
  this.mouseButton[event.button] = true;
  this.mousePos[0] = event.clientX;
  this.mousePos[1] = event.clientY;
  this.mousedownPos = this.mousePos.slice();
  this.emit( "mousedown", event );
  this.mouseLastClickTime = new Date();
}
WindowEventManager.prototype.mousemove = function(event) {
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
  this.emit( "mousemove", event );
}
WindowEventManager.prototype.keyup = function(event) {
  this.keyboard[event.which] = false;
  // deal with combinations of shift+alt keys
  if ( event.which==224 )
    this.keyboard[18] = false;
  this.emit( "keyup", event );
}
WindowEventManager.prototype.keydown = function(event) {
  this.keyboard[event.which] = true;
  // deal with combinations of shift+alt keys
  if ( event.which==224 )
    this.keyboard[18] = true;
  this.emit( "keydown", event );
}
WindowEventManager.prototype.resize = function(event)
{
  this.emit( "resize", event );
}
WindowEventManager.prototype.load = function(event)
{
  this.emit( "load", event );
}
WindowEventManager.prototype.mousewheel = function(event)
{
  this.emit( "mousewheel", event );
}

/********
// start listening on UI events
// The manager won't be active until this is called
********/
WindowEventManager.prototype.bindUIListeners = function()
{
  var self = this;
  window.onkeydown=function(event){self.keydown(event);};
  window.onkeyup=function(event){self.keyup(event);};
  window.onmousedown=function(event){self.mousedown(event);};
  window.onmouseup=function(event){self.mouseup(event);};
  window.onmousemove=function(event){self.mousemove( event);};
  window.onmousewheel=function(event){self.mousewheel(event);};
  window.onresize=function(event){self.resize(event);};
  window.onload=function(event){self.load(event);};
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

