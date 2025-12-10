import { useState, useImperativeHandle, forwardRef, useMemo } from "react";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";

// Генерируем текстуру размытого круга программно
function createBlurCircleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
    gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.4)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new THREE.CanvasTexture(canvas);
}

export type ImpactHandle = {
  addImpact: (position: THREE.Vector3, normal?: THREE.Vector3) => void;
};

export const SnowballImpacts = forwardRef<ImpactHandle>((props, ref) => {
  const [impacts, setImpacts] = useState<{ id: string; pos: [number, number, number]; quat: [number, number, number, number] }[]>([]);

  const texture = useMemo(() => createBlurCircleTexture(), []);

  useImperativeHandle(ref, () => ({
    addImpact: (position: THREE.Vector3, normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0)) => {
      const id = `${Date.now()}-${Math.random()}`; // Уникальный ключ

      // Слегка отодвигаем пятно от поверхности (чтобы не мерцало)
      const offsetPos = position.clone().add(normal.clone().multiplyScalar(0.03));

      // Вычисляем поворот: создаем пустышку и поворачиваем её "лицом" по нормали
      const dummy = new THREE.Object3D();
      dummy.position.copy(offsetPos);

      // Трюк: lookAt заставляет ось Z смотреть на цель.
      // PlaneGeometry лежит в плоскости XY (смотрит по Z).
      // Поэтому если мы скажем "смотри вдоль нормали", Plane ляжет на поверхность.
      const target = offsetPos.clone().add(normal);
      dummy.lookAt(target);

      setImpacts((prev) => [
        ...prev,
        {
          id,
          pos: [offsetPos.x, offsetPos.y, offsetPos.z],
          quat: [dummy.quaternion.x, dummy.quaternion.y, dummy.quaternion.z, dummy.quaternion.w],
        },
      ]);

      // Удаляем через 20 секунд
      setTimeout(() => {
        setImpacts((prev) => prev.filter((i) => i.id !== id));
      }, 20000);
    },
  }));

  return (
    <group>
      {impacts.map((imp) => (
        <ImpactSpot key={imp.id} position={imp.pos} quaternion={imp.quat} texture={texture} />
      ))}
    </group>
  );
});

function ImpactSpot({ position, quaternion, texture }: any) {
  return (
    <mesh position={position} quaternion={quaternion}>
      <planeGeometry args={[0.8, 0.8]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}
