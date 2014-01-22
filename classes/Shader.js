
/**
 * class ShaderVariable
 *
 * tracks a variable (attribute|uniform) used by a shader and has helper functions
**/
function ShaderVariable(values)
{
  this.index = null;
  this.name = values.name;
  this.type = values.type;
  this.datatype = "GL_FLOAT";
}
// function to lookup the size per shader type
ShaderVariable.prototype.getSize = function()
{
  var size = 1;
  this.type.replace(/mat([0-9]+)/, function( match, num ) {
    size = num*num;
    return match;
  });
  this.type.replace(/vec([0-9]+)/, function( match, num ) {
    size = num;
    return match;
  });
  this.type.replace(/float/, function( match, num ) {
    size = 1;
    return match;
  });
  return size;
}

function Shader( gl, args )
{
  this.vshader = null;
  this.fshader = null;
  this.source = "";
  this.attributes = [];
  this.uniforms = [];

  // if we got the id of a DOM element
  if ( typeof(args.vertex_element_id)=='string' )
    this.vshader = this.loadFromDOM(gl, args.vertex_element_id);
  if ( typeof(args.fragment_element_id)=='string' )
    this.fshader = this.loadFromDOM(gl, args.fragment_element_id);

  if ( !this.vshader || !this.fshader )
    console.log('Renderer::Shader ERROR: could not load shaders');

  this.program = gl.createProgram();
  gl.attachShader(this.program, this.vshader);
  gl.attachShader(this.program, this.fshader);
  gl.linkProgram(this.program);
  gl.useProgram(this.program);

  // enable any attributes we found
  for ( var i=0; i<this.attributes.length; i++ )
  {
    this.attributes[i].index = gl.getAttribLocation(this.program, this.attributes[i].name);
    gl.enableVertexAttribArray( this.attributes[i].index );
  }
  // initialize shader transform variables
  this.prMatrix = gl.getUniformLocation(this.program, "prMatrix");
  this.mvMatrix = gl.getUniformLocation(this.program, "mvMatrix");
  this.alpha = gl.getUniformLocation(this.program, "alpha");

  this.resolution = gl.getUniformLocation(this.program, "iResolution");
  gl.uniform3f( this.resolution, 500, 500, 1 );
}

Shader.prototype.loadFromDOM = function( gl, element_id )
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
  if ( shaderScript.type.match(/(fragment|pixel)/) )
    var shader = gl.createShader( gl.FRAGMENT_SHADER );
  else if ( shaderScript.type.match(/vertex/) )
    var shader = gl.createShader( gl.VERTEX_SHADER );
  else
  {
    console.log("Renderer::Shader ERROR unknown type for \""+element_id+"\", type must be (vertex|fragment)");
    return null;
  }
  console.log("creating shader "+shaderScript.type);
  // compile shader
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  // check status
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) == 0)
    console.log("Renderer::Shader ERROR compiling:"+element_id+" "+gl.getShaderInfoLog(shader));

  // extract attributes and uniforms
  var self = this;
  source.replace(/\n[ ]+uniform[ ]+([^ ]+)[ ]+([^ ;]+)/g, function( match, type, name, index ) {
    self.uniforms.push( new ShaderVariable({'name':name, 'type':type}) );
    return match;
  });
  source.replace(/\n[ ]+attribute[ ]+([^ ]+)[ ]+([^ ;]+)/g, function( match, type, name, index ) {
    self.attributes.push( new ShaderVariable({'name':name, 'type':type}) );
    return match;
  });

  return shader;
}

// bind shader and set up uniforms and attributes
Shader.prototype.bind = function( args )
{
  var gl = args.gl;
  gl.useProgram(this.program);

  gl.uniformMatrix4fv( this.prMatrix, false, new Float32Array(args.prMatrix.getAsArray()) );
  gl.uniformMatrix4fv( this.mvMatrix, false, new Float32Array(args.mvMatrix.getAsArray()) );
  gl.uniform1f( this.alpha, 1 );
}

Shader.prototype.drawModel = function( renderer, model )
{
  if ( typeof(model)=='undefined' || !model.isInited() )
    return;

  var gl = renderer.gl;

  gl.bindBuffer(gl.ARRAY_BUFFER, model.vbo);

    // assign vertex attributes ( I hope your shader attribute definitions match your vbo packing )
    var offset = 0;
    this.stride = 32;
    for ( var i=0; i<this.attributes.length; i++ )
    {
      var size = this.attributes[i].getSize();
      var normalized = false;
      gl.vertexAttribPointer(this.attributes[i].index,  size, gl.FLOAT, normalized, this.stride, offset);
      offset += size*4;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.ibo);
      gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

module.exports.Shader = Shader;

