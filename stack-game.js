function DroppedBrick(width, depth, x, y, z) {
  // (có thể chuyển thành (depth, width, x, y, z)) để phù hợp với phần code dropBick
  // tạo một box
  var geom = new THREE.BoxGeometry(depth, 8, width); // có thể chuyển thành (width, 8, depth) để phù hợp với phần code dropBick
  // 8 được hiểu là độ dày của một brick (theo mắt nhìn người chơi - ứng với trục y)
  var mat = new THREE.MeshLambertMaterial({
    // màu
    color: palette_summer.purple,
  });
  var pmaterial = new Physijs.createMaterial(mat, 0.9, 0.01);
  this.mesh = new Physijs.BoxMesh(geom, pmaterial, 500);
  this.mesh.castShadow = true;
  this.mesh.receiveShadow = true;
  // set các tọa độ
  this.mesh.position.x = x;
  this.mesh.position.y = y;
  this.mesh.position.z = z;
  this.mesh.setLinearVelocity(new THREE.Vector3(0, 0, 0));
}

function dropBrick(brick) {
  //brick là brick đang di chuyển cần cắt, brick này có độ lớn bằng brick trên đỉnh stack
  brick.mesh.__dirtyPosition = true; // cho phép thay đổi vị trí
  brick.mesh.__dirtyRotation = true; // cho phép quay

  // width, depth độ lớn của một mặt brick, ứng với chiều x, z
  // lấy 50 * đơn vị đo theo chiều x, z của brick trên đỉnh stack thì ra độ lớn brick đang ở trên đỉnh stack
  // vì phần code addBrick mặc định cho là 50 x 50 nên là nhân với 50
  // việc nhân với 50 không có nghĩa brick luôn có độ lớn 50 x 50, và chiều dài = chiều rộng
  // nó giống như tỉ lệ, dự vào tỉ lệ này nhân với đơn vị đo của brick trên đỉnh stack thì được độ dài rộng của brick trên đỉnh stack
  var width = 50 * bricks[stackHeight - 1].mesh.scale.x;
  var depth = 50 * bricks[stackHeight - 1].mesh.scale.z;
  // lấy vị trí tọa độ của brick trên đỉnh nó
  var posX = bricks[stackHeight - 1].mesh.position.x;
  var posY = bricks[stackHeight - 1].mesh.position.y;
  var posZ = bricks[stackHeight - 1].mesh.position.z;

  var droppedBrick;

  // do brick chạy theo chiều x và z, nên chỉ cắt theo x và z, còn trục y là dùng để stack các brick --> ko cắt
  if (brick.direction == "x") {
    // TH1: chạy theo chiều x
    var newWidth = width - Math.abs(brick.mesh.position.x - posX);
    // newWidth có thể hiểu là phần còn lại sau khi cắt
    if (newWidth < 0) {
      // TH1.1: phần brick bị rơi là toàn bộ brick đang chạy (phần còn lại bị âm)
      // không lấy giá trị = 0 vì bằng 0 thì phần còn lại vẫn còn 1 đơn vị đo theo trục x nữa
      droppedBrick = new DroppedBrick(
        depth,
        width,
        brick.mesh.position.x,
        brick.mesh.position.y,
        brick.mesh.position.z
      );
      scene.remove(brick.mesh); // bỏ phần brick đang di chuyển đi
      scene.add(droppedBrick.mesh); // add brick bị drop và scene
      gameState.combo = 0;

      endGame(); // thua
    } else {
      // newWidth >= 0 TH1.2 - phần bị rơi là một phần brick đang chạy
      var deltaX = Math.abs(width - newWidth); // thay newWidth vào đây sẽ ra được Math.abs(brick.mesh.position.x - posX) = deltaX

      if (brick.mesh.position.x - posX <= -1) {
        // TH1.2.1: phần brick bị rơi là phần gần gốc tọa độ

        brick.mesh.scale.x = newWidth / 50; // set đơn vị đo
        brick.mesh.position.x = posX - deltaX / 2;
        droppedBrick = new DroppedBrick(
          depth,
          width - newWidth, // độ lớn phần cắt đi theo chiêu x là phần ban đầu - phần giữ lại
          posX - deltaX - newWidth / 2,
          posY + 8, // độ dày của brick tăng thêm 8 để chồng lên stack // code ban đầu cho cố định độ dày = 8
          posZ // z giữ nguyên, là phần không cắt vì đang xét trường hợp di chuyển theo chiều x
        );
        droppedBrick.mesh.setAngularVelocity(new THREE.Vector3(0, 0, 20));
        gameState.maxCombo = Math.max(gameState.maxCombo, gameState.combo);
        gameState.combo = 0;
        scene.add(droppedBrick.mesh);
        playGameMusic("drop.mp3");
      } else if (brick.mesh.position.x - posX >= 1) {
        // TH1.2.2: phần brick bị rơi là phần xa gốc tọa độ
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
        // TH1.3 brick không bị cắt // brick.mesh.position.x - posX  = 0 hay là hai brick trùng khít nhau
        brick.mesh.position.x = posX;
        console.log("Right on spot!");
        gameState.combo++;
        cheers();
      }
    }
  } else {
    // TH2 di chuyển theo chiều z // về tính toán tọa độ thì tương tự như trục x
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
