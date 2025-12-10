import { useState, useEffect, useRef } from "react";
import { RPC } from "playroomkit";
import { RigidBody, BallCollider, RapierRigidBody } from "@react-three/rapier";
import * as THREE from "three";

type Bullet = {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  shooterId: string;
};

export function BulletManager({ onImpact }: { onImpact?: (pos: THREE.Vector3, normal?: THREE.Vector3) => void }) {
  const [bullets, setBullets] = useState<Bullet[]>([]);

  useEffect(() => {
    const unsubscribe = RPC.register("shoot", (data) => {
      const { pos, dir, shooterId, force = 20 } = data;
      const bulletId = `${shooterId}-${Date.now()}-${Math.random()}`;
      setBullets((prev) => [
        ...prev,
        {
          id: bulletId,
          position: [pos.x, pos.y, pos.z],
          velocity: [dir.x * force, dir.y * force, dir.z * force],
          shooterId,
        },
      ]);
      setTimeout(() => {
        setBullets((prev) => prev.filter((b) => b.id !== bulletId));
      }, 3000);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  return (
    <>
      {bullets.map((bullet) => (
        <Bullet
          key={bullet.id}
          {...bullet}
          onCollision={(pos: THREE.Vector3) => {
            setBullets((prev) => prev.filter((b) => b.id !== bullet.id));

            // УПРОЩЕННАЯ ЛОГИКА НОРМАЛИ
            let normal = new THREE.Vector3(0, 1, 0); // По умолчанию - пол
            if (pos.y > 0.5) {
              // Если удар выше пола - считаем что это стена.
              // Чтобы след был вертикальным, нормаль должна быть горизонтальной.
              // Берем вектор "на нас" от стены. Грубо:
              normal = new THREE.Vector3(0, 0, 1);
            }

            onImpact?.(pos, normal);
          }}
        />
      ))}
    </>
  );
}

function Bullet({ position, velocity, shooterId, onCollision }: any) {
  const body = useRef<RapierRigidBody>(null);

  useEffect(() => {
    if (body.current) {
      body.current.setLinvel({ x: velocity[0], y: velocity[1], z: velocity[2] }, true);
    }
  }, []);

  return (
    <RigidBody
      ref={body}
      position={position}
      colliders={false}
      type="dynamic"
      userData={{ type: "bullet", shooterId }}
      onCollisionEnter={() => {
        if (!body.current) return;
        const currentPos = body.current.translation();
        onCollision(new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z));
      }}
    >
      <BallCollider args={[0.2]} />
      <mesh>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
      </mesh>
    </RigidBody>
  );
}
