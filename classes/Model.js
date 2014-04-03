

function Model( gl, json )
{
  this.vertex_stride = 8; // values per vertex, defaults to 3 pos, 3 normal, 2 tex
  this.csg_mode = "union";

  if ( typeof(json.vertex_stride)!='undefined' )
    this.vertex_stride = json.vertex_stride;
  if ( typeof(json.type)!='undefined' )
    this.csg_mode = json.type;

  this.vertices = new Float32Array(Math.ceil(json.vertices.length/3*this.vertex_stride));
  var vptr = 0;
  for ( var i=0; i<json.vertices.length; i++ )
  {
    this.vertices[vptr++] = (json.vertices[i]);
    if ( json.stride==3 )
      if ( !((i+1)%3) )
      {
        for ( var j=0; j<5; j++ )
          this.vertices[vptr++] = this.csg_mode=="intersection"?0.5:1;
      }
  }
  this.indices = new Uint16Array(json.indices.length)
  for ( var i=0; i<json.indices.length; i++ )
    this.indices[i] = json.indices[i];

  this.numVertexes = json.indices.length/this.vertex_stride;
  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);

  this.ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

}

Model.prototype.isInited = function()
{
  return this.numVertexes>0;
}

Model.prototype.getCoord = function(index)
{
  if ( !this.isInited() )
    return undefined;
  var pos = [this.vertices[index*this.vertex_stride],this.vertices[index*this.vertex_stride+1],this.vertices[index*this.vertex_stride+2],1];
  return pos;
}

// let shader handle drawing, it needs more setup anyways
Model.prototype.draw = function(renderer, shader)
{
  shader.drawModel( renderer, this );
}



module.exports.Model = Model;
