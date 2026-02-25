"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

function useLogoTexture() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark background for cube face
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, 512, 512);

    // Subtle border
    ctx.strokeStyle = "rgba(255, 120, 0, 0.3)";
    ctx.lineWidth = 3;
    ctx.strokeRect(8, 8, 496, 496);

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Draw logo centered on the canvas face
      const logoSize = 360;
      const x = (512 - logoSize) / 2;
      const y = (512 - logoSize) / 2;
      ctx.drawImage(img, x, y, logoSize, logoSize);

      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      setTexture(tex);
    };
    img.src = "/images/QBOX_logo_upscaled.png";
  }, []);

  return texture;
}

function QCube() {
  const groupRef = useRef<THREE.Group>(null);
  const logoTexture = useLogoTexture();

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.x = t * 0.15;
      groupRef.current.rotation.y = t * 0.25;
      groupRef.current.rotation.z = t * 0.1;
    }
  });

  const edgesGeometry = useMemo(() => {
    const box = new THREE.BoxGeometry(2.6, 2.6, 2.6);
    return new THREE.EdgesGeometry(box);
  }, []);

  // Create an array of 6 identical materials for all faces
  const materials = useMemo(() => {
    if (!logoTexture) {
      return Array(6).fill(
        new THREE.MeshStandardMaterial({
          color: "#1a1a1a",
          roughness: 0.2,
          metalness: 0.9,
        })
      );
    }

    return Array(6)
      .fill(null)
      .map(() => {
        return new THREE.MeshStandardMaterial({
          map: logoTexture,
          roughness: 0.15,
          metalness: 0.85,
          emissive: new THREE.Color("#ff7800"),
          emissiveIntensity: 0.05,
        });
      });
  }, [logoTexture]);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={groupRef}>
        {/* Main cube with logo on all 6 faces */}
        <mesh castShadow material={materials}>
          <boxGeometry args={[2.6, 2.6, 2.6]} />
        </mesh>

        {/* Glowing edges */}
        <lineSegments geometry={edgesGeometry}>
          <lineBasicMaterial color="#ff7800" transparent opacity={0.7} />
        </lineSegments>

        {/* Inner glow light */}
        <pointLight
          position={[0, 0, 0]}
          color="#ff7800"
          intensity={3}
          distance={6}
        />
      </group>
    </Float>
  );
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ff7800"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial
        color="#ff7800"
        wireframe
        transparent
        opacity={0.04}
      />
    </mesh>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={["#121212"]} />
        <fog attach="fog" args={["#121212", 8, 25]} />

        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
        <directionalLight
          position={[-3, 3, -3]}
          intensity={0.4}
          color="#ff7800"
        />
        <pointLight position={[0, 5, 0]} intensity={0.5} color="#ff7800" />
        <spotLight
          position={[0, 8, 4]}
          angle={0.4}
          penumbra={0.5}
          intensity={0.6}
          color="#ffffff"
        />

        {/* Scene elements */}
        <QCube />
        <Particles />
        <GridFloor />
      </Canvas>
    </div>
  );
}
