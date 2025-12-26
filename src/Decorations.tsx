import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, MeshCollider, CylinderCollider } from "@react-three/rapier";
import { Instances, Instance } from "@react-three/drei";

// --- Декоративные элементы ---

export function Fireplace({ position, rotation }: any) {
  const fireRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (fireRef.current) {
      fireRef.current.intensity = 1.5 + Math.sin(clock.elapsedTime * 10) * 0.5;
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Каминная полка */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[2.5, 2, 0.8]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {/* Огонь (имитация) */}
      <mesh position={[0, 0.5, 0.41]}>
        <planeGeometry args={[1.5, 1]} />
        <meshBasicMaterial color="#ff5500" />
      </mesh>
      <pointLight
        ref={fireRef}
        position={[0, 0.5, 1]}
        color="#ff5500"
        distance={8}
        intensity={2}
      />
    </group>
  );
}

// Оптимизированный лес
export const OptimizedForest = ({ trees }: { trees: any[] }) => {
  return (
    // Группируем физику: статические объекты лучше держать в одном RigidBody типа fixed
    <RigidBody type="fixed" colliders={false}>
      <Instances>
        {/* Используем одну геометрию конуса для всех веток всех деревьев */}
        <coneGeometry args={[2, 4, 8]} />
        <meshStandardMaterial color="#054523" />

        {trees.map((tree, i) => (
          <group key={i} position={tree.pos} scale={tree.scale}>
            {/* Рендерим 3 яруса веток как инстансы одной геометрии */}
            <Instance position={[0, 2, 0]} scale={0.6} />
            <Instance position={[0, 3.5, 0]} scale={0.4} />
            <Instance position={[0, 4.5, 0]} scale={0.2} />

            {/* Добавляем коллизию только там, где она реально нужна (цилиндр в центре) */}
            <CylinderCollider args={[2.5, 1]} position={[0, 2.5, 0]} />
          </group>
        ))}
      </Instances>
    </RigidBody>
  );
};
export function ModernSofa({ position, rotation }: any) {
  return (
    <group position={position} rotation={rotation}>
      {/* Сиденье */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[3, 0.4, 1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* Спинка */}
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[3, 0.6, 0.2]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {/* Подлокотники */}
      <mesh position={[-1.4, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      <mesh position={[1.4, 0.5, 0]} castShadow>
        <boxGeometry args={[0.2, 0.5, 1]} />
        <meshStandardMaterial color="#444" />
      </mesh>
    </group>
  );
}

export function Snowman({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <RigidBody
      position={position}
      rotation={rotation}
      colliders="hull"
      type="dynamic"
    >
      <group>
        {/* Нижний шар */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Средний шар */}
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.45, 32, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Голова */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="white" />
        </mesh>
        {/* Нос-морковка */}
        <mesh position={[0, 2.1, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.06, 0.3, 32]} />
          <meshStandardMaterial color="orange" />
        </mesh>
      </group>
    </RigidBody>
  );
}

// --- Дома ---

export function ModernHouse({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="hull">
        {/* Основной блок (первый этаж) */}
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8, 4, 8]} />
          <meshStandardMaterial color="#eeeeee" />
        </mesh>

        {/* Второй этаж (сдвинут) */}
        <mesh position={[1, 5, 0]} castShadow receiveShadow>
          <boxGeometry args={[5, 3, 7]} />
          <meshStandardMaterial color="#333333" />
        </mesh>

        {/* Панорамное окно снизу */}
        <mesh position={[2, 2, 4.05]}>
          <planeGeometry args={[3, 2.5]} />
          <meshStandardMaterial
            color="#88ccff"
            metalness={0.8}
            roughness={0.1}
            emissive="#001133"
          />
        </mesh>

        {/* Окно сверху */}
        <mesh position={[2, 5, 3.55]}>
          <planeGeometry args={[2, 1.5]} />
          <meshStandardMaterial
            color="#88ccff"
            metalness={0.8}
            roughness={0.1}
            emissive="#001133"
          />
        </mesh>

        {/* Дверь */}
        <mesh position={[-2, 1, 4.05]}>
          <boxGeometry args={[1.5, 2.2, 0.1]} />
          <meshStandardMaterial color="#4a3c31" />
        </mesh>

        {/* Входная плита (крыльцо) */}
        <mesh position={[-2, 0.1, 5]}>
          <boxGeometry args={[2, 0.2, 2]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </RigidBody>
    </group>
  );
}

export function ClassicHouse({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RigidBody type="fixed" colliders="hull">
        {/* Стены */}
        <mesh position={[0, 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[6, 4, 5]} />
          <meshStandardMaterial color="#8B4513" />{" "}
          {/* Коричневый (дерево/кирпич) */}
        </mesh>

        {/* Крыша (призма через CylinderGeometry с 3 сегментами) */}
        <mesh position={[0, 7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          {/* radiusTop, radiusBottom, height, radialSegments */}
          <cylinderGeometry args={[0, 4.5, 7, 4]} />
          <meshStandardMaterial color="#2c3e50" />
        </mesh>

        {/* Снег на крыше */}
        <mesh position={[0, 7.1, 0]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0, 4.6, 7.1, 4]} />
          <meshStandardMaterial color="white" />
        </mesh>

        {/* Дверь */}
        <mesh position={[0, 1.1, 2.55]}>
          <boxGeometry args={[1.2, 2.2, 0.1]} />
          <meshStandardMaterial color="#3e2723" />
        </mesh>

        {/* Ручка двери */}
        <mesh position={[0.4, 1.1, 2.6]}>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="gold" />
        </mesh>

        {/* Окна */}
        <group>
          {/* Левое окно */}
          <mesh position={[-1.8, 2.5, 2.55]}>
            <boxGeometry args={[1.2, 1.2, 0.1]} />
            <meshStandardMaterial
              color="#ffeba7"
              emissive="#ffaa00"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Рама */}
          <mesh position={[-1.8, 2.5, 2.6]}>
            <boxGeometry args={[1.3, 0.1, 0.1]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          <mesh position={[-1.8, 2.5, 2.6]}>
            <boxGeometry args={[0.1, 1.3, 0.1]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>

          {/* Правое окно */}
          <mesh position={[1.8, 2.5, 2.55]}>
            <boxGeometry args={[1.2, 1.2, 0.1]} />
            <meshStandardMaterial
              color="#ffeba7"
              emissive="#ffaa00"
              emissiveIntensity={0.5}
            />
          </mesh>
          <mesh position={[1.8, 2.5, 2.6]}>
            <boxGeometry args={[1.3, 0.1, 0.1]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
          <mesh position={[1.8, 2.5, 2.6]}>
            <boxGeometry args={[0.1, 1.3, 0.1]} />
            <meshStandardMaterial color="#3e2723" />
          </mesh>
        </group>

        {/* Труба */}
        <mesh position={[1.5, 8, -1]}>
          <boxGeometry args={[0.6, 2, 0.6]} />
          <meshStandardMaterial color="#555" />
        </mesh>

        {/* Дым из трубы (статичный, но можно анимировать) */}
        <mesh position={[1.5, 6.2, -1]}>
          <sphereGeometry args={[0.3]} />
          <meshStandardMaterial color="#ccc" transparent opacity={0.6} />
        </mesh>

        {/* Основание крыльца */}
        <mesh position={[0, 0.1, 3]}>
          <boxGeometry args={[2, 0.2, 1]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </RigidBody>
    </group>
  );
}
