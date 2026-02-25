import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Octahedron } from '@react-three/drei';
import * as THREE from 'three';

const ProductGem = ({ image }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <Octahedron ref={meshRef} args={[1.5, 0]}>
        <MeshDistortMaterial
          color="#A8E6CF"
          emissive="#2D5016"
          emissiveIntensity={0.2}
          roughness={0.2}
          metalness={0.8}
          distort={0.1}
          speed={1}
        />
      </Octahedron>
    </Float>
  );
};

const ProductCanvas = ({ image }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      className="w-full h-full"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#A8E6CF" />
      <pointLight position={[-5, -5, -5]} intensity={0.4} color="#C9A84C" />
      <ProductGem image={image} />
    </Canvas>
  );
};

export default ProductCanvas;
