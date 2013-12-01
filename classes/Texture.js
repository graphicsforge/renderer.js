

function Texture(gl, url, callback)
{
  this.texture = null;
  this.image = new Image();
  this.aspect = 1;
  var self = this;
  this.image.addEventListener('load', function(){
    self.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, self.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, self.image);
    self.aspect = self.image.width/self.image.height;
    if ( callback!==undefined && typeof(callback)=='function' )
      callback(self);
  }, false );
  this.image.src = url;
}

Texture.prototype.bind = function(gl)
{
  if ( !this.texture )
    return;
  gl.bindTexture(gl.TEXTURE_2D, this.texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

Texture.prototype.getImageAspect = function()
{
  return this.image.width/this.image.height;
}


module.exports.Texture = Texture;
