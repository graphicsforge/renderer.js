
function Shader( gl, args )
{
  this.vshader = null;
  this.fshader = null;
  this.source = "";

  // if we got the id of a DOM element
  if ( typeof(args.vertex_element_id)=='string' )
    this.vshader = Shader.loadFromDOM(gl, args.vertex_element_id);
  if ( typeof(args.fragment_element_id)=='string' )
    this.fshader = Shader.loadFromDOM(gl, args.fragment_element_id);

  if ( !this.vshader || !this.fshader )
    console.log('Renderer::Shader ERROR: could not load shaders');

  this.program = gl.createProgram();
  gl.attachShader(this.program, this.vshader);
  gl.attachShader(this.program, this.fshader);
  gl.linkProgram(this.program);
  gl.useProgram(this.program);

  // TODO autoget args
  this.posLoc = gl.getAttribLocation(this.program, "aPos");
  gl.enableVertexAttribArray( this.posLoc );
  this.normLoc = gl.getAttribLocation(this.program, "aNorm");
  gl.enableVertexAttribArray( this.normLoc );
  this.texLoc = gl.getAttribLocation(this.program, "aTexCoord");
  gl.enableVertexAttribArray( this.texLoc );
  gl.uniform1f(gl.getUniformLocation(this.program, "alpha"), 1);
  // initialize shader transform variables
  this.vs_basic_prMatrix = gl.getUniformLocation(this.program, "prMatrix");
  this.vs_basic_mvMatrix = gl.getUniformLocation(this.program, "mvMatrix");
}

Shader.loadFromDOM = function( gl, element_id )
{
  // extract source from text nodes
  var shaderScript = document.getElementById ( element_id );
  var k = shaderScript.firstChild;
  var source = ""
  while ( k ) {
    if ( k.nodeType == 3 )
      source += k.textContent;
    k = k.nextSibling;
  }
  // get shader type from attribute
  if ( shaderScript.type == "x-shader/x-fragment" )
    var shader = gl.createShader( gl.FRAGMENT_SHADER );
  else if ( shaderScript.type == "x-shader/x-vertex" )
    var shader = gl.createShader( gl.VERTEX_SHADER );
  else
  {
    console.log("Renderer::Shader ERROR unknown type for \""+element_id+"\", type must be (vertex|fragment)");
    return null;
  }

console.log("created shader "+shaderScript.type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  // check status
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
    console.log("Renderer::Shader ERROR compiling:"+element_id+" "+gl.getShaderInfoLog(shader));
  return shader;
}

Shader.prototype.getShader = function( gl, id )
{
  return this.shader;
}

module.exports.Shader = Shader;

