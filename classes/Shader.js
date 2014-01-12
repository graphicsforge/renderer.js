
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
  this.prMatrix = gl.getUniformLocation(this.program, "prMatrix");
  this.mvMatrix = gl.getUniformLocation(this.program, "mvMatrix");
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

// bind shader and set up uniforms and attributes
Shader.prototype.bind = function( args )
{
  args.gl.uniformMatrix4fv( this.prMatrix, false, new Float32Array(args.prMatrix.getAsArray()) );
  args.gl.uniformMatrix4fv( this.mvMatrix, false, new Float32Array(args.mvMatrix.getAsArray()) );
}

Shader.prototype.drawModel = function( renderer, model )
{
  var gl = renderer.gl;

  if ( !model.isInited() )
    return;

  gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);
    // TODO check which vertex attributes the model has and at what offset
    gl.vertexAttribPointer(this.posLoc,  3, gl.FLOAT, false, 32,  0);
    gl.vertexAttribPointer(this.normLoc, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(this.texLoc,  2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
      gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

module.exports.Shader = Shader;

