import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Logo3D = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    currentMount.appendChild(renderer.domElement);
    
    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 2;
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);
    
    // Create ferris wheel
    const group = new THREE.Group();
    
    // Outer ring
    const ringGeometry = new THREE.TorusGeometry(2, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x3498db,
      metalness: 0.8,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);
    
    // Spokes
    const spokesMaterial = new THREE.MeshStandardMaterial({
      color: 0xe74c3c,
      metalness: 0.6,
      roughness: 0.4,
    });
    
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 / 8) * i;
      const spokeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 4);
      const spoke = new THREE.Mesh(spokeGeometry, spokesMaterial);
      spoke.position.x = Math.cos(angle) * 1;
      spoke.position.y = Math.sin(angle) * 1;
      spoke.rotation.z = angle + Math.PI / 2;
      group.add(spoke);
      
      // Add cabin
      const cabinGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const cabinMaterial = new THREE.MeshStandardMaterial({
        color: 0x2ecc71,
        metalness: 0.4,
        roughness: 0.6,
      });
      const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabin.position.x = Math.cos(angle) * 2;
      cabin.position.y = Math.sin(angle) * 2;
      group.add(cabin);
    }
    
    // Center
    const centerGeometry = new THREE.SphereGeometry(0.3, 32, 32);
    const centerMaterial = new THREE.MeshStandardMaterial({
      color: 0xf39c12,
      metalness: 0.9,
      roughness: 0.1,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    group.add(center);
    
    scene.add(group);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      currentMount.removeChild(renderer.domElement);
    };
  }, []);
  
  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default Logo3D;