import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { Text, Float, Billboard } from "@react-three/drei";
import { setState, getState, isHost, usePlayersList } from "playroomkit";

export function SquidGameStage() {
  const dollHeadRef = useRef<THREE.Group>(null);
  const status = getState("squidStatus") || "GREEN";

  // ЛОГИКА ХОСТА: Управление циклом
  useEffect(() => {
    if (!isHost()) return;

    let timeout: any;
    const nextStep = () => {
      const isGreen = getState("squidStatus") !== "GREEN";
      setState("squidStatus", isGreen ? "GREEN" : "RED", true);

      // Рандомные интервалы для неожиданности
      const delay = isGreen
        ? 2000 + Math.random() * 3000
        : 1500 + Math.random() * 1000;
      timeout = setTimeout(nextStep, delay);
    };

    nextStep();
    return () => clearTimeout(timeout);
  }, []);

  // АНИМАЦИЯ ГОЛОВЫ: Поворот на 180 градусов
  useFrame((state, delta) => {
    if (dollHeadRef.current) {
      const targetRotation = status === "RED" ? Math.PI : 0;
      dollHeadRef.current.rotation.y = THREE.MathUtils.lerp(
        dollHeadRef.current.rotation.y,
        targetRotation,
        delta * 8
      );
    }
  });

  return (
    <group position={[0, 0, 300]}>
      {/* ИГРОВОЕ ПОЛЕ */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 39.5, 50]} receiveShadow>
          <boxGeometry args={[40, 1, 120]} />
          <meshStandardMaterial color="#c2a385" />
        </mesh>
      </RigidBody>

      {/* КУКЛА (В конце поля на Z=100 относительно группы) */}
      <group position={[0, 40, 100]}>
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[1, 1.5, 4]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <group ref={dollHeadRef} position={[0, 5, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[1.2]} />
            <meshStandardMaterial color="#ffe0bd" />
          </mesh>
          {/* Глаза, чтобы понимать куда смотрит */}
          <mesh position={[0.4, 0.2, 1]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial color="black" />
          </mesh>
          <mesh position={[-0.4, 0.2, 1]}>
            <sphereGeometry args={[0.2]} />
            <meshStandardMaterial color="black" />
          </mesh>
        </group>

        <Billboard position={[0, 8, 0]}>
          <Text fontSize={2} color={status === "RED" ? "red" : "green"}>
            {status} LIGHT
          </Text>
        </Billboard>
      </group>

      {/* ФИНИШНАЯ ЛИНИЯ (Z=90 относительно группы) */}
      <mesh position={[0, 40.1, 90]}>
        <planeGeometry args={[40, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>

      <Stars count={1000} factor={4} />
    </group>
  );
}

function Stars({ count, factor }: { count: number; factor: number }) {
  return <primitive object={new THREE.Points()} />; // Упрощенно для FPS
}
