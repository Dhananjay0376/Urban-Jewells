import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Icosahedron, Environment } from '@react-three/drei';
import * as THREE from 'three';

const Gemstone = ({ mousePosition }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.002;
      meshRef.current.rotation.y += 0.003;
      
      if (mousePosition) {
        meshRef.current.position.x = THREE.MathUtils.lerp(
          meshRef.current.position.x,
          mousePosition.x * 0.5,
          0.05
        );
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          mousePosition.y * 0.5,
          0.05
        );
      }
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Icosahedron ref={meshRef} args={[1.5, 1]}>
        <MeshDistortMaterial
          color="#A8E6CF"
          emissive="#2D5016"
          emissiveIntensity={0.3}
          roughness={0.1}
          metalness={0.9}
          distort={0.2}
          speed={2}
        />
      </Icosahedron>
      {/* Inner glow */}
      <Icosahedron args={[1.2, 1]}>
        <meshBasicMaterial
          color="#C9A84C"
          transparent
          opacity={0.3}
          wireframe
        />
      </Icosahedron>
    </Float>
  );
};

const ParticleField = () => {
  const count = 100;
  const mesh = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#A8E6CF"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
};

const HeroCanvas = ({ mousePosition }) => {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      className="absolute inset-0"
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#A8E6CF" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#C9A84C" />
      <spotLight
        position={[0, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        color="#A8E6CF"
      />
      <Gemstone mousePosition={mousePosition} />
      <ParticleField />
    </Canvas>
  );
};

export default HeroCanvas;
