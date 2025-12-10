import { RigidBody } from "@react-three/rapier";
import { Sparkles } from "@react-three/drei";

export function ChristmasTree({ position }: { position: [number, number, number] }) {
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

      {/* Звезда (просто визуал, без физики) */}
      <mesh position={[0, 7.2, 0]}>
        <dodecahedronGeometry args={[0.5]} />
        <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
        <pointLight intensity={5} distance={5} color="yellow" />
      </mesh>

      {/* Огоньки/Мишура (эффект Sparkles) */}
      <Sparkles position={[0, 4, 0]} scale={[4, 5, 4]} count={50} speed={0.4} size={5} color="orange" />
    </group>
  );
}
