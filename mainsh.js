import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.117.1/examples/jsm/controls/OrbitControls.js";

// =========================================
// 1. UI SETUP (Floating Info Card)
// =========================================
const infoCard = document.createElement('div');
infoCard.style.position = 'absolute';
infoCard.style.padding = '15px';
infoCard.style.background = 'rgba(0, 0, 0, 0.85)'; 
infoCard.style.color = 'white';
infoCard.style.fontFamily = 'Arial, sans-serif';
infoCard.style.border = '1px solid rgba(255, 255, 255, 0.3)';
infoCard.style.borderRadius = '12px'; 
infoCard.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
infoCard.style.display = 'none'; 
infoCard.style.pointerEvents = 'none'; 
infoCard.style.zIndex = '1000';
infoCard.style.maxWidth = '260px';

infoCard.innerHTML = `
    <h2 id="planetName" style="margin: 0 0 5px 0; font-size: 1.4rem; color: #4facfe; text-shadow: 0 0 5px #000;">Name</h2>
    <h3 id="planetTemp" style="margin: 0 0 10px 0; font-size: 1.0rem; color: #ffeb3b;">Temp: 0°C</h3>
    <p id="planetDesc" style="margin: 0 0 15px 0; font-size: 0.9rem; line-height: 1.4; color: #ddd;">Description goes here.</p>
    <div style="text-align: right; pointer-events: auto;">
        <button id="closeBtn" style="cursor:pointer; background:#444; color:white; border:1px solid #666; padding: 6px 12px; border-radius: 6px; font-weight:bold;">Resume Orbit</button>
    </div>
`;
document.body.appendChild(infoCard);

document.getElementById('closeBtn').addEventListener('click', (e) => {
    e.stopPropagation(); 
    resetCameraFocus();
});

// =========================================
// 2. SCENE & CAMERA
// =========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 30, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// =========================================
// 3. LIGHTS & TEXTURES
// =========================================
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 2, 400);
sunLight.castShadow = true;
sunLight.shadow.bias = -0.0001; 
sunLight.shadow.normalBias = 0.02; 
sunLight.shadow.radius = 1.5; 
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
scene.add(sunLight);

const loader = new THREE.TextureLoader();
const TEXTURES = {
    sun: './sun.jpg',
    mercury: './mercury.jpg',
    venus: './venus.jpg',
    earth: './earth.jpg',
    earthNormal: './earthnor.jpg',
    mars: './mars.jpg',
    jupiter: './jupiter.jpg',
    saturn: './saturn.jpg',
    saturnRing: './saturnring.png',
    uranus: './uranus.jpg',
    neptune: './neptune.jpg',
    pluto: './pluto.jpg'
};
const spaceTexture = loader.load('./stars_milky_way.jpg'); 
scene.background = spaceTexture;

// =========================================
// 4. SUN & OBJECTS
// =========================================
const sunGeo = new THREE.SphereGeometry(4, 64, 64);
const sunMat = new THREE.MeshStandardMaterial({
    map: loader.load(TEXTURES.sun),
    emissive: 0xffdd33,
    emissiveIntensity: 0.4,
    roughness: 0.4,
    metalness: 0
});
const sun = new THREE.Mesh(sunGeo,sunMat);
scene.add(sun);

function createGlowSprite(size=120){
    const canvas=document.createElement('canvas');
    canvas.width=256;canvas.height=256;
    const ctx=canvas.getContext('2d');
    const grd=ctx.createRadialGradient(128,128,10,128,128,128);
    grd.addColorStop(0,'rgba(255,240,200,0.95)');
    grd.addColorStop(0.2,'rgba(255,200,120,0.5)');
    grd.addColorStop(1,'rgba(255,120,20,0)');
    ctx.fillStyle=grd; ctx.fillRect(0,0,256,256);
    const tex=new THREE.CanvasTexture(canvas);
    const spriteMat=new THREE.SpriteMaterial({map:tex, blending:THREE.AdditiveBlending, transparent:true, depthWrite:false});
    const sprite=new THREE.Sprite(spriteMat);
    sprite.scale.set(size,size,1);
    return sprite;
}
const sunGlow=createGlowSprite(35);
sun.add(sunGlow);
sunLight.position.copy(sun.position);

const planets=[];
const interactiveObjects=[];
const pivots=[];

function createOrbitRing(distance, thickness=0.05, color=0x333366){
    const inner=Math.max(0.1, distance-thickness);
    const outer=distance+thickness;
    const ringGeo=new THREE.RingGeometry(inner, outer, 128);
    const ringMat=new THREE.MeshBasicMaterial({color:color, side:THREE.DoubleSide, transparent:true, opacity:0.2});
    const ring=new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x=-Math.PI/2;
    ring.receiveShadow=false;
    return ring;
}

function createPlanet(size, color, distance, speed, textureURL=null, normalMapURL=null, name='Planet', temp='0°C', desc='Description'){
    const geo=new THREE.SphereGeometry(size, 64, 64);
    let mat=new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.8,
        metalness: 0.1
    });
    
    let mainTexture = null;
    if(textureURL) {
        mainTexture = loader.load(textureURL);
        mat.map = mainTexture;
    }
    if(normalMapURL) {
        mat.normalMap = loader.load(normalMapURL);
        mat.normalScale = new THREE.Vector2(1, 1);
    }

    const planet=new THREE.Mesh(geo,mat);
    planet.position.x=distance;
    planet.castShadow=true; 
    planet.receiveShadow=true;
    
    // Save original texture for toggling
    planet.userData = { name, temp, description: desc, radius: size, distance: distance, originalTexture: mainTexture };

    const pivot=new THREE.Object3D();
    scene.add(pivot);
    pivot.add(planet);
    pivots.push({pivot, speed});

    const ring=createOrbitRing(distance, Math.max(0.05, size*0.05));
    scene.add(ring);

    planets.push({mesh:planet, pivot: pivot, speed: speed});
    interactiveObjects.push(planet);
    
    return planet;
}

// CREATE PLANETS
createPlanet(1, 0x888888, 10, 0.004, TEXTURES.mercury, null, 'Mercury', '167°C', 'The smallest planet.');
createPlanet(1.5, 0xeed6a7, 15, 0.003, TEXTURES.venus, null, 'Venus', '464°C', 'The hottest planet.');
createPlanet(1.8, 0x2a52be, 20, 0.002, TEXTURES.earth, TEXTURES.earthNormal, 'Earth', '15°C', 'Our home.');
createPlanet(1.3, 0xb22222, 25, 0.0018, TEXTURES.mars, null, 'Mars', '-65°C', 'The Red Planet.');
createPlanet(3.6, 0xd9c48c, 35, 0.001, TEXTURES.jupiter, null, 'Jupiter', '-110°C', 'The Gas Giant.');

const satSize=2.5; const satDist=45;
const saturn = createPlanet(satSize, 0xcaa88a, satDist, 0.0008, TEXTURES.saturn, null, 'Saturn', '-140°C', 'Famous for its rings.');
const satRingGeo=new THREE.RingGeometry(satSize+0.6, satSize+2.5, 64);
const satRingMat=new THREE.MeshStandardMaterial({
    color:0x8d6b39, side:THREE.DoubleSide, transparent:true, opacity:0.9, 
    map:loader.load(TEXTURES.saturnRing)
});
const satRing=new THREE.Mesh(satRingGeo,satRingMat);
satRing.rotation.x = -Math.PI/2.2;
saturn.add(satRing);

createPlanet(2, 0x7fffd4, 55, 0.0006, TEXTURES.uranus, null, 'Uranus', '-195°C', 'The Ice Giant.');
createPlanet(1.9, 0x4169e1, 65, 0.0005, TEXTURES.neptune, null, 'Neptune', '-200°C', 'The windy planet.');
createPlanet(0.8, 0xcccccc, 75, 0.0002, TEXTURES.pluto, null, 'Pluto', '-225°C', 'The dwarf planet.');

// =========================================
// 6. CONTROLS & CAMERA MOVEMENT
// =========================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5; 
controls.maxDistance = 200;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let currentLabel = null;
let focusTarget = null; 
let isPaused = false;

// WASD Movement Logic 
const move={forward:false,back:false,left:false,right:false,up:false,down:false};
window.addEventListener('keydown',(e)=>{
    if(e.key=='w'||e.key=='W') move.forward=true;
    if(e.key=='s'||e.key=='S') move.back=true;
    if(e.key=='a'||e.key=='A') move.left=true;
    if(e.key=='d'||e.key=='D') move.right=true;
    if(e.key==' ') move.up=true;
    if(e.key=='Shift') move.down=true;
});
window.addEventListener('keyup',(e)=>{
    if(e.key=='w'||e.key=='W') move.forward=false;
    if(e.key=='s'||e.key=='S') move.back=false;
    if(e.key=='a'||e.key=='A') move.left=false;
    if(e.key=='d'||e.key=='D') move.right=false;
    if(e.key==' ') move.up=false;
    if(e.key=='Shift') move.down=false;
});

function applyCameraMovement(delta){
    const speed=25 * delta;
    const dir=new THREE.Vector3(); camera.getWorldDirection(dir); dir.y=0; dir.normalize();
    const right=new THREE.Vector3(); right.crossVectors(camera.up,dir).normalize();
    if(move.forward) camera.position.addScaledVector(dir,speed);
    if(move.back) camera.position.addScaledVector(dir,-speed);
    if(move.left) camera.position.addScaledVector(right,speed);
    if(move.right) camera.position.addScaledVector(right,-speed);
    if(move.up) camera.position.y+=speed;
    if(move.down) camera.position.y-=speed;
}



function resetCameraFocus() {
    focusTarget = null;
    isPaused = false; 
    infoCard.style.display = 'none';
    controls.minDistance = 5; 
    controls.target.set(0,0,0);
    if(currentLabel) { scene.remove(currentLabel); currentLabel = null; }
}

// =========================================
// 7. EVENT LISTENERS (Raycasting)
// =========================================

window.addEventListener("dblclick", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY/window.innerHeight)*2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(interactiveObjects);

    if (hits.length > 0) {
        const obj = hits[0].object;
        obj.visible = !obj.visible;
    }
});

window.addEventListener("click", (e) => {
    if (e.target.closest('button')) return;

    mouse.x = (e.clientX/window.innerWidth)*2 - 1;
    mouse.y = -(e.clientY/window.innerHeight)*2 + 1;
    raycaster.setFromCamera(mouse,camera);
    
    const hits = raycaster.intersectObjects(interactiveObjects);
    
    if(hits.length > 0){
        const obj = hits[0].object;
        if(!obj.visible) return;

        focusTarget = obj;
        isPaused = true; 
        
        // Update HTML UI
        const data = obj.userData;
        document.getElementById('planetName').innerText = data.name;
        document.getElementById('planetTemp').innerText = `Temp: ${data.temp}`;
        document.getElementById('planetDesc').innerText = data.description;
        infoCard.style.display = 'block';
        controls.minDistance = data.radius + 1.2; 

        // TEXTURE FADE/TOGGLE LOGIC 
        if(obj.material.map) {
            obj.material.map = null;
            obj.material.color.set(0x999999); // Fade to grey
        } else {
            obj.material.map = data.originalTexture;
            obj.material.color.set(0xffffff); // Restore color
        }
        obj.material.needsUpdate = true;

        // 3D FLOATING LABEL 
        if(currentLabel) scene.remove(currentLabel);
        currentLabel = createLabel(`${data.name} R:${data.radius}`);
        scene.add(currentLabel);
    }
});

window.addEventListener("resize", ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
});

// =========================================
// 8. ANIMATION LOOP
// =========================================
function checkCollision() {
    const cameraPos = camera.position;
    for(let p of planets) {
        if(!p.mesh.visible) continue;
        const planetPos = new THREE.Vector3();
        p.mesh.getWorldPosition(planetPos);
        const dist = cameraPos.distanceTo(planetPos);
        const limit = p.mesh.userData.radius + 1.2;
        if(dist < limit) {
            const pushDir = new THREE.Vector3().subVectors(cameraPos, planetPos).normalize();
            camera.position.copy(planetPos.add(pushDir.multiplyScalar(limit)));
        }
    }
    const sunDist = cameraPos.distanceTo(new THREE.Vector3(0,0,0));
    if(sunDist < 6) { 
        const pushDir = cameraPos.clone().normalize();
        camera.position.copy(pushDir.multiplyScalar(6));
    }
}

function animate() {
    requestAnimationFrame(animate);

    if(!isPaused) {
        for(let p of pivots) p.pivot.rotation.y += p.speed;
    }
    
    for(let p of planets) p.mesh.rotation.y += 0.002;
    sun.rotation.y += 0.001;

    if(focusTarget) {
        const targetPos = new THREE.Vector3();
        focusTarget.getWorldPosition(targetPos);
        controls.target.lerp(targetPos, 0.05);

        // Auto-Zoom
        const currentOffset = camera.position.clone().sub(targetPos);
        const currentDist = currentOffset.length();
        const desiredDist = focusTarget.userData.radius * 2.5 + 2.0;
        if(currentDist > desiredDist) {
            const direction = currentOffset.normalize();
            const desiredPos = targetPos.clone().add(direction.multiplyScalar(desiredDist));
            camera.position.lerp(desiredPos, 0.05);
        }

        // Update HTML UI Box Position
        const uiPos = targetPos.clone();
        uiPos.y += focusTarget.userData.radius + 2.0; 
        uiPos.project(camera);
        infoCard.style.left = `${(uiPos.x * .5 + .5) * window.innerWidth}px`;
        infoCard.style.top = `${(-(uiPos.y * .5) + .5) * window.innerHeight}px`;

        // Update 3D Label Position
        if(currentLabel) {
            currentLabel.position.copy(targetPos);
            currentLabel.position.y += focusTarget.userData.radius + 1.5;
        }
    }

    applyCameraMovement(0.016);
    controls.update();
    checkCollision();
    renderer.render(scene, camera);
}

animate();
