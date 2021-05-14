"use strict";
// bỏ comment để show suggest khi hover
// const THREE = require("three");
// const Physijs = require('physijs');

var scene, camera, renderer;
var light1, light2; // two lights
var clock; // time
var bricks;
var stackHeight;

var warm = document.getElementById("warm");
var canvas = document.getElementById("canvas-area");
var message = document.getElementById("lose-message");
var score_display = document.getElementById("score");
var maxCombo_display = document.getElementById("maxCombo");

var gameState = {
  score: 0,
  scene: "start",
  combo: 0,
  maxCombo: 0,
};

var rainBowColors = [
  0xd358f7, 0xfa5858, 0xfaac58, 0xfafa58, 0x58fa58, 0x58faf4, 0x5882fa,
];

var palette_summer = {
  yellow: 0xfff489,
  white: 0xd8d8d8,
  pink: 0xffdcfc,
  blue: 0xedc6ff,
  purple: 0xc4ddff,
  red: 0xffb8b8,
};

createScene();
animate(); // start the animation loop!

function createScene() {
  // scene, camera, renderer, light1, light2

  //   initScene();
  scene = new Physijs.Scene();
  scene.background = new THREE.Color(0x162d47);
  scene.fog = new THREE.Fog(0x162d47, 5, 380); // sương mù, làm mờ
  //   scene.setGravity(new THREE.Vector3(0, -100, 0));

  //   initCamera();
  const WdivH = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(45, WdivH, 0.1, 1000);
  camera.position.set(120, 100, 120);
  camera.lookAt(0, 0, 0);
  scene.add(camera);

  //   initLight();
  light1 = new THREE.DirectionalLight(0xffffff, 0.9); // Ánh sáng toàn bộ cho vật thể
  light1.position.set(1, 1, 0.5);
  scene.add(light1);
  light2 = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9); // ánh sáng chiếu từ trên xuống cho vật thể
  scene.add(light2);

  //   initRenderer();
  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  canvas.innerHTML = "";
  canvas.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  window.addEventListener("resize", handleWindowResize, false);

  //   initControls();
  // create a clock for the time-based animation ...
  clock = new THREE.Clock();
  clock.start();
  window.addEventListener("keydown", keydown);
  // click restart
  document
    .getElementById("button-restart")
    .addEventListener("click", function (event) {
      canvas.style.filter = "";
      message.style.display = "none";
      // clear three js scene
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      playGameMusic("restart.mp3");
      createScene();
      gameState.scene = "start";
      gameState.score = 0;
      gameState.combo = 0;
      gameState.maxCombo = 0;
    });
  // click to menu
  document
    .getElementById("button-menu")
    .addEventListener("click", function (event) {
      window.location.href = "index.html";
    });

  // thêm khối trụ 0
  bricks = new Array(200);
  var foundation = new Foundation();
  scene.add(foundation.mesh);
  stackHeight = 1;
  bricks[0] = new Brick("z", 50, 50);
  bricks[0].mesh.position.set(0, 0, 0);
  scene.add(bricks[0].mesh);
  addBrick();

  // show axes // The X axis is red. The Y axis is green. The Z axis is blue.
  var axes = new THREE.AxisHelper(1000);
  axes.geometry = new THREE.Geometry().fromBufferGeometry(axes.geometry);
  scene.add(axes);
}

function keydown(event) {
  if (gameState.scene == "end" && (event.key == "r" || event.key == "R")) {
    canvas.style.filter = "";
    message.style.display = "none";
    // clear three js scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    createScene();
    gameState.scene = "start";
    gameState.score = 0;
    gameState.combo = 0;
    gameState.maxCombo = 0;
    playGameMusic("restart.mp3");
    return;
  }

  if (gameState.scene == "start" && event.key == " ") {
    bricks[stackHeight].isDropped = true;
    return;
  }
}

function animate() {
  switch (gameState.scene) {
    case "start": {
      var deltaTime = clock.getDelta();
      if (!bricks[stackHeight].isDropped) {
        if (camera.position.y - bricks[stackHeight].mesh.position.y <= 100) {
          camera.position.y += deltaTime * 40; // nâng camera cao lên mỗi khi thêm khối
        }
        moveBrick(bricks[stackHeight], deltaTime);
      } else {
        dropBrick(bricks[stackHeight]);
        if (gameState.scene != "end") {
          addBrick();
        }
      }

      scene.simulate();
      //   camera.position.x += 0.01 * 40;
      renderer.render(scene, camera);
      break;
    }
    case "end": {
      scene.simulate();
      renderer.render(scene, camera);
      break;
    }
    default:
  }

  requestAnimationFrame(animate);
}

function handleWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function handleMouseClick(event) {
  bricks[stackHeight].isDropped = true;
}

function Foundation() {
  var geom = new THREE.BoxGeometry(50, 150, 50);
  var mat = new THREE.MeshLambertMaterial({
    color: palette_summer["blue"],
  });
  this.mesh = new THREE.Mesh(geom, mat, 0);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
  this.mesh.position.set(0, -79, 0);
}

function playGameMusic(soundfile) {
  // create an AudioListener and add it to the camera
  var listener = new THREE.AudioListener();
  camera.add(listener);

  // create a global audio source
  var sound = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load("/sounds/" + soundfile, function (buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(false);
    sound.setVolume(0.05);
    sound.play();
  });
}

function cheers() {
  //console.log(bricks[stackHeight].mesh.material.__proto__.color);
  bricks[stackHeight].mesh.material.__proto__.color.setHex(
    rainBowColors[gameState.combo % 7]
  );
  var pm = gameState.combo % 8;
  var file = pm + ".mp3";
  playGameMusic(file);
  gameState.score += gameState.combo;
}

function Brick(direction, width, depth) {
  this.fly_speed = 80;
  this.drop_speed = 60;
  this.isDropped = false;
  this.direction = direction;

  var geom = new THREE.BoxGeometry(50, 8, 50);
  geom.scale(width / 50, 1, depth / 50);
  var mat = new THREE.MeshLambertMaterial({
    color: palette_summer["white"],
    //color: (Math.random()*16777215)
  });
  var pmaterial = new Physijs.createMaterial(mat, 0.9, 0.01);

  //this.mesh = new THREE.Mesh(geom, mat);
  this.mesh = new Physijs.BoxMesh(geom, pmaterial, 0);

  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
}

function DroppedBrick(width, depth, x, y, z) {
  var geom = new THREE.BoxGeometry(depth, 8, width);
  var mat = new THREE.MeshLambertMaterial({
    color: palette_summer.purple,
  });
  var pmaterial = new Physijs.createMaterial(mat, 0.9, 0.01);
  this.mesh = new Physijs.BoxMesh(geom, pmaterial, 500);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
  this.mesh.position.x = x;
  this.mesh.position.y = y;
  this.mesh.position.z = z;
  this.mesh.setLinearVelocity(new THREE.Vector3(0, 0, 0));
}

function addBrick() {
  var brickCurrent,
    brickLast = bricks[stackHeight - 1];
  var posX = brickLast.mesh.position.x;
  var posZ = brickLast.mesh.position.z;

  if (brickLast.direction == "z") {
    brickCurrent = new Brick("x", 50, 50);
    brickCurrent.mesh.__dirtyPosition = true;
    brickCurrent.mesh.scale.x = brickLast.mesh.scale.x;
    brickCurrent.mesh.scale.z = brickLast.mesh.scale.z;
    brickCurrent.mesh.position.set(-59, 8 * stackHeight, posZ);
  } else {
    brickCurrent = new Brick("z", 50, 50);
    brickCurrent.mesh.__dirtyPosition = true;
    brickCurrent.mesh.scale.x = brickLast.mesh.scale.x;
    brickCurrent.mesh.scale.z = brickLast.mesh.scale.z;
    brickCurrent.mesh.position.set(posX, 8 * stackHeight, -59);
  }

  bricks[stackHeight] = brickCurrent;
  scene.add(bricks[stackHeight].mesh);
}

function moveBrick(brick, deltaTime) {
  brick.mesh.__dirtyPosition = true;
  if (brick.direction == "x") {
    if (brick.mesh.position.x >= 60) {
      brick.fly_speed = -brick.fly_speed;
    } else if (brick.mesh.position.x <= -60) {
      brick.fly_speed = -brick.fly_speed;
    }
    brick.mesh.position.x += deltaTime * brick.fly_speed;
  } else {
    if (brick.mesh.position.z >= 60) {
      brick.fly_speed = -brick.fly_speed;
    } else if (brick.mesh.position.z <= -60) {
      brick.fly_speed = -brick.fly_speed;
    }
    brick.mesh.position.z += deltaTime * brick.fly_speed;
  }
}

function dropBrick(brick) {
  // enable flying brick to stop manually
  brick.mesh.__dirtyPosition = true;
  brick.mesh.__dirtyRotation = true;

  // parameters of the top brick on stack
  var width = 50 * bricks[stackHeight - 1].mesh.scale.x;
  var depth = 50 * bricks[stackHeight - 1].mesh.scale.z;
  var posX = bricks[stackHeight - 1].mesh.position.x;
  var posY = bricks[stackHeight - 1].mesh.position.y;
  var posZ = bricks[stackHeight - 1].mesh.position.z;

  var droppedBrick;

  // console.log("width:" + width);
  // console.log("depth:" + depth);

  if (brick.direction == "x") {
    var newWidth = width - Math.abs(brick.mesh.position.x - posX);
    // console.log("newWidth:" + newWidth);
    if (newWidth < 0) {
      droppedBrick = new DroppedBrick(
        depth,
        width,
        brick.mesh.position.x,
        brick.mesh.position.y,
        brick.mesh.position.z
      );
      scene.remove(brick.mesh);
      scene.add(droppedBrick.mesh);
      gameState.combo = 0;

      endGame();
    } else {
      var deltaX = Math.abs(width - newWidth);

      if (brick.mesh.position.x - posX <= -1) {
        brick.mesh.scale.x = newWidth / 50;
        brick.mesh.position.x = posX - deltaX / 2;
        droppedBrick = new DroppedBrick(
          depth,
          width - newWidth,
          posX - deltaX - newWidth / 2,
          posY + 8,
          posZ
        );
        droppedBrick.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 20));
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.combo = 0;
        scene.add(droppedBrick.mesh);
        playGameMusic("drop.mp3");
      } else if (brick.mesh.position.x - posX >= 1) {
        brick.mesh.scale.x = newWidth / 50;
        brick.mesh.position.x = posX + deltaX / 2;
        droppedBrick = new DroppedBrick(
          depth,
          width - newWidth,
          posX + deltaX + newWidth / 2,
          posY + 8,
          posZ
        );
        droppedBrick.mesh.setAngularVelocity(new THREE.Vector3(0, 0, -20));
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.combo = 0;
        scene.add(droppedBrick.mesh);
        playGameMusic("drop.mp3");
      } else {
        brick.mesh.position.x = posX;
        console.log("Right on spot!");
        gameState.combo++;
        cheers();
      }
    }
  } else {
    var newDepth = depth - Math.abs(brick.mesh.position.z - posZ);
    // console.log("newDepth:" + newDepth);
    if (newDepth < 0) {
      droppedBrick = new DroppedBrick(
        depth,
        width,
        brick.mesh.position.x,
        brick.mesh.position.y,
        brick.mesh.position.z
      );
      scene.remove(brick.mesh);
      scene.add(droppedBrick.mesh);
      gameState.combo = 0;

      endGame();
    } else {
      var deltaZ = Math.abs(depth - newDepth);

      if (brick.mesh.position.z - posZ <= -1) {
        brick.mesh.scale.z = newDepth / 50;
        brick.mesh.position.z = posZ - deltaZ / 2;
        droppedBrick = new DroppedBrick(
          depth - newDepth,
          width,
          posX,
          posY + 8,
          posZ - deltaZ - newDepth / 2
        );
        droppedBrick.mesh.setAngularVelocity(new THREE.Vector3(-20, 0, 0));
        scene.add(droppedBrick.mesh);
        playGameMusic("drop.mp3");
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.combo = 0;
        warm.classList.remove("yellow", "red");
      } else if (brick.mesh.position.z - posZ >= 1) {
        brick.mesh.scale.z = newDepth / 50;
        brick.mesh.position.z = posZ + deltaZ / 2;
        droppedBrick = new DroppedBrick(
          depth - newDepth,
          width,
          posX,
          posY + 8,
          posZ + deltaZ + newDepth / 2
        );
        droppedBrick.mesh.setAngularVelocity(new THREE.Vector3(20, 0, 0));
        scene.add(droppedBrick.mesh);
        playGameMusic("drop.mp3");
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.combo = 0;
        warm.classList.remove("yellow", "red");
      } else {
        brick.mesh.position.z = posZ;
        console.log("Right on spot!");
        gameState.combo++;
        if (gameState.combo == 1) {
          warm.classList.add("yellow");
        }
        if (gameState.combo == 3) {
          warm.classList.remove("yellow");
          warm.classList.add("red");
        }

        cheers();
      }
    }
  }

  //brick.fly_speed = 0;
  stackHeight += 1;
  gameState.score += 1;
}

function endGame() {
  gameState.scene = "end";

  score_display.innerHTML = gameState.score;
  maxCombo_display.innerHTML = gameState.maxCombo;
  canvas.style.filter = "blur(3px) grayscale(30%)";
  canvas.style.transition;
  message.style.display = "block";
  playGameMusic("gameover.mp3");
}
