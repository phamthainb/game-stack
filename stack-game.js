"use strict";
// bỏ comment để show suggest khi hover
// const THREE = require("three");
// const Physijs = require("physijs");

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
class Foundation {
  constructor() {
    var geom = new THREE.BoxGeometry(50, 150, 50);
    var mat = new THREE.MeshLambertMaterial({
      color: palette_summer["blue"],
    });
    this.mesh = new THREE.Mesh(geom, mat, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.set(0, -79, 0);
  }
}
class Brick {
  constructor(direction, width, depth) {
    this.fly_speed = 80;
    this.drop_speed = 60;
    this.isDropped = false;
    this.direction = direction;

    var geom = new THREE.BoxGeometry(50, 8, 50);
    geom.scale(width / 50, 1, depth / 50);
    var mat = new THREE.MeshLambertMaterial({
      color: palette_summer["white"],
    });
    var pmaterial = new Physijs.createMaterial(mat, 0.9, 0.01);

    this.mesh = new Physijs.BoxMesh(geom, pmaterial, 0);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}

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

  //! listen key press
  window.addEventListener("keydown", keydown);

  //btn mobile thay space
  var ua = navigator.userAgent.toLowerCase();
  if (ua.indexOf("safari") != -1) {
    if (ua.indexOf("chrome") > -1) {
      $(document).on("click", function (event) {
        // console.log("click", window.innerWidth);
        if (gameState.scene == "start" && window.innerWidth < 992) {
          // alert("click");
          bricks[stackHeight].isDropped = true;
          return;
        }
      });
    } else {
      $(document).on("touchstart", function (event) {
        // console.log("click", window.innerWidth);
        if (gameState.scene == "start" && window.innerWidth < 992) {
          // alert("click");
          bricks[stackHeight].isDropped = true;
          return;
        }
      });
    }
  }

  // thêm khối trụ base
  var foundation = new Foundation();
  scene.add(foundation.mesh);
  // thêm brick đầu tiên
  stackHeight = 1;
  bricks = new Array(200);
  bricks[0] = new Brick("z", 50, 50);
  bricks[0].mesh.position.set(0, 0, 0);
  scene.add(bricks[0].mesh);
  // loop
  addBrick();
  // show axes // The X axis is red. The Y axis is green. The Z axis is blue.
  var axes = new THREE.AxisHelper(1000);
  axes.geometry = new THREE.Geometry().fromBufferGeometry(axes.geometry);
  scene.add(axes);
}
class DroppedBrick {
  constructor(width, depth, x, y, z) {
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
}
// di chuyển khối gạch qua lại
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
// cut khối gạch
function dropBrick(brick) {
  const brickLast = bricks[stackHeight - 1];
  // enable flying brick to stop manually
  brick.mesh.__dirtyPosition = true;
  brick.mesh.__dirtyRotation = true;

  // parameters of the top brick on stack
  const width = 50 * brickLast.mesh.scale.x;
  const depth = 50 * brickLast.mesh.scale.z;
  const posX = brickLast.mesh.position.x;
  const posY = brickLast.mesh.position.y;
  const posZ = brickLast.mesh.position.z;

  let droppedBrick;

  if (brick.direction == "x") {
    // độ dài mới
    const newWidth = width - Math.abs(brick.mesh.position.x - posX);
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
      // độ dài > 0
      var deltaX = Math.abs(width - newWidth);

      if (brick.mesh.position.x - posX <= -1) {
        // chiều âm
        brick.mesh.scale.x = newWidth / 50;
        brick.mesh.position.x = posX - deltaX / 2;
        droppedBrick = new DroppedBrick(
          depth,
          width - newWidth,
          posX - deltaX - newWidth / 2,
          posY + 8,
          posZ
        );
        // droppedBrick.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 20));
        scene.add(droppedBrick.mesh);
        // logic game
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.combo = 0;
        playGameMusic("drop.mp3");
      } else if (brick.mesh.position.x - posX >= 1) {
        // chiều dương
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
        // console.log("Right on spot!");
        gameState.combo++;
        cheers();
      }
    }
  } else {
    var newDepth = depth - Math.abs(brick.mesh.position.z - posZ);
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

  stackHeight += 1;
  gameState.score += 1;
}

function addBrick() {
  let brickCurrent = bricks[stackHeight],
    brickLast = bricks[stackHeight - 1];
  const posX = brickLast.mesh.position.x;
  const posZ = brickLast.mesh.position.z;
  // vị trí khối mới sẽ dựa vào vị trí khối cũ
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

// click restart
function btnRestart() {
  if (window.innerWidth > 991) {
    console.log("click");
    let message = document.getElementById("lose-message");
    let canvas = document.getElementById("canvas-area");
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
  } else {
    window.location.reload();
  }
}
// click to menu
function btnMenu() {
  window.location.href = "index.html";
}

function animate() {
  const brickCurrent = bricks[stackHeight];
  switch (gameState.scene) {
    case "start": {
      var deltaTime = clock.getDelta();
      if (!brickCurrent.isDropped) {
        // khối hiện tại chưa bị drop
        if (camera.position.y - brickCurrent.mesh.position.y <= 100) {
          camera.position.y += deltaTime * 40; // nâng camera cao lên mỗi khi thêm khối
        }
        moveBrick(brickCurrent, deltaTime);
      } else {
        dropBrick(bricks[stackHeight]);
        // debugger;
        if (gameState.scene != "end") {
          addBrick();
        }
      }

      scene.simulate();
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

function endGame() {
  gameState.scene = "end";
  score_display.innerHTML = gameState.score;
  maxCombo_display.innerHTML = gameState.maxCombo;
  canvas.style.filter = "blur(3px) grayscale(30%)";
  canvas.style.transition;
  message.style.display = "block";
  playGameMusic("gameover.mp3");
}

function handleWindowResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}

function playGameMusic(soundfile) {
  var listener = new THREE.AudioListener();
  camera.add(listener);
  var sound = new THREE.Audio(listener);
  var audioLoader = new THREE.AudioLoader();
  window.l;
  audioLoader.load(
    "https://phamthainb.github.io/game-stack/sounds/" + soundfile,
    function (buffer) {
      sound.setBuffer(buffer);
      sound.setLoop(false);
      sound.setVolume(0.05);
      sound.play();
    }
  );
}

function cheers() {
  bricks[stackHeight].mesh.material.__proto__.color.setHex(
    rainBowColors[gameState.combo % 7]
  );
  playGameMusic(`${gameState.combo % 8}.mp3`);
  gameState.score += gameState.combo;
}

document.addEventListener("visibilitychange", (event) => {
  if (document.visibilityState == "visible") {
    // console.log("tab is active");
  } else {
    // console.log("tab is inactive");
    alert("Đang chơi game mà đi đâu đấy, F5 lại đeê");
  }
});
