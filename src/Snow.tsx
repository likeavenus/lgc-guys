import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1000;

export function Snow() {
  const mesh = useRef<THREE.InstancedMesh>(null);

  // Генерируем начальные позиции
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < COUNT; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.01 + Math.random() / 200;
      const xOffset = Math.random() * 100 - 50;
      const zOffset = Math.random() * 100 - 50;
      const yOffset = Math.random() * 50 + 10;
      temp.push({ t, factor, speed, xOffset, yOffset, zOffset });
    }
    return temp;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;

    particles.forEach((particle, i) => {
      // Анимация падения
      let { yOffset, speed } = particle;

      // Меняем Y (падаем вниз)
      particle.yOffset -= speed * 10; // Скорость падения

      // Если упал ниже земли (-5), возвращаем наверх
      if (particle.yOffset < -5) {
        particle.yOffset = 50;
      }

      // Небольшое покачивание по X
      dummy.position.set(particle.xOffset + Math.sin(particle.t + particle.yOffset) * 2, particle.yOffset, particle.zOffset);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      {/* Маленькие белые шарики */}
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshBasicMaterial color="white" />
    </instancedMesh>
  );
}
