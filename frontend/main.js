import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lights

const ambientLight = new THREE.AmbientLight(0xffffff,   0.8);
scene.add(ambientLight);

//Directional lightning

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight);

//Directional lightning

const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
scene.add(directionalLight2);


const loader = new GLTFLoader();
loader.load('/model.glb', (gltf) => {
  scene.add(gltf.scene);
  gltf.scene.position.set(0, 0, 0); 
}, undefined, (error) => {
  console.error('GLTF yükleme hatası:', error);
});

camera.position.set(5,5,5);
camera.rotateY(45);


function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();