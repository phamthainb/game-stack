"use strict";

var scene, camera, renderer;
var light1, light2; 
var clock; 
var bricks;
var stackHeight;
var gameState = {
  score: 0,
  scene: "start",
  combo: 0,
  maxCombo: 0,
};


createScene();
animate(); 
function createScene() {
  
  initScene();
  initCamera();
  initLight();
  initRenderer();
  initControls();
  bricks = new Array(200);
  var foundation = new Foundation();

  scene.add(foundation.mesh);
  stackHeight = 1;
  bricks[0] = new Brick("z", 50, 50);
  bricks[0].mesh.position.set(0, 0, 0);
  scene.add(bricks[0].mesh);
  addBrick();
}

function animate() {
  switch (gameState.scene) {
    case "start":
      var deltaTime = clock.getDelta();
      if (!bricks[stackHeight].isDropped) {
        if (camera.position.y - bricks[stackHeight].mesh.position.y <= 100) {
          moveCamera(deltaTime);//nâng camera
        }
        moveBrick(bricks[stackHeight], deltaTime);// di chuyển hộp theo thời gian 
      } else {
        //đây lên 1 hộp mới
        stackHeight += 1;
       
          addBrick();
        
      }

      scene.simulate();
      renderer.render(scene, camera);
      break;
   
  }

  requestAnimationFrame(animate);
}


function initScene() {
  scene = new Physijs.Scene();
  scene.background = new THREE.Color(0x162d47);
  scene.fog = new THREE.Fog(0x162d47, 5, 380);
  scene.setGravity(new THREE.Vector3(0, -100, 0));
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  var canvas = document.getElementById("canvas-area");
  canvas.innerHTML = "";
  canvas.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  window.addEventListener("resize", handleWindowResize, false);
}

function handleWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(120, 100, 120);
  camera.lookAt(0, 0, 0);
  scene.add(camera);
}

function moveCamera(deltaTime) {
  camera.position.y += deltaTime * 40;
}

function initLight() {
  light1 = new THREE.DirectionalLight(0xffffff, 0.9);
  light1.position.set(1, 1, 0.5);
  scene.add(light1);
  light2 = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  scene.add(light2);
}

function initControls() {

  clock = new THREE.Clock();
  clock.start();
  window.addEventListener("keydown", keydown);
  
}


function Foundation() {
  var geom = new THREE.BoxGeometry(50, 150, 50);// Cột chính để đỡ
  var mat = new THREE.MeshLambertMaterial({//Màu
    color: 0xedc6ff,
  });
  this.mesh = new THREE.Mesh(geom, mat, 0);//Kết hợp Cột và màu
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
  this.mesh.position.set(0, -79, 0);
}

//Khởi tạo ra hộp 
function Brick(direction, width, depth) {
  this.fly_speed = 80; //khởi tạo tốc độ bay
  this.drop_speed = 60;// tốc độ rơi
  this.isDropped = false;// trạng thái : đã rơi hay chưa
  this.direction = direction;//hướng

  var geom = new THREE.BoxGeometry(50, 8, 50);//Khởi tạo hợp
  geom.scale(width / 50, 1, depth / 50);//Tỉ lệ
  var mat = new THREE.MeshLambertMaterial({//Khởi tạo màu
    color: 0xd8d8d8,
  });
  var pmaterial = new Physijs.createMaterial(mat, 0.9, 0.01);

  this.mesh = new Physijs.BoxMesh(geom, pmaterial, 0);//Kết hợp hình và màu

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
}


//Thêm hộp mới
function addBrick() {
  var width = 50;
  var depth = 50;
  var posX = bricks[stackHeight - 1].mesh.position.x;//Tọa độ x
  var posZ = bricks[stackHeight - 1].mesh.position.z;//Tọa độ z
  if (bricks[stackHeight - 1].direction == "z") {//Nếu hộp cũ ở ở hướng z, tạo hộp mới ở hướng x
    bricks[stackHeight] = new Brick("x", width, depth);
    bricks[stackHeight].mesh.__dirtyPosition = true;
    bricks[stackHeight].mesh.scale.x = bricks[stackHeight - 1].mesh.scale.x;
    bricks[stackHeight].mesh.scale.z = bricks[stackHeight - 1].mesh.scale.z;
    bricks[stackHeight].mesh.position.set(-59, 8 * stackHeight, posZ);//Tọa độ hộp mới được khởi tạo
  } else {//Ngược lại
    bricks[stackHeight] = new Brick("z", width, depth);
    bricks[stackHeight].mesh.__dirtyPosition = true;
    bricks[stackHeight].mesh.scale.x = bricks[stackHeight - 1].mesh.scale.x;
    bricks[stackHeight].mesh.scale.z = bricks[stackHeight - 1].mesh.scale.z;
    bricks[stackHeight].mesh.position.set(posX, 8 * stackHeight, -59);
  }

  scene.add(bricks[stackHeight].mesh);//Hiển thị khối mới tạo
}
// Tạo chuyển động cho hộp
function moveBrick(brick, deltaTime) {
  brick.mesh.__dirtyPosition = true;
  if (brick.direction == "x") {//TRường hợp hộp di chuyển theo chiều x
    if (brick.mesh.position.x >= 60) {//Nếu tọa độ  x của hộp vượt quá 60. đảo lại chiều di chuyển của hôp
      brick.fly_speed = -brick.fly_speed;
    } else if (brick.mesh.position.x <= -60) {// Nếu tọa độ x của hộp bé hơn 60, đảo lại chiều chuyển động
      brick.fly_speed = -brick.fly_speed;
    }

    brick.mesh.position.x += deltaTime * brick.fly_speed;// tọa độ x bằng x + deltatime nhân tốc độ bay
  } else {// Tương tự với chiều z
    if (brick.mesh.position.z >= 60) {
      brick.fly_speed = -brick.fly_speed;
    } else if (brick.mesh.position.z <= -60) {
      brick.fly_speed = -brick.fly_speed;
    }

    brick.mesh.position.z += deltaTime * brick.fly_speed;
  }
}



function keydown(event) {
 
  if (gameState.scene == "start" && event.key == " ") {
    bricks[stackHeight].isDropped = true;
    return;
  }
}

