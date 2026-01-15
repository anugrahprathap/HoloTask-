
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Define local components to fix JSX.IntrinsicElements type errors in strict environments
// This ensures that 'group', 'mesh', etc. are recognized as valid React components.
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const TorusGeometry = 'torusGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const AmbientLight = 'ambientLight' as any;
const PointLight = 'pointLight' as any;

const ProductivityCore = ({ efficiency }: { efficiency: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Scale and color based on efficiency
  const scale = 1.5 + efficiency * 1.5;
  const color = new THREE.Color().lerpColors(
    new THREE.Color('#06b6d4'), // Cyan
    new THREE.Color('#a855f7'), // Purple
    efficiency
  );

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Group>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere ref={meshRef} args={[1, 64, 64]} scale={scale}>
          <MeshDistortMaterial
            color={color}
            speed={2}
            distort={0.4 + efficiency * 0.3}
            radius={1}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
          />
        </Sphere>
      </Float>
      
      {/* Outer energy ring */}
      <Mesh rotation={[Math.PI / 2, 0, 0]}>
        <TorusGeometry args={[2.5 * scale, 0.02, 16, 100]} />
        <MeshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </Mesh>
    </Group>
  );
};

const StarField = () => {
  const count = 2000;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </Points>
  );
};

const HoloCore: React.FC<{ efficiency: number }> = ({ efficiency }) => {
  return (
    <div className="fixed inset-0 -z-10 bg-[#020617]">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <AmbientLight intensity={0.4} />
        <PointLight position={[10, 10, 10]} intensity={1} color="#06b6d4" />
        <PointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
        <ProductivityCore efficiency={efficiency} />
        <StarField />
      </Canvas>
    </div>
  );
};

export default HoloCore;
