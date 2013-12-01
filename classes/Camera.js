
/********
// Camera class
// use this to track the projection matrix
********/
function Camera(vfov)
{
  this.vfov = 45;
  if ( vfov!=null )
    this.vfov = vfov;
  this.pixelAspectRatio = 1.0;
  this.frustrumNear = 0.1;
  this.frustrumFar = 100;
  this.extrinsic = new CanvasMatrix4();
  this.extrinsic.translate( 0, 0, -5 );
  this.target = [0, 0, 0];

  // initial orientation
  var rotationmat = new CanvasMatrix4();
  rotationmat.makeIdentity();
  rotationmat.rotate( 180, 1, 0, 0 );
  this.extrinsic.multLeft(rotationmat);
}

// TODO drop this into a CameraControl class
Camera.prototype.bindDefaultControls = function(windowEventManager)
{
  // attempt to apply ui listeners
  if ( typeof(windowEventManager)!='undefined' )
  {
    var self = this;
    windowEventManager.addListener('mousewheel', function(event) {
      var scale = .2;
      scale *= (event.detail<0 || event.wheelDelta>0) ? 1 : -1;
      self.extrinsic.translate( 0, 0, scale );
    });
    windowEventManager.addListener('mousemove', function(event) {
      // if we've ever seen pointerLock, demand it
      if ( windowEventManager.pointerLock )
        self.seenPointerLock = true;
      if ( !windowEventManager.pointerLock && self.seenPointerLock )
        return;
      // odd but where selectors look like a move
      if ( event.target.tagName=="HTML" )
        return;
      // shift for translate
      if ( windowEventManager.keyboard[16] )
      {
        if ( windowEventManager.mouseButton[0] )
        {
          var scale = 0.005;
          self.extrinsic.translate( scale*(windowEventManager.mouseDiff[0]), -scale*(windowEventManager.mouseDiff[1]), 0 );
        }
        else if ( windowEventManager.mouseButton[2] )
        {
          var scale = 0.01;
          self.extrinsic.translate( 0, 0, -scale*(windowEventManager.mouseDiff[1]) );
        }
      }
      // alt for rotate
      if ( windowEventManager.keyboard[18] )
      {
        var scale = -0.2;
        if ( windowEventManager.mouseButton[0] )
        {
          var rotation = [scale*(windowEventManager.mouseDiff[1]), scale*(windowEventManager.mouseDiff[0]), 0];
          self.rotate( rotation );
        }
        else if ( windowEventManager.mouseButton[2] )
        {
          var rotation = [0, 0, scale*(windowEventManager.mouseDiff[0])];
          self.rotate( rotation );
        }
      }
      // otherwise turntable around target
      if ( !windowEventManager.keyboard[16] && !windowEventManager.keyboard[18] )
      {
        if ( windowEventManager.mouseButton[0] )
        {
          var scale = 1;
          self.updateInfo();
          var cameraUp = self.info['up'];
          var rotationmat = new CanvasMatrix4();
          rotationmat.rotate( scale*(windowEventManager.mouseDiff[0]), cameraUp[0], cameraUp[1], cameraUp[2] );
          self.extrinsic.multLeft(rotationmat);
          var cameraRight = HomoVect.cross( self.info['up'], self.info['position'] );
          rotationmat.makeIdentity();
          rotationmat.rotate( scale*(windowEventManager.mouseDiff[1]), cameraRight[0], cameraRight[1], cameraRight[2] );
          self.extrinsic.multLeft(rotationmat);
        }
      }
    });
  }

}

Camera.prototype.updateInfo = function()
{
  this.info = [];
  var translate = [this.extrinsic.m30, this.extrinsic.m31, this.extrinsic.m32, 1];
  var rotation = new CanvasMatrix4(this.extrinsic);
  rotation.m30=0; rotation.m31=0; rotation.m32=0;
  rotation.transpose();
  translate = rotation.apply(translate);
  this.info['position'] = [-translate[0], -translate[1], -translate[2], 1];
  this.info['up'] = rotation.apply([0, 1, 0]);
}

Camera.prototype.rotate = function( relativeRotation )
{
  var pitchmat = new CanvasMatrix4();
  pitchmat.rotate( relativeRotation[0], 1, 0, 0 );
  var yawmat = new CanvasMatrix4();
  yawmat.rotate( relativeRotation[1], 0, 1, 0 );
  var rollmat = new CanvasMatrix4();
  rollmat.rotate( relativeRotation[2], 0, 0, 1 );
  this.extrinsic.multRight(pitchmat);
  this.extrinsic.multRight(yawmat);
  this.extrinsic.multRight(rollmat);
}

Camera.prototype.translate = function ( relativeDisplacement )
{
  this.extrinsic.translate( relativeDisplacement[0], relativeDisplacement[1], relativeDisplacement[2]);
}


/********
// CanvasMatrix4 class
// 4x4 homogeneous matrix
********/
CanvasMatrix4=function(m)
{
  if(typeof m=='object')
  {
    if("length"in m&&m.length>=16)
    {
      this.load(m[0],m[1],m[2],m[3],m[4],m[5],m[6],m[7],m[8],m[9],m[10],m[11],m[12],m[13],m[14],m[15]);
      return;
    }
    else if(m instanceof CanvasMatrix4)
    {
      this.load(m);
      return;
    }
  }
  this.makeIdentity()
};

CanvasMatrix4.prototype.load=function()
{
  if(arguments.length==1&&typeof arguments[0]=='object')
  {
    var matrix=arguments[0];
    if("length"in matrix&&matrix.length==16)
    {
      this.m00=matrix[0];this.m01=matrix[1];this.m02=matrix[2];this.m03=matrix[3];this.m10=matrix[4];this.m11=matrix[5];this.m12=matrix[6];this.m13=matrix[7];this.m20=matrix[8];this.m21=matrix[9];this.m22=matrix[10];this.m23=matrix[11];this.m30=matrix[12];this.m31=matrix[13];this.m32=matrix[14];this.m33=matrix[15];
      return;
    }
    if(arguments[0]instanceof CanvasMatrix4)
    {
      this.m00=matrix.m00;this.m01=matrix.m01;this.m02=matrix.m02;this.m03=matrix.m03;this.m10=matrix.m10;this.m11=matrix.m11;this.m12=matrix.m12;this.m13=matrix.m13;this.m20=matrix.m20;this.m21=matrix.m21;this.m22=matrix.m22;this.m23=matrix.m23;this.m30=matrix.m30;this.m31=matrix.m31;this.m32=matrix.m32;this.m33=matrix.m33;
      return;
    }
  }
  this.makeIdentity();
};

CanvasMatrix4.prototype.getAsArray=function()
{
  return[this.m00,this.m01,this.m02,this.m03,this.m10,this.m11,this.m12,this.m13,this.m20,this.m21,this.m22,this.m23,this.m30,this.m31,this.m32,this.m33]
};

CanvasMatrix4.prototype.getAsWebGLFloatArray=function()
{
  return new WebGLFloatArray(this.getAsArray())
};

CanvasMatrix4.prototype.makeIdentity=function()
{
  this.m00=1;this.m01=0;this.m02=0;this.m03=0;this.m10=0;this.m11=1;this.m12=0;this.m13=0;this.m20=0;this.m21=0;this.m22=1;this.m23=0;this.m30=0;this.m31=0;this.m32=0;this.m33=1
};

CanvasMatrix4.prototype.transpose=function()
{
  var tmp=this.m01;this.m01=this.m10;this.m10=tmp;tmp=this.m02;this.m02=this.m20;this.m20=tmp;tmp=this.m03;this.m03=this.m30;this.m30=tmp;tmp=this.m12;this.m12=this.m21;this.m21=tmp;tmp=this.m13;this.m13=this.m31;this.m31=tmp;tmp=this.m23;this.m23=this.m32;this.m32=tmp
};

CanvasMatrix4.prototype.invert=function()
{
  var det=this._determinant4x4();
  if(Math.abs(det)<1e-8)
    return null;
  this._makeAdjoint();this.m00/=det;this.m01/=det;this.m02/=det;this.m03/=det;this.m10/=det;this.m11/=det;this.m12/=det;this.m13/=det;this.m20/=det;this.m21/=det;this.m22/=det;this.m23/=det;this.m30/=det;this.m31/=det;this.m32/=det;this.m33/=det
};

CanvasMatrix4.prototype.translate=function(x,y,z)
{
  if(x==undefined)x=0;if(y==undefined)y=0;if(z==undefined)z=0;var matrix=new CanvasMatrix4();matrix.m30=x;matrix.m31=y;matrix.m32=z;this.multRight(matrix)
};

CanvasMatrix4.prototype.scale=function(x,y,z)
{
  if(x==undefined)x=1;if(y==undefined)y=1;if(z==undefined)z=1;
  var matrix=new CanvasMatrix4();matrix.m00=x;matrix.m11=y;matrix.m22=z;
  this.multRight(matrix)
};

CanvasMatrix4.prototype.rotate=function(angle,x,y,z)
{
  angle=angle/180*Math.PI;angle/=2;var sinA=Math.sin(angle);var cosA=Math.cos(angle);var sinA2=sinA*sinA;var length=Math.sqrt(x*x+y*y+z*z);
  if(length==0) {
    x=0;y=0;z=1;
  }
  else if(length!=1) {
    x/=length;y/=length;z/=length;
  }
  var mat=new CanvasMatrix4();
  if(x==1&&y==0&&z==0) {
    mat.m00=1;mat.m01=0;mat.m02=0;mat.m10=0;mat.m11=1-2*sinA2;mat.m12=2*sinA*cosA;mat.m20=0;mat.m21=-2*sinA*cosA;mat.m22=1-2*sinA2;mat.m03=mat.m13=mat.m23=0;mat.m30=mat.m31=mat.m32=0;mat.m33=1;
  }
  else if(x==0&&y==1&&z==0) {
    mat.m00=1-2*sinA2;mat.m01=0;mat.m02=-2*sinA*cosA;mat.m10=0;mat.m11=1;mat.m12=0;mat.m20=2*sinA*cosA;mat.m21=0;mat.m22=1-2*sinA2;mat.m03=mat.m13=mat.m23=0;mat.m30=mat.m31=mat.m32=0;mat.m33=1;
  }
  else if(x==0&&y==0&&z==1) {
    mat.m00=1-2*sinA2;mat.m01=2*sinA*cosA;mat.m02=0;mat.m10=-2*sinA*cosA;mat.m11=1-2*sinA2;mat.m12=0;mat.m20=0;mat.m21=0;mat.m22=1;mat.m03=mat.m13=mat.m23=0;mat.m30=mat.m31=mat.m32=0;mat.m33=1;
  }
  else {
    var x2=x*x;var y2=y*y;var z2=z*z;mat.m00=1-2*(y2+z2)*sinA2;mat.m01=2*(x*y*sinA2+z*sinA*cosA);mat.m02=2*(x*z*sinA2-y*sinA*cosA);mat.m10=2*(y*x*sinA2-z*sinA*cosA);mat.m11=1-2*(z2+x2)*sinA2;mat.m12=2*(y*z*sinA2+x*sinA*cosA);mat.m20=2*(z*x*sinA2+y*sinA*cosA);mat.m21=2*(z*y*sinA2-x*sinA*cosA);mat.m22=1-2*(x2+y2)*sinA2;mat.m03=mat.m13=mat.m23=0;mat.m30=mat.m31=mat.m32=0;mat.m33=1;
  }
  this.multRight(mat);
};

CanvasMatrix4.prototype.multRight=function(mat)
{
var m00=(this.m00*mat.m00+this.m01*mat.m10+this.m02*mat.m20+this.m03*mat.m30);var m01=(this.m00*mat.m01+this.m01*mat.m11+this.m02*mat.m21+this.m03*mat.m31);var m02=(this.m00*mat.m02+this.m01*mat.m12+this.m02*mat.m22+this.m03*mat.m32);var m03=(this.m00*mat.m03+this.m01*mat.m13+this.m02*mat.m23+this.m03*mat.m33);var m10=(this.m10*mat.m00+this.m11*mat.m10+this.m12*mat.m20+this.m13*mat.m30);var m11=(this.m10*mat.m01+this.m11*mat.m11+this.m12*mat.m21+this.m13*mat.m31);var m12=(this.m10*mat.m02+this.m11*mat.m12+this.m12*mat.m22+this.m13*mat.m32);var m13=(this.m10*mat.m03+this.m11*mat.m13+this.m12*mat.m23+this.m13*mat.m33);var m20=(this.m20*mat.m00+this.m21*mat.m10+this.m22*mat.m20+this.m23*mat.m30);var m21=(this.m20*mat.m01+this.m21*mat.m11+this.m22*mat.m21+this.m23*mat.m31);var m22=(this.m20*mat.m02+this.m21*mat.m12+this.m22*mat.m22+this.m23*mat.m32);var m23=(this.m20*mat.m03+this.m21*mat.m13+this.m22*mat.m23+this.m23*mat.m33);var m30=(this.m30*mat.m00+this.m31*mat.m10+this.m32*mat.m20+this.m33*mat.m30);var m31=(this.m30*mat.m01+this.m31*mat.m11+this.m32*mat.m21+this.m33*mat.m31);var m32=(this.m30*mat.m02+this.m31*mat.m12+this.m32*mat.m22+this.m33*mat.m32);var m33=(this.m30*mat.m03+this.m31*mat.m13+this.m32*mat.m23+this.m33*mat.m33);this.m00=m00;this.m01=m01;this.m02=m02;this.m03=m03;this.m10=m10;this.m11=m11;this.m12=m12;this.m13=m13;this.m20=m20;this.m21=m21;this.m22=m22;this.m23=m23;this.m30=m30;this.m31=m31;this.m32=m32;this.m33=m33
};

CanvasMatrix4.prototype.multLeft=function(mat)
{
  var m00=(mat.m00*this.m00+mat.m01*this.m10+mat.m02*this.m20+mat.m03*this.m30);var m01=(mat.m00*this.m01+mat.m01*this.m11+mat.m02*this.m21+mat.m03*this.m31);var m02=(mat.m00*this.m02+mat.m01*this.m12+mat.m02*this.m22+mat.m03*this.m32);var m03=(mat.m00*this.m03+mat.m01*this.m13+mat.m02*this.m23+mat.m03*this.m33);var m10=(mat.m10*this.m00+mat.m11*this.m10+mat.m12*this.m20+mat.m13*this.m30);var m11=(mat.m10*this.m01+mat.m11*this.m11+mat.m12*this.m21+mat.m13*this.m31);var m12=(mat.m10*this.m02+mat.m11*this.m12+mat.m12*this.m22+mat.m13*this.m32);var m13=(mat.m10*this.m03+mat.m11*this.m13+mat.m12*this.m23+mat.m13*this.m33);var m20=(mat.m20*this.m00+mat.m21*this.m10+mat.m22*this.m20+mat.m23*this.m30);var m21=(mat.m20*this.m01+mat.m21*this.m11+mat.m22*this.m21+mat.m23*this.m31);var m22=(mat.m20*this.m02+mat.m21*this.m12+mat.m22*this.m22+mat.m23*this.m32);var m23=(mat.m20*this.m03+mat.m21*this.m13+mat.m22*this.m23+mat.m23*this.m33);var m30=(mat.m30*this.m00+mat.m31*this.m10+mat.m32*this.m20+mat.m33*this.m30);var m31=(mat.m30*this.m01+mat.m31*this.m11+mat.m32*this.m21+mat.m33*this.m31);var m32=(mat.m30*this.m02+mat.m31*this.m12+mat.m32*this.m22+mat.m33*this.m32);var m33=(mat.m30*this.m03+mat.m31*this.m13+mat.m32*this.m23+mat.m33*this.m33);this.m00=m00;this.m01=m01;this.m02=m02;this.m03=m03;this.m10=m10;this.m11=m11;this.m12=m12;this.m13=m13;this.m20=m20;this.m21=m21;this.m22=m22;this.m23=m23;this.m30=m30;this.m31=m31;this.m32=m32;this.m33=m33
};

CanvasMatrix4.prototype.ortho=function(left,right,bottom,top,near,far)
{
  var tx=(left+right)/(left-right);var ty=(top+bottom)/(bottom-top);var tz=(far+near)/(near-far);var matrix=new CanvasMatrix4();matrix.m00=2/(right-left);matrix.m01=0;matrix.m02=0;matrix.m03=0;matrix.m10=0;matrix.m11=2/(top-bottom);matrix.m12=0;matrix.m13=0;matrix.m20=0;matrix.m21=0;matrix.m22=-2/(far-near);matrix.m23=0;matrix.m30=tx;matrix.m31=ty;matrix.m32=tz;matrix.m33=1;this.multRight(matrix)
};

CanvasMatrix4.prototype.frustum=function(left,right,bottom,top,near,far)
{
  var matrix=new CanvasMatrix4();var A=(right+left)/(right-left);var B=(top+bottom)/(top-bottom);var C=-(far+near)/(far-near);var D=-(2*far*near)/(far-near);matrix.m00=(2*near)/(right-left);matrix.m01=0;matrix.m02=0;matrix.m03=0;matrix.m10=0;matrix.m11=2*near/(top-bottom);matrix.m12=0;matrix.m13=0;matrix.m20=A;matrix.m21=B;matrix.m22=C;matrix.m23=-1;matrix.m30=0;matrix.m31=0;matrix.m32=D;matrix.m33=0;this.multRight(matrix)
};

CanvasMatrix4.prototype.perspective=function(fovy,aspect,zNear,zFar)
{
  var top=Math.tan(fovy*Math.PI/360)*zNear;var bottom=-top;var left=aspect*bottom;var right=aspect*top;this.frustum(left,right,bottom,top,zNear,zFar)
};

CanvasMatrix4.prototype.lookat=function(eyex,eyey,eyez,centerx,centery,centerz,upx,upy,upz)
{
  var matrix=new CanvasMatrix4();var zx=eyex-centerx;var zy=eyey-centery;var zz=eyez-centerz;var mag=Math.sqrt(zx*zx+zy*zy+zz*zz);
  if(mag)
    zx/=mag;zy/=mag;zz/=mag
  var yx=upx;var yy=upy;var yz=upz;xx=yy*zz-yz*zy;xy=-yx*zz+yz*zx;xz=yx*zy-yy*zx;yx=zy*xz-zz*xy;yy=-zx*xz+zz*xx;yx=zx*xy-zy*xx;mag=Math.sqrt(xx*xx+xy*xy+xz*xz);
  if(mag)
    xx/=mag;xy/=mag;xz/=mag
  mag=Math.sqrt(yx*yx+yy*yy+yz*yz);
  if(mag)
    yx/=mag;yy/=mag;yz/=mag
  matrix.m00=xx;matrix.m01=xy;matrix.m02=xz;matrix.m03=0;matrix.m10=yx;matrix.m11=yy;matrix.m12=yz;matrix.m13=0;matrix.m20=zx;matrix.m21=zy;matrix.m22=zz;matrix.m23=0;matrix.m30=0;matrix.m31=0;matrix.m32=0;matrix.m33=1;matrix.translate(-eyex,-eyey,-eyez);this.multRight(matrix)
};

CanvasMatrix4.prototype.apply=function(vector)
{
  if(vector[0]==undefined)vector[0]=0;
  if(vector[1]==undefined)vector[1]=0;
  if(vector[2]==undefined)vector[2]=0;
  if(vector[3]==undefined)vector[3]=1;
  var output=[];
  output[0]=this.m00*vector[0]+this.m10*vector[1]+this.m20*vector[2]+this.m30*vector[3];
  output[1]=this.m01*vector[0]+this.m11*vector[1]+this.m21*vector[2]+this.m31*vector[3];
  output[2]=this.m02*vector[0]+this.m12*vector[1]+this.m22*vector[2]+this.m32*vector[3];
  output[3]=this.m03*vector[0]+this.m13*vector[1]+this.m23*vector[2]+this.m33*vector[3];
  return output;
}
CanvasMatrix4.prototype._determinant2x2=function(a,b,c,d)
{
  return a*d-b*c
};

CanvasMatrix4.prototype._determinant3x3=function(a1,a2,a3,b1,b2,b3,c1,c2,c3)
{
  return a1*this._determinant2x2(b2,b3,c2,c3)-b1*this._determinant2x2(a2,a3,c2,c3)+c1*this._determinant2x2(a2,a3,b2,b3)
};

CanvasMatrix4.prototype._determinant4x4=function()
{
  var a1=this.m00;var b1=this.m01;var c1=this.m02;var d1=this.m03;var a2=this.m10;var b2=this.m11;var c2=this.m12;var d2=this.m13;var a3=this.m20;var b3=this.m21;var c3=this.m22;var d3=this.m23;var a4=this.m30;var b4=this.m31;var c4=this.m32;var d4=this.m33;return a1*this._determinant3x3(b2,b3,b4,c2,c3,c4,d2,d3,d4)-b1*this._determinant3x3(a2,a3,a4,c2,c3,c4,d2,d3,d4)+c1*this._determinant3x3(a2,a3,a4,b2,b3,b4,d2,d3,d4)-d1*this._determinant3x3(a2,a3,a4,b2,b3,b4,c2,c3,c4)
};

CanvasMatrix4.prototype._makeAdjoint=function()
{
  var a1=this.m00;var b1=this.m01;var c1=this.m02;var d1=this.m03;var a2=this.m10;var b2=this.m11;var c2=this.m12;var d2=this.m13;var a3=this.m20;var b3=this.m21;var c3=this.m22;var d3=this.m23;var a4=this.m30;var b4=this.m31;var c4=this.m32;var d4=this.m33;this.m00=this._determinant3x3(b2,b3,b4,c2,c3,c4,d2,d3,d4);this.m10=-this._determinant3x3(a2,a3,a4,c2,c3,c4,d2,d3,d4);this.m20=this._determinant3x3(a2,a3,a4,b2,b3,b4,d2,d3,d4);this.m30=-this._determinant3x3(a2,a3,a4,b2,b3,b4,c2,c3,c4);this.m01=-this._determinant3x3(b1,b3,b4,c1,c3,c4,d1,d3,d4);this.m11=this._determinant3x3(a1,a3,a4,c1,c3,c4,d1,d3,d4);this.m21=-this._determinant3x3(a1,a3,a4,b1,b3,b4,d1,d3,d4);this.m31=this._determinant3x3(a1,a3,a4,b1,b3,b4,c1,c3,c4);this.m02=this._determinant3x3(b1,b2,b4,c1,c2,c4,d1,d2,d4);this.m12=-this._determinant3x3(a1,a2,a4,c1,c2,c4,d1,d2,d4);this.m22=this._determinant3x3(a1,a2,a4,b1,b2,b4,d1,d2,d4);this.m32=-this._determinant3x3(a1,a2,a4,b1,b2,b4,c1,c2,c4);this.m03=-this._determinant3x3(b1,b2,b3,c1,c2,c3,d1,d2,d3);this.m13=this._determinant3x3(a1,a2,a3,c1,c2,c3,d1,d2,d3);this.m23=-this._determinant3x3(a1,a2,a3,b1,b2,b3,d1,d2,d3);this.m33=this._determinant3x3(a1,a2,a3,b1,b2,b3,c1,c2,c3)
};

// misc helper functions
HomoVect = function(){}
HomoVect.cross = function(a, b) {
    var ret = [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0], 1];
  return ret;
};


module.exports.Camera = Camera;
module.exports.CanvasMatrix4 = CanvasMatrix4;
