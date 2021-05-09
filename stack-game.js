
var camera,scene,renderer;
var light1,light2;

function initrenderer() {
 scene = new THREE.Scene();
 renderer = new THREE.WebGLRenderer(
   {alpha: true,
  antialias: true,
  });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMapp;
document.body.appendChild(renderer.domElement);
}

function initcamera(){
 camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
  );
camera.position.set(100,120,100);
camera.lookAt(0, 0, 0);
scene.add(camera);
}

function initPysijs(){
 Physijs.scripts.worker = "./lib/physijs_worker.js";
  Physijs.scripts.ammo = "./lib/ammo.js";
}

function initScene() {
    scene = new Physijs.Scene();
    scene.background = new THREE.Color(0x162d47);
    scene.fog = new THREE.Fog(0x162d47, 5, 380);
    scene.setGravity(new THREE.Vector3(0, -100, 0));
  }

 function  Cube (){
 var geometry = new THREE.BoxGeometry(50, 150, 50);
  var material = new THREE.MeshLambertMaterial({
   color : 0xedc6ff
  });
  var pmaterial = new Physijs.createMaterial(material, 0, 0);
  var cube = new Physijs.BoxMesh(geometry, pmaterial, 0);
   cube.castShadow = true;
   cube.receiveShadow = true;
  cube.position.set(0, -75, 0);

 scene.add(cube);
}

function initLight() {
  light1 = new THREE.DirectionalLight(0xffffff, 0.9);
  light1.position.set(1, 1, 0.5);
  scene.add(light1);
  light2 = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);
  scene.add(light2);
}

function animate() {
  initrenderer();
  initScene();
  initPysijs();
  initcamera();
  initLight();
  Cube();
  renderer.render(scene, camera);
};
animate();
