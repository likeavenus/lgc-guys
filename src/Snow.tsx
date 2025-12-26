import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1500;

export function Snow() {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const { camera } = useThree();

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      // РАВНОМЕРНОЕ РАСПРЕДЕЛЕНИЕ ВОКРУГ КАМЕРЫ (радиус от -40 до +40)
      const xOffset = (Math.random() - 0.5) * 80; // -40 до +40
      const zOffset = (Math.random() - 0.5) * 80; // -40 до +40
      const yOffset = Math.random() * 60 + 10;
      temp.push({ t, speed, xOffset, yOffset, zOffset });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;

    const camPos = camera.position;

    particles.forEach((particle, i) => {
      particle.yOffset -= particle.speed * 10;

      if (particle.yOffset < -5) {
        particle.yOffset = 60;
        // При перезапуске снежинки обновляем позицию вокруг камеры
        particle.xOffset = (Math.random() - 0.5) * 80;
        particle.zOffset = (Math.random() - 0.5) * 100;
      }

      // Позиция относительно ЦЕНТРА камеры
      const worldX =
        camPos.x +
        particle.xOffset +
        Math.sin(particle.t + particle.yOffset) * 2;
      const worldZ = camPos.z + particle.zOffset;

      dummy.position.set(worldX, particle.yOffset, worldZ);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });

    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.1, 6, 6]} />
      <meshStandardMaterial
        color="#ffffff"
        transparent
        opacity={0.8}
        roughness={0.3}
        metalness={0.1}
        side={THREE.DoubleSide} // РИСУЕМ С ОБЕИХ СТОРОН
        depthWrite={false} // НЕ ПИШЕМ В БУФЕР ГЛУБИНЫ
      />
    </instancedMesh>
  );
}
