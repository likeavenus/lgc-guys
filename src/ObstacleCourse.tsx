import React, { useRef, useState, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";
import { Text, Float } from "@react-three/drei";
import { RPC, isHost, myPlayer, setState, usePlayersList } from "playroomkit";

const COURSE_Y = 40;

// --- 1. СТЕКЛЯННАЯ ПЛИТКА (SQUID GAME) ---
function GlassTile({
  position,
  id,
  isFragile,
}: {
  position: [number, number, number];
  id: string;
  isFragile: boolean;
}) {
  const [status, setStatus] = useState<"intact" | "broken">("intact");
  const ref = useRef<RapierRigidBody>(null);

  useEffect(() => {
    const unsub = RPC.register(`glass_${id}`, (s: any) => setStatus(s));
    return () => unsub();
  }, [id]);

  return (
    <RigidBody
      ref={ref}
      type={status === "broken" ? "dynamic" : "kinematicPosition"}
      position={[position[0], COURSE_Y, position[2]]}
      colliders="cuboid"
      onCollisionEnter={({ other }) => {
        if (status === "intact" && other.rigidBodyObject) {
          if (isFragile) {
            RPC.call(`glass_${id}`, "broken", RPC.Mode.ALL);
          }
        }
      }}
    >
      <mesh receiveShadow>
        <boxGeometry args={[3.5, 0.2, 5]} />
        <meshStandardMaterial
          color={status === "broken" ? "#330000" : "#aaddff"}
          transparent
          opacity={0.5}
          metalness={1}
        />
      </mesh>
    </RigidBody>
  );
}

// --- 2. ТРАМПЛИН (ТВОЙ РАБОЧИЙ) ---
function LaunchPad({ position }: { position: [number, number, number] }) {
  const [isActivated, setIsActivated] = useState(false);
  const padRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    if (padRef.current) {
      // Постоянная пульсация
      padRef.current.position.y = Math.sin(t * 3) * 0.05;

      // Эффект сжатия при активации
      if (isActivated) {
        const scale = Math.max(
          0.8,
          1 - (state.clock.getElapsedTime() % 0.3) * 2
        );
        padRef.current.scale.set(1, scale, 1);
      } else {
        padRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }

    if (glowRef.current) {
      // Пульсирующий свет
      glowRef.current.intensity = 5 + Math.sin(t * 5) * 2;
    }
  });

  useEffect(() => {
    if (isActivated) {
      const timer = setTimeout(() => setIsActivated(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isActivated]);

  return (
    <group position={position}>
      {/* База трамплина */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow castShadow>
          <boxGeometry args={[6, 0.8, 6]} />
          <meshStandardMaterial
            color="#0a0a0a"
            metalness={0.8}
            roughness={0.3}
          />
        </mesh>

        {/* Декоративные полосы по краям */}
        {[-2.5, 2.5].map((x, i) => (
          <mesh key={i} position={[x, 0.41, 0]}>
            <boxGeometry args={[0.3, 0.1, 6]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={2}
            />
          </mesh>
        ))}
        {[-2.5, 2.5].map((z, i) => (
          <mesh key={`z${i}`} position={[0, 0.41, z]}>
            <boxGeometry args={[6, 0.1, 0.3]} />
            <meshStandardMaterial
              color="#00ffff"
              emissive="#00ffff"
              emissiveIntensity={2}
            />
          </mesh>
        ))}
      </RigidBody>

      {/* Активная зона */}
      <RigidBody
        type="fixed"
        position={[0, 0.5, 0]}
        colliders="cuboid"
        onCollisionEnter={({ other }) => {
          if (other.rigidBody) {
            other.rigidBody.setLinvel({ x: 0, y: 31, z: 70 }, true);
            setIsActivated(true);
          }
        }}
      >
        <mesh ref={padRef} position={[0, 0, 0]} castShadow>
          <boxGeometry args={[5, 0.3, 5]} />
          <meshStandardMaterial
            color={isActivated ? "#ffffff" : "#00ffff"}
            emissive={isActivated ? "#00ffff" : "#00ffff"}
            emissiveIntensity={isActivated ? 8 : 3}
            toneMapped={false}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Яркий свет снизу */}
        <pointLight
          ref={glowRef}
          position={[0, -0.3, 0]}
          intensity={5}
          distance={8}
          color="#00ffff"
          castShadow={false}
        />

        {/* Частицы вокруг (статичные кольца) */}
        {[0.3, 0.6, 0.9].map((offset, i) => (
          <Float
            key={i}
            speed={2 + i}
            rotationIntensity={0.2}
            floatIntensity={0.5}
          >
            <mesh position={[0, offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[3 + i * 0.5, 0.05, 8, 32]} />
              <meshStandardMaterial
                color="#00ffff"
                emissive="#00ffff"
                emissiveIntensity={2}
                transparent
                opacity={0.4 - i * 0.1}
              />
            </mesh>
          </Float>
        ))}
      </RigidBody>

      {/* Анимированный текст */}
      <Float speed={1.5} floatIntensity={0.3}>
        <Text
          position={[0, 2.5, 0]}
          rotation={[0, Math.PI, 0]}
          fontSize={1.2}
          color="#00ffff"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          BOOSTER
        </Text>
      </Float>

      {/* Стрелки вверх */}
      {[-1, 0, 1].map((x, i) => (
        <Float key={i} speed={3 + i * 0.5} floatIntensity={1}>
          <Text
            position={[x * 1.5, 1.5 + i * 0.2, 0]}
            rotation={[0, Math.PI, 0]}
            fontSize={0.8}
            color="#ffff00"
            anchorX="center"
          >
            ↑
          </Text>
        </Float>
      ))}
    </group>
  );
}

// 1. В ObstacleCourse при рендере списка:
<group position={[0, 0, 305]}>
  {[0, 1, 2, 3, 4, 5, 6].map((i) => {
    // ВАЖНО: Рассчитываем мировую позицию здесь!
    // Группа на 305 по Z + смещение плитки i * 8
    const worldZ = 305 + (i * 8 - 10);
    const worldX = i % 2 === 0 ? 2 : -2;

    return (
      <FallingPlatform
        key={i}
        id={`tile_${i}`}
        // Передаем уже готовую мировую позицию
        position={[worldX, COURSE_Y, worldZ]}
      />
    );
  })}
</group>;

// 2. В самом FallingPlatform УБИРАЕМ позицию у RigidBody и ставим через Ref:
function FallingPlatform({
  position,
  id,
}: {
  position: [number, number, number];
  id: string;
}) {
  const ref = useRef<RapierRigidBody>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const [status, setStatus] = useState<"stable" | "warning" | "falling">(
    "stable"
  );

  // Синхронизация состояния через RPC
  useEffect(() => {
    const unsub = RPC.register(
      `fall_${id}`,
      (newStatus: "stable" | "warning" | "falling") => {
        setStatus(newStatus);
      }
    );
    return () => unsub();
  }, [id]);

  // Логика таймингов (только хост)
  useEffect(() => {
    if (!isHost()) return;

    if (status === "warning") {
      const t = setTimeout(
        () => RPC.call(`fall_${id}`, "falling", RPC.Mode.ALL),
        800
      );
      return () => clearTimeout(t);
    }

    if (status === "falling") {
      const t = setTimeout(
        () => RPC.call(`fall_${id}`, "stable", RPC.Mode.ALL),
        5000
      );
      return () => clearTimeout(t);
    }
  }, [status, id]);

  // Инициализация и управление физикой
  useEffect(() => {
    if (!ref.current) return;

    if (status === "stable") {
      ref.current.setBodyType(2, true); // Fixed
      ref.current.setTranslation(
        { x: position[0], y: position[1], z: position[2] },
        true
      );
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ref.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } else if (status === "falling") {
      ref.current.setBodyType(0, true); // Dynamic
    }
  }, [status, position]);

  // Визуальное дрожание меша
  useFrame((state) => {
    if (status === "warning" && meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.position.x = Math.sin(t * 60) * 0.08;
      meshRef.current.position.z = Math.cos(t * 60) * 0.08;
    } else if (meshRef.current) {
      meshRef.current.position.set(0, 0, 0);
    }
  });

  return (
    <RigidBody
      ref={ref}
      type="fixed"
      position={position}
      colliders="cuboid"
      friction={1.5}
      restitution={0}
      onCollisionEnter={({ other }) => {
        if (status === "stable" && other.rigidBody) {
          RPC.call(`fall_${id}`, "warning", RPC.Mode.ALL);
        }
      }}
    >
      <mesh ref={meshRef} receiveShadow castShadow>
        <boxGeometry args={[4, 0.5, 4]} />
        <meshStandardMaterial
          color={
            status === "stable"
              ? "#00ff88"
              : status === "warning"
              ? "#ffaa00"
              : "#ff0000"
          }
          emissive={status === "warning" ? "#ffaa00" : "#000"}
          emissiveIntensity={status === "warning" ? 2 : 0}
        />
      </mesh>
    </RigidBody>
  );
}

export function ObstacleCourse() {
  return (
    <group>
      {/* 1. СТАРТ */}
      <RigidBody
        type="fixed"
        position={[0, COURSE_Y - 0.5, 0]}
        colliders="cuboid"
      >
        <mesh>
          <boxGeometry args={[12, 1, 12]} />
          <meshStandardMaterial color="#050505" />
        </mesh>
        <Text position={[0, 3, 0]} fontSize={1}>
          SQUID GAME START
        </Text>
      </RigidBody>

      {/* 2. СТЕКЛЯННЫЙ МОСТ (ИЗ КАЛЬМАРА) */}
      <group position={[0, 0, 15]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <group key={i} position={[0, 0, i * 6]}>
            <GlassTile
              position={[-2.5, 0, 0]}
              id={`g_l_${i}`}
              isFragile={i % 2 === 0}
            />
            <GlassTile
              position={[2.5, 0, 0]}
              id={`g_r_${i}`}
              isFragile={i % 2 !== 0}
            />
          </group>
        ))}
      </group>

      {/* 3. ПРОМЕЖУТОЧНАЯ ЗОНА */}
      <RigidBody
        type="fixed"
        position={[0, COURSE_Y - 0.5, 55]}
        colliders="cuboid"
      >
        <mesh>
          <boxGeometry args={[15, 1, 10]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </RigidBody>

      {/* 4. ТРАМПЛИН */}
      <LaunchPad position={[0, 40, 67]} />

      {/* Плавающие кольца-подсказки */}
      <FloatingRing position={[0, COURSE_Y + 15, 85]} />
      <FloatingRing position={[0, COURSE_Y + 20, 100]} />

      {/* Две движущиеся платформы для "посадки" */}
      <MovingPlatform
        position={[-4, COURSE_Y, 110]}
        range={7}
        axis="x"
        speed={1.5}
      />

      <MovingPlatform
        position={[-4, COURSE_Y, 100]}
        range={2}
        axis="x"
        speed={1.5}
      />

      <MovingPlatform
        position={[8, COURSE_Y, 100]}
        range={6}
        axis="x"
        speed={1.9}
      />

      <MovingPlatform
        position={[8, COURSE_Y, 91]}
        range={4}
        axis="x"
        speed={1.3}
      />

      <MovingPlatform
        position={[8, COURSE_Y, 86]}
        range={10}
        axis="x"
        speed={1.1}
      />

      <MovingPlatform
        position={[8, COURSE_Y, 80]}
        range={4}
        axis="x"
        speed={1.1}
      />

      {/* 5. LANDING ZONE */}
      <RigidBody
        type="fixed"
        position={[0, COURSE_Y - 0.5, 130]}
        colliders="cuboid"
      >
        <mesh>
          <boxGeometry args={[15, 1, 15]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <Text position={[0, 2, 0]} rotation={[0, Math.PI * 1, 0]} fontSize={1}>
          LANDING ZONE
        </Text>
      </RigidBody>

      {/* 6. ПАДАЮЩИЕ ПЛИТКИ */}

      <group>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => {
          // Считаем АБСОЛЮТНЫЙ Z: база (305) + смещение (i * 8)
          const absoluteZ = 145 + i * 8;
          const absoluteX = i % 2 === 0 ? 2 : -2;

          return (
            <FallingPlatform
              key={i}
              id={`tile_${i}`}
              // Передаем плоский массив координат, без вложенности
              position={[absoluteX, COURSE_Y, absoluteZ]}
            />
          );
        })}
      </group>

      {/* 7. ФИНИШ */}

      <FinishZone />
    </group>
  );
}

function FinishZone() {
  const players = usePlayersList();
  const [count, setCount] = useState(0);

  useFrame(() => {
    // Считаем игроков, которые по Z ушли дальше 200м (финиш)
    const reached = players.filter(
      (p) => (p.getState("pos")?.z || 0) > 205
    ).length;
    setCount(reached);

    // Если все (минимум 2) дошли — меняем стадию игры
    if (reached >= players.length && players.length > 0 && isHost()) {
      // setState("gameStage", "RED_LIGHT_GREEN_LIGHT", true);
    }
  });

  return (
    <RigidBody
      type="fixed"
      position={[0, COURSE_Y - 0.5, 210]}
      colliders="cuboid"
    >
      <mesh>
        <boxGeometry args={[20, 1, 20]} />
        <meshStandardMaterial color="gold" />
      </mesh>
      <Text
        position={[0, 4, 15]}
        rotation={[0, Math.PI * 1, 0]}
        fontSize={1}
        color="white"
      >
        PLAYERS READY: {count} / {players.length}
      </Text>
    </RigidBody>
  );
}

// --- ДВИЖУЩАЯСЯ ПЛАТФОРМА (НОВЫЙ КОМПОНЕНТ) ---
function MovingPlatform({
  position,
  range = 6,
  axis = "x",
  speed = 2,
}: {
  position: [number, number, number];
  range?: number;
  axis?: "x" | "z";
  speed?: number;
}) {
  const ref = useRef<RapierRigidBody>(null);
  const startPos = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      const offset = Math.sin(t * speed) * range;

      if (axis === "x") {
        ref.current.setNextKinematicTranslation({
          x: startPos.x + offset,
          y: startPos.y,
          z: startPos.z,
        });
      } else {
        ref.current.setNextKinematicTranslation({
          x: startPos.x,
          y: startPos.y,
          z: startPos.z + offset,
        });
      }
    }
  });

  return (
    <RigidBody
      ref={ref}
      type="kinematicPosition"
      position={position}
      colliders="cuboid"
      friction={2}
    >
      <mesh receiveShadow castShadow userData={{ isMovingPlatform: true }}>
        <boxGeometry args={[5, 0.6, 5]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.2} />
      </mesh>
    </RigidBody>
  );
}

// --- ПЛАВАЮЩИЕ КОЛЬЦА (ДЛЯ НАПРАВЛЕНИЯ) ---
function FloatingRing({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh position={position}>
        <torusGeometry args={[2, 0.3, 16, 32]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#fbbf24"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
}
