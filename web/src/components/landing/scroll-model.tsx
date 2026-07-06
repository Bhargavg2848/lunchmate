"use client";

import { Component, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, OrbitControls, useGLTF } from "@react-three/drei";
import { Group, MathUtils } from "three";
import Image from "next/image";

type ModelProps = { targetRotation: number };

function PlaceholderTiffin({ targetRotation }: ModelProps) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.08);
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.03;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[1, 1.05, 0.6, 48]} />
        <meshStandardMaterial color="#C9971F" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.92, 0.95, 0.6, 48]} />
        <meshStandardMaterial color="#C9971F" metalness={0.8} roughness={0.28} />
      </mesh>
      <mesh position={[0, 1.43, 0]}>
        <sphereGeometry args={[0.8, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#E8C468" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0.75, 1.45, -0.05]} rotation={[0.15, -0.4, 0.8]}>
        <planeGeometry args={[1.9, 0.65, 32, 8]} />
        <meshStandardMaterial color="#2F6B4F" roughness={0.45} metalness={0.05} />
      </mesh>
    </group>
  );
}

function LoadedTiffin({ targetRotation }: ModelProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useGLTF("/lunchmate_3d.glb");

  const cloned = useMemo(() => scene.clone(), [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, targetRotation, 0.08);
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.03;
  });

  return <primitive ref={groupRef} object={cloned} scale={1.15} position={[0, -0.5, 0]} />;
}

class ModelErrorBoundary extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function ScrollModel() {
  const [progress, setProgress] = useState(0);
  const lowMemory =
    typeof navigator !== "undefined" &&
    typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === "number" &&
    ((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8) <= 4;
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const useFallbackImage = prefersReducedMotion || lowMemory;

  useEffect(() => {
    if (useFallbackImage) {
      return;
    }

    const onScroll = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const p = Math.min(Math.max(window.scrollY / max, 0), 1);
      setProgress(p);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [useFallbackImage]);

  if (useFallbackImage) {
    return (
      <Image
        src="/lunchmate-fallback.svg"
        alt="Lunchmate tiffin logo fallback"
        width={360}
        height={360}
        className="mx-auto h-[360px] w-[360px]"
      />
    );
  }

  const targetRotation = progress * Math.PI * 2;

  return (
    <div className="h-[460px] w-full rounded-3xl border border-[#e8c468]/40 bg-white/70 shadow-xl">
      <Canvas camera={{ position: [0, 1.3, 5], fov: 42 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 3]} intensity={2} />
        <directionalLight position={[-4, 3, 1]} intensity={0.7} />
        <Suspense fallback={<PlaceholderTiffin targetRotation={targetRotation} />}>
          <ModelErrorBoundary fallback={<PlaceholderTiffin targetRotation={targetRotation} />}>
            <LoadedTiffin targetRotation={targetRotation} />
          </ModelErrorBoundary>
        </Suspense>
        <Environment preset="city" />
        <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
}

useGLTF.preload("/lunchmate_3d.glb");
