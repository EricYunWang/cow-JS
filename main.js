var gl;
var canvas;
var program;
var cow = [];

var rLight = 0;
var newLight = 0;
var pLight = 180;
var newPLight = 0;
var pLightDir = 0.0;
var RPLight = false;
var panLight = false;

var lightPosition = vec4(-1.5, 2.0, 4.0, 1.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

window.onload = function init() {

  canvas = document.getElementById("gl-canvas");
  
  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    console.log('WebGL not supported');
  }
  if (!gl) {
		alert('Your browser does not support WebGL');
	}

  gl.viewport(100, 100, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);

  program = initShaders(gl, "vertex-shader", "fragment-shader");

  addListeners();
  addBuffers();
  render();

};


// render function to handle movement and lighting
function render() {
  updateLight();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  var transXY = translate(tranX.value, tranY.value, 0);
  var transZ = scalem(tranZ.value, tranZ.value, tranZ.value);
  var xRotation = xRotFunc(rotationX.value);
  var yRotation = yRotFunc(rotationY.value);
  var zRotation = zRotFunc(rotationZ.value);

  var mat = mult(transXY, mult(transZ, mult(yRotation, xRotation, zRotation)));

  var position = gl.getUniformLocation(program, "mat");
  gl.uniformMatrix4fv(position, false, flatten(mat));

  // Lighting direction may be adjusted here.
  const rLightdir1 = Math.cos((Math.PI * rLight * 10) / 180.0);
  const rLightdir2 = Math.sin((Math.PI * rLight * 10) / 180.0);
  const pLightDir1 = Math.cos((Math.PI * 10 * 10) / 30.0);
  const pLightDir2 = Math.sin((Math.PI * pLight * 10) / 360.0);

  //https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html
  gl.uniform3f(gl.getUniformLocation(program, "rLightDirection"), rLightdir1, rLightdir2, 0.0);
  gl.uniform3f(gl.getUniformLocation(program, "panning_spotlightDir"), pLightDir1, pLightDir, pLightDir2);
  gl.uniform3f(gl.getUniformLocation(program, "pLightColor"), 0.5,1.0,0.5);
  gl.uniform3f(gl.getUniformLocation(program, "rLightColor"), 0.3, 0.15, 0.05);
  gl.uniform3f(gl.getUniformLocation(program, "cowColor"), 0.3, 0.15, 0.05);

  gl.drawArrays(gl.TRIANGLES, 0, cow.length);
  window.requestAnimationFrame(render);
}

// function to keep the light rotating
function updateLight() {
  if (RPLight == true) {
    rLight = newLight;
  } else {
    rLight += 0.5;
  }

  if (panLight == true) {
    pLight = newPLight;
  } else {
    pLight += 0.5;
  }
}


// buffer to draw the cow
function addBuffers(){

  var materialAmbient = vec4(0.0, 1.0, 0.0, 1.0);
  var materialDiffuse = vec4(0.4, 0.8, 0.4, 1.0);
  var materialSpecular = vec4(0.0, 0.4, 0.4, 1.0);
  var materialShininess = 300.0;

  var cowVertices = get_vertices();
  var cowFaces = get_faces();

  for (var i = 0; i < cowFaces.length; i++) {
    for (var j = 0; j < 3; j++) {
      cow.push(cowVertices[cowFaces[i][j] - 1]);
    }
  }
  cow = flatten(cow);
  gl.useProgram(program);

  let iBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, iBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cow, gl.STATIC_DRAW);

  let norV = gl.getAttribLocation(program, "norV");
  gl.vertexAttribPointer(norV, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(norV);

  let posVec = gl.getAttribLocation(program, "posVec");
  gl.vertexAttribPointer(posVec, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(posVec);

  var lightPositionLoc =
  gl.getUniformLocation(program, "lightPosition");
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));

  var ambientProduct = mult(lightAmbient, materialAmbient);
  var ambientProductLoc =
  gl.getUniformLocation(program, "ambientProduct");
  gl.uniform4fv(ambientProductLoc, flatten(ambientProduct));

  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var diffuseProductLoc =
  gl.getUniformLocation(program, "diffuseProduct");
  gl.uniform4fv(diffuseProductLoc, flatten(diffuseProduct));

  var specularProduct = mult(lightSpecular, materialSpecular);
  var specularProductLoc =
  gl.getUniformLocation(program, "specularProduct");
  gl.uniform4fv(specularProductLoc, flatten(specularProduct));

  var shininessLoc = gl.getUniformLocation(program, "shininess");
  gl.uniform1f(shininessLoc, materialShininess);

}


// Helper functions to rotate the cow in xyz directions.
function xRotFunc(theta) {
  var c = Math.cos(radians(theta));
  var s = Math.sin(radians(theta));
  var xValue = mat4( 
    1.0, 0.0, 0.0, 0.0,
      0.0, c, -s, 0.0,
      0.0, s, c, 0.0,
      0.0, 0.0, 0.0, 1.0 );
  return xValue;
}
function yRotFunc(theta) {
  var c = Math.cos(radians(theta));
  var s = Math.sin(radians(theta));
  var yValue = mat4( 
    c, 0.0, s, 0.0,
      0.0, 1.0, 0.0, 0.0,
      -s, 0.0, c, 0.0,
      0.0, 0.0, 0.0, 1.0 );
  return yValue;
}
function zRotFunc(theta) {
  var c = Math.cos(radians(theta));
  var s = Math.sin(radians(theta));
  var zValue = mat4( 
    c, -s, 0.0, 0.0,
      s,  c, 0.0, 0.0,
      0.0, 0.0, 1.0, 0.0,
      0.0, 0.0, 0.0, 1.0 );
  return zValue;
}

// all listeners are here
function addListeners(){
  var rotationX = document.getElementById("rotationX");
  var rotationY = document.getElementById("rotationY");
  var rotationZ = document.getElementById("rotationZ");
  var tranX = document.getElementById("tranX");
  var tranY = document.getElementById("tranY");
  var tranZ = document.getElementById("tranZ");

  
  canvas.addEventListener("wheel", handleMouseWheel);

  function handleMouseWheel(event) {
    event.preventDefault();
    const deltaY = event.deltaY;
    if (deltaY < 0) {
      tranZ.value += 0.05;
    } else if (deltaY > 0) {
      tranZ.value -= 0.05;
    }
  }

  // https://stackoverflow.com/questions/1206203/how-to-distinguish-between-left-and-right-mouse-click-with-jquery
  canvas.addEventListener("mousedown", handleMouseDown);
  canvas.addEventListener("mousemove", handleMouseMove);
  canvas.addEventListener("mouseup", () => {
    down = false;
  });
  
  var down = false;
  
  function handleMouseDown(event) {
    const { MX, MY } = event;
    switch (event.which) {
      case 1:
      case 3:
        mouseP = {
          x: MX,
          y: MY
        };
        down = true;
        break;
    }
  }
  
  // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/clientX
  function handleMouseMove(event) {
    const { clientX, clientY } = event;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    
    let xPos = (2 * clientX) / canvasWidth - 1;
    let yPos = (2 * (canvasHeight - clientY)) / canvasHeight - 1;
  
    if (down == true) {
      switch (event.which) {
        case 1:
          finalP = {
            x: xPos,
            y: yPos
          };
          tranX.value = xPos;
          tranY.value = yPos;
          break;
        case 3:
          finalP = {
            x: xPos * 180,
            y: yPos * 180,
          };
          rotationX.value = finalP.x;
          rotationY.value = finalP.y;
          break;
      }
    }
  }

  window.addEventListener("keypress", handleKeyPress);

  function handleKeyPress(event) {
    const key = event.key.toLowerCase();
    switch (key) {
      case "r":
        resetValues();
        break;
      case "p":
        toggleRPLight();
        break;
      case "s":
        togglePanLight();
        break;
      case "arrowleft":
        changeRotaZL();
        break;
      case "arrowRight":
        changeRotaZR();
        break;
    }
  }

  function resetValues() {
    rotationX.value = 0;
    rotationY.value = 0;
    rotationZ.value = 0;
    tranX.value = 0;
    tranY.value = 0;
    tranZ.value = 0.1;
  }
  
  function toggleRPLight() {
    if (RPLight == true){
      RPLight = false;
    }
    else {
      RPLight = true;
    }
    newLight = rLight; 
  }
  
  function togglePanLight() {
    if (panLight == true){
      panLight = false;
    }
    else {
      panLight = true;
    }
    newPLight = pLight; 
  }

  function changeRotaZL(){
    const rotationValue = 5;
    rotationZ.value -= rotationValue;
    if(rotationZ.value < - 180){
      rotationZ.value = 180;
    }
  }

  function changeRotaZR(){
    const rotationValue = 5;
    rotationZ.value += rotationValue;
    if(rotationZ.value > 180){
      rotationZ.value = -180;
    }
  }
}
