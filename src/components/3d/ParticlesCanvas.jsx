import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Particles = ({ count = 200 }) => {
  const mesh = useRef();
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      
      // Mint to gold gradient colors
      const t = Math.random();
      colors[i * 3] = t * 0.79 + (1 - t) * 0.16; // R
      colors[i * 3 + 1] = t * 0.9 + (1 - t) * 0.66; // G
      colors[i * 3 + 2] = t * 0.31 + (1 - t) * 0.3; // B
    }
    return { positions, colors };
  }, [count]);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.y = state.clock.elapsedTime * 0.02;
      mesh.current.rotation.x = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
};

const ParticlesCanvas = () => {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 75 }}
      className="absolute inset-0"
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.3} />
      <Particles count={150} />
    </Canvas>
  );
};

export default ParticlesCanvas;
