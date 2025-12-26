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
  return (
    <group position={[position[0], COURSE_Y, position[2]]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow>
          <boxGeometry args={[6, 0.8, 6]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject)
            other.rigidBodyObject.setLinvel({ x: 0, y: 25, z: 65 }, true);
        }}
      >
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[5, 0.2, 5]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00ffff"
            emissiveIntensity={5}
            toneMapped={false}
          />
        </mesh>
      </RigidBody>
      <Text position={[0, 2, 0]} fontSize={1} color="cyan">
        BOOSTER
      </Text>
    </group>
  );
}

// --- 3. ПАДАЮЩАЯ ПЛИТКА (ТВОЯ РАБОЧАЯ) ---
// function FallingPlatform({
//   position,
//   id,
// }: {
//   position: [number, number, number];
//   id: string;
// }) {
//   const [status, setStatus] = useState<"stable" | "falling">("stable");
//   const ref = useRef<RapierRigidBody>(null);
//   const startPos = new THREE.Vector3(position[0], COURSE_Y, position[2]);

//   useEffect(() => {
//     const unsub = RPC.register(`fall_${id}`, (newStatus: any) =>
//       setStatus(newStatus)
//     );
//     return () => unsub();
//   }, [id]);

//   useEffect(() => {
//     if (status === "falling" && isHost()) {
//       setTimeout(() => {
//         RPC.call(`fall_${id}`, "stable", RPC.Mode.ALL);
//         ref.current?.setTranslation(startPos, true);
//         ref.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
//       }, 6000);
//     }
//   }, [status, id]);

//   return (
//     <RigidBody
//       ref={ref}
//       type={status === "falling" ? "dynamic" : "kinematicPosition"}
//       position={[position[0], COURSE_Y, position[2]]}
//       colliders="cuboid"
//       onCollisionEnter={({ other }) => {
//         if (status === "stable" && other.rigidBodyObject)
//           RPC.call(`fall_${id}`, "falling", RPC.Mode.ALL);
//       }}
//     >
//       <mesh receiveShadow>
//         <boxGeometry args={[4, 0.5, 4]} />
//         <meshStandardMaterial
//           color={status === "falling" ? "#ff0000" : "#00ff88"}
//         />
//       </mesh>
//     </RigidBody>
//   );
// }
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
      <LaunchPad position={[0, 0, 70]} />

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
        <Text position={[0, 2, 0]} fontSize={1}>
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

function VictoryZone() {
  const players = usePlayersList(true);
  const finishedCount = players.filter((p) => p.getState("atFinish")).length;
  const isMeAtFinish = myPlayer().getState("atFinish");

  useEffect(() => {
    if (isHost() && finishedCount >= players.length && players.length > 0) {
      const timer = setTimeout(() => {
        // 1. Меняем стадию игры для всех
        setState("gameStage", "RED_LIGHT_GREEN_LIGHT", true);

        // 2. Телепортируем всех в начало новой зоны (Z=300)
        players.forEach((p) => {
          p.setState("pos", { x: 0, y: COURSE_Y + 2, z: 300 });
        });
      }, 3000); // 3 секунды задержки, чтобы все успели порадоваться
      return () => clearTimeout(timer);
    }
  }, [finishedCount, players.length]);

  return (
    <RigidBody
      type="fixed"
      sensor
      position={[0, COURSE_Y, 210]}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.name === "player") {
          myPlayer().setState("atFinish", true);
        }
      }}
      onIntersectionExit={({ other }) => {
        if (other.rigidBodyObject?.name === "player") {
          myPlayer().setState("atFinish", false);
        }
      }}
    >
      <mesh>
        <boxGeometry args={[15, 2, 15]} />
        <meshStandardMaterial color="gold" opacity={0.5} transparent />
      </mesh>

      <Float speed={5}>
        <Text position={[0, 5, 0]} fontSize={1} color="white">
          PLAYERS AT FINISH: {finishedCount} / {players.length}
        </Text>
        {finishedCount === players.length && players.length > 0 && (
          <Text position={[0, 7, 0]} fontSize={0.8} color="cyan">
            ALL READY! STARTING STAGE 2...
          </Text>
        )}
      </Float>
    </RigidBody>
  );
}
