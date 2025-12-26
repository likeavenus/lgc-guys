import { RigidBody } from "@react-three/rapier";
import { Sparkles } from "@react-three/drei";
import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

const tempColor = new THREE.Color();

function Lights({ count = 100 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Палитра праздничных цветов
  const palette = ["#ff0000", "#00ff00", "#0088ff", "#ffcc00", "#ff00ff"];

  const lightData = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = i / count;
      const angle = t * Math.PI * 14;
      const height = 1.8 + t * 5.2;
      const radius = 2.4 * (1 - t * 0.9);
      return {
        pos: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
        color: palette[i % palette.length],
        speed: 2 + Math.random() * 3,
      };
    });
  }, [count]);

  // Устанавливаем цвета один раз при старте
  useEffect(() => {
    if (!meshRef.current) return;
    lightData.forEach((data, i) => {
      tempColor.set(data.color);
      meshRef.current!.setColorAt(i, tempColor);
    });
    meshRef.current.instanceColor!.needsUpdate = true;
  }, [lightData]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    lightData.forEach((data, i) => {
      // Индивидуальное мерцание
      const scale = 0.7 + Math.sin(time * data.speed) * 0.3;
      dummy.position.set(data.pos[0], data.pos[1], data.pos[2]);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      {/* meshStandardMaterial с emissive заставит их "гореть" */}
      <meshStandardMaterial
        emissive="#ffffff"
        emissiveIntensity={2}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

export function ChristmasTree({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* Ствол - физический */}
      <RigidBody type="fixed" colliders="hull">
        <mesh position={[0, 1, 0]} castShadow>
          <cylinderGeometry args={[0.5, 0.8, 2, 8]} />
          <meshStandardMaterial color="#5c4033" />
        </mesh>

        {/* Ветки - 3 конуса друг на друге */}
        <mesh position={[0, 3, 0]} castShadow>
          <coneGeometry args={[2.5, 3, 8]} />
          <meshStandardMaterial color="#0f5f13" />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <coneGeometry args={[2, 2.5, 8]} />
          <meshStandardMaterial color="#166d1a" />
        </mesh>
        <mesh position={[0, 6, 0]} castShadow>
          <coneGeometry args={[1.2, 2, 8]} />
          <meshStandardMaterial color="#1e7e22" />
        </mesh>
      </RigidBody>

      {/* <Lights count={100} /> */}

      {/* Звезда (просто визуал, без физики) */}
      <mesh position={[0, 7.2, 0]}>
        <dodecahedronGeometry args={[0.5]} />
        <meshStandardMaterial
          color="yellow"
          emissive="yellow"
          emissiveIntensity={2}
        />
        <pointLight intensity={5} distance={5} color="yellow" />
      </mesh>

      {/* Огоньки/Мишура (эффект Sparkles) */}
      <Sparkles
        position={[0, 4, 0]}
        scale={[4, 5, 4]}
        count={50}
        speed={0.4}
        size={9}
        color="orange"
      />
    </group>
  );
}
