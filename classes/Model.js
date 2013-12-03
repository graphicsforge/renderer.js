

function Model( gl, json )
{
  this.vertex_stride = 8; // values per vertex, defaults to 3 pos, 3 normal, 2 tex

  if ( typeof(json.vertex_stride)!='undefined' )
    this.vertex_stride = json.vertex_stride;

  this.vertices = new Float32Array(json.vertices.length/3*this.vertex_stride);
  var vptr = 0;
  for ( var i=0; i<json.vertices.length; i++ )
  {
    this.vertices[vptr++] = (json.vertices[i]);
    if ( !((i+1)%3) )
    {
      for ( var j=0; j<5; j++ )
        this.vertices[vptr++] = 1;
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

// TODO bind shaders into model, hardcoding vert attribs for now
Model.prototype.draw = function(gl, posLoc, normLoc, texLoc)
{
  if ( !this.isInited() )
    return;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.vertexAttribPointer(posLoc,  3, gl.FLOAT, false, 32,  0);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 32, 12);
    gl.vertexAttribPointer(texLoc,  2, gl.FLOAT, false, 32, 24);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
      gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
}




module.exports.Model = Model;
