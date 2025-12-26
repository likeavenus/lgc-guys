// === GiftBox.tsx ===
import { useRef, useState, useEffect, useMemo } from "react";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Float } from "@react-three/drei";
import * as THREE from "three";

const GIFT_COLORS = [
  { box: "#e11d48", ribbon: "#fbbf24" }, // Красный с золотом
  { box: "#3b82f6", ribbon: "#f0abfc" }, // Синий с розовым
  { box: "#10b981", ribbon: "#dc2626" }, // Зеленый с красным
  { box: "#a855f7", ribbon: "#fde047" }, // Фиолетовый с желтым
  { box: "#ec4899", ribbon: "#22d3ee" }, // Розовый с cyan
  { box: "#f59e0b", ribbon: "#8b5cf6" }, // Оранжевый с фиолетовым
];

export function GiftBox({
  position,
  id,
  isDynamic = false,
}: {
  position: [number, number, number];
  id: string;
  isDynamic?: boolean; // Если true, то падает с физикой
}) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const colors = useMemo(
    () =>
      GIFT_COLORS[parseInt(id.split("_").pop() || "0") % GIFT_COLORS.length],
    [id]
  );

  // Для падающих подарков - автоудаление через 7 секунд
  useEffect(() => {
    if (isDynamic) {
      const timer = setTimeout(() => {
        // Компонент размонтируется через состояние родителя
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [isDynamic]);

  return (
    <RigidBody
      ref={bodyRef}
      type={isDynamic ? "dynamic" : "fixed"}
      position={position}
      colliders="cuboid"
      restitution={0.6} // Отскок при падении
      friction={0.8}
    >
      <group>
        {/* Основная коробка */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial
            color={colors.box}
            metalness={0.3}
            roughness={0.6}
          />
        </mesh>

        {/* Лента вертикальная */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.65, 0.1, 0.1]} />
          <meshStandardMaterial
            color={colors.ribbon}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Лента горизонтальная */}
        <mesh castShadow position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.65, 0.1, 0.1]} />
          <meshStandardMaterial
            color={colors.ribbon}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Бантик сверху */}
        <mesh castShadow position={[0, 0.35, 0]}>
          <octahedronGeometry args={[0.15, 0]} />
          <meshStandardMaterial
            color={colors.ribbon}
            emissive={colors.ribbon}
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Точечный свет для красоты */}
        {!isDynamic && (
          <pointLight
            intensity={1.5}
            distance={2}
            color={colors.ribbon}
            position={[0, 0.3, 0]}
          />
        )}
      </group>
    </RigidBody>
  );
}

// === ПАДАЮЩИЕ ПОДАРКИ (компонент-менеджер) ===
export function FallingGifts({ active }: { active: boolean }) {
  const [gifts, setGifts] = useState<
    Array<{ id: string; pos: [number, number, number] }>
  >([]);
  const nextId = useRef(0);

  useEffect(() => {
    if (!active) return;

    const interval = setInterval(() => {
      const randomX = (Math.random() - 0.5) * 25; // Под размер платформы 30x30
      const randomZ = 210 + (Math.random() - 0.5) * 25;
      const spawnY = 65; // Высота спавна

      const newGift = {
        id: `falling_gift_${nextId.current++}`,
        pos: [randomX, spawnY, randomZ] as [number, number, number],
      };

      setGifts((prev) => [...prev, newGift]);

      setTimeout(() => {
        setGifts((prev) => prev.filter((g) => g.id !== newGift.id));
      }, 7000);
    }, 300);

    return () => clearInterval(interval);
  }, [active]);

  return (
    <>
      {gifts.map((gift) => (
        <GiftBox key={gift.id} id={gift.id} position={gift.pos} isDynamic />
      ))}
    </>
  );
}
