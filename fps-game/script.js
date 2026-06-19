// 游戏配置
const config = {
    sensitivity: 0.005,
    moveSpeed: 0.15,
    sprintMultiplier: 1.8,
    gravity: 0.02,
    jumpForce: 0.8
};

// Three.js 场景设置
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // 天空蓝
scene.fog = new THREE.Fog(0x87ceeb, 1000, 50);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.7, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.getElementById('gameContainer').appendChild(renderer.domElement);

// 照明
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(100, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// 创建地面
const groundGeometry = new THREE.PlaneGeometry(500, 500);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2d8659 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// 创建天空盒
const skyGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
const skyMaterial = new THREE.MeshStandardMaterial({
    color: 0x87ceeb,
    side: THREE.BackSide
});
const sky = new THREE.Mesh(skyGeometry, skyMaterial);
scene.add(sky);

// 创建一些建筑物
function createBuildings() {
    const positions = [
        { x: 50, z: 50, w: 30, h: 40, d: 30 },
        { x: -60, z: 40, w: 25, h: 35, d: 25 },
        { x: 40, z: -70, w: 35, h: 45, d: 35 },
        { x: -50, z: -60, w: 28, h: 38, d: 28 }
    ];
    
    positions.forEach(pos => {
        const geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
        const material = new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(pos.x, pos.h / 2, pos.z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);
    });
}

createBuildings();

// 玩家控制状态
const player = {
    velocity: { x: 0, y: 0, z: 0 },
    isOnGround: false,
    health: 100,
    maxHealth: 100,
    ammo: 30,
    maxAmmo: 30,
    ammoReserve: 120,
    score: 0,
    isSprinting: false
};

const keys = {};
let mouseX = 0, mouseY = 0;
let isLocked = false;

// 创建敌人列表
const enemies = [];

// 敌人类
class Enemy {
    constructor(position) {
        this.health = 30;
        this.maxHealth = 30;
        this.speed = 0.05;
        this.targetDistance = 50;
        
        // 创建敌人几何体
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
        
        // 敌人眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.3, 0.6, -0.4);
        this.mesh.add(this.leftEye);
        
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.3, 0.6, -0.4);
        this.mesh.add(this.rightEye);
    }
    
    update() {
        // 向玩家移动
        const direction = new THREE.Vector3();
        direction.subVectors(camera.position, this.mesh.position);
        const distance = direction.length();
        
        if (distance < this.targetDistance) {
            direction.normalize();
            this.mesh.position.add(direction.multiplyScalar(this.speed));
        }
        
        // 敌人攻击玩家
        if (distance < 2) {
            player.health -= 0.1;
            updateHealthDisplay();
            if (player.health <= 0) {
                alert('游戏结束！得分：' + player.score);
                location.reload();
            }
        }
    }
    
    takeDamage(damage) {
        this.health -= damage;
        return this.health <= 0;
    }
    
    remove() {
        scene.remove(this.mesh);
    }
}

// 生成敌人
function spawnEnemies() {
    for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const distance = 30 + Math.random() * 20;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        enemies.push(new Enemy(new THREE.Vector3(x, 0, z)));
    }
}

spawnEnemies();

// 射击射线
const raycaster = new THREE.Raycaster();

// 射击函数
function shoot() {
    if (player.ammo <= 0) {
        console.log('没有弹药！按 R 换弹');
        return;
    }
    
    player.ammo--;
    updateAmmoDisplay();
    
    // 从摄像机方向射出射线
    raycaster.setFromCamera({ x: 0, y: 0 }, camera);
    
    const enemyMeshes = enemies.map(e => e.mesh);
    const intersects = raycaster.intersectObjects(enemyMeshes);
    
    if (intersects.length > 0) {
        // 查找被击中的敌人
        const targetMesh = intersects[0].object.parent;
        const enemy = enemies.find(e => e.mesh === targetMesh);
        
        if (enemy && enemy.takeDamage(25)) {
            // 敌人死亡
            enemy.remove();
            enemies.splice(enemies.indexOf(enemy), 1);
            player.score += 100;
            updateScoreDisplay();
            
            // 生成新敌人
            if (enemies.length < 5) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 30 + Math.random() * 20;
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance;
                enemies.push(new Enemy(new THREE.Vector3(x, 0, z)));
            }
        }
    }
    
    // 射击动画
    camera.position.z -= 0.05;
    setTimeout(() => {
        camera.position.z += 0.05;
    }, 50);
}

// 换弹函数
function reload() {
    const needAmmo = player.maxAmmo - player.ammo;
    const canReload = Math.min(needAmmo, player.ammoReserve);
    
    player.ammo += canReload;
    player.ammoReserve -= canReload;
    updateAmmoDisplay();
}

// 更新UI
function updateHealthDisplay() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = Math.ceil(player.health) + '/' + player.maxHealth;
}

function updateAmmoDisplay() {
    document.getElementById('ammoCount').textContent = player.ammo + '/' + player.ammoReserve;
}

function updateScoreDisplay() {
    document.getElementById('scoreCount').textContent = player.score;
}

// 指针锁定
document.addEventListener('click', () => {
    renderer.domElement.requestPointerLock();
});

document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === renderer.domElement;
});

// 鼠标移动
document.addEventListener('mousemove', (e) => {
    if (isLocked) {
        mouseX += e.movementX * config.sensitivity;
        mouseY += e.movementY * config.sensitivity;
        
        // 限制垂直旋转
        mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, mouseY));
        
        // 应用旋转
        camera.rotation.order = 'YXZ';
        camera.rotation.y = mouseX;
        camera.rotation.x = mouseY;
    }
});

// 键盘事件
document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    
    if (e.key.toLowerCase() === 'r') {
        reload();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// 鼠标点击射击
document.addEventListener('mousedown', (e) => {
    if (e.button === 0 && isLocked) {
        shoot();
    }
});

// 更新玩家移动
function updatePlayer() {
    const moveDirection = new THREE.Vector3();
    
    // 获取摄像机方向
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    right.crossVectors(camera.up, forward);
    right.normalize();
    
    // WASD 移动
    let moveSpeed = config.moveSpeed;
    if (keys['shift']) {
        moveSpeed *= config.sprintMultiplier;
    }
    
    if (keys['w']) moveDirection.add(forward.multiplyScalar(moveSpeed));
    if (keys['s']) moveDirection.add(forward.multiplyScalar(-moveSpeed));
    if (keys['a']) moveDirection.add(right.multiplyScalar(-moveSpeed));
    if (keys['d']) moveDirection.add(right.multiplyScalar(moveSpeed));
    
    // 应用移动
    camera.position.add(moveDirection);
    
    // 重力
    player.velocity.y -= config.gravity;
    camera.position.y += player.velocity.y;
    
    // 地面碰撞
    if (camera.position.y < 1.7) {
        camera.position.y = 1.7;
        player.velocity.y = 0;
        player.isOnGround = true;
    } else {
        player.isOnGround = false;
    }
    
    // 跳跃
    if (keys[' '] && player.isOnGround) {
        player.velocity.y = config.jumpForce;
        player.isOnGround = false;
    }
}

// 游戏循环
function animate() {
    requestAnimationFrame(animate);
    
    updatePlayer();
    
    // 更新敌人
    enemies.forEach(enemy => {
        enemy.update();
    });
    
    renderer.render(scene, camera);
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 初始化UI
updateHealthDisplay();
updateAmmoDisplay();
updateScoreDisplay();

// 开始游戏
animate();