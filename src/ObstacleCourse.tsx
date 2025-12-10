import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody, RapierRigidBody, CuboidCollider, CylinderCollider } from "@react-three/rapier";
import { Text } from "@react-three/drei";

// --- ВСПОМОГАТЕЛЬНЫЕ КОМПОНЕНТЫ ---

function Platform({
  position,
  args,
  color = "#88aaff",
  friction = 1,
}: {
  position: [number, number, number];
  args: [number, number, number];
  color?: string;
  friction?: number;
}) {
  return (
    <RigidBody type="fixed" friction={friction} position={position} colliders="cuboid">
      <mesh receiveShadow>
        <boxGeometry args={args} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

// --- БАТУТ (JUMP PAD) ---
function JumpPad({ position }: { position: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="trimesh" position={position}>
      {/* Визуальная часть */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[2, 2, 0.2, 32]} />
        <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={2} />
      </mesh>

      {/* Текст */}
      <Text position={[0, 1.5, 0]} fontSize={0.8} color="white" anchorX="center" anchorY="middle">
        JUMP TO START!
      </Text>

      {/* Сенсор для логики прыжка (высокий цилиндр) */}
      <CylinderCollider args={[1, 2]} sensor userData={{ isJumpPad: true }} />
    </RigidBody>
  );
}

// 1. ВРАЩАЮЩАЯСЯ БАЛКА
function Spinner({ position, speed = 1 }: { position: [number, number, number]; speed?: number }) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const time = clock.getElapsedTime();
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), time * speed);
      ref.current.setNextKinematicRotation(q);
    }
  });

  return (
    <group position={position}>
      <Platform position={[0, -0.5, 0]} args={[3, 1, 3]} color="#555" />
      <RigidBody ref={ref} type="kinematicPosition" position={[0, 1, 0]} colliders="cuboid">
        <mesh castShadow>
          <boxGeometry args={[12, 0.5, 0.5]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
      </RigidBody>
    </group>
  );
}

// 2. КОМАНДНЫЙ МОСТ
function TeamBridge({ position }: { position: [number, number, number] }) {
  const [pressed, setPressed] = useState(false);
  const bridgeRef = useRef<RapierRigidBody>(null);

  useFrame((_state, delta) => {
    if (bridgeRef.current) {
      const currentPos = bridgeRef.current.translation();
      const targetZ = pressed ? position[2] + 4 : position[2] - 3;
      const newZ = THREE.MathUtils.lerp(currentPos.z, targetZ, delta * 2);
      bridgeRef.current.setNextKinematicTranslation({ x: position[0], y: position[1], z: newZ });
    }
  });

  return (
    <group>
      {/* Кнопка активации */}
      <RigidBody type="fixed" position={[position[0] - 5, position[1], position[2]]}>
        <CuboidCollider
          args={[1.5, 0.1, 1.5]}
          sensor
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject) setPressed(true);
          }}
          onIntersectionExit={({ other }) => {
            if (other.rigidBodyObject) setPressed(false);
          }}
        />
        <mesh position={[0, -0.4, 0]}>
          <boxGeometry args={[3, 0.2, 3]} />
          <meshStandardMaterial color={pressed ? "#00ff00" : "#ff0000"} />
        </mesh>
        <Text position={[0, 1, 0]} fontSize={0.5} color="white">
          {pressed ? "BRIDGE ACTIVE" : "HOLD TO ACTIVATE BRIDGE"}
        </Text>
      </RigidBody>

      {/* Мост */}
      <RigidBody ref={bridgeRef} type="kinematicPosition" position={position} colliders="cuboid">
        <mesh receiveShadow>
          <boxGeometry args={[4, 0.5, 8]} />
          <meshStandardMaterial color="#88ccff" />
        </mesh>
      </RigidBody>
    </group>
  );
}

// 3. ДВИЖУЩИЕСЯ ПЛАТФОРМЫ
function MovingPlatform({
  startPos,
  endPos,
  speed = 1,
  delay = 0,
}: {
  startPos: [number, number, number];
  endPos: [number, number, number];
  speed?: number;
  delay?: number;
}) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const time = clock.getElapsedTime() + delay;
      const t = (Math.sin(time * speed) + 1) / 2;
      const x = THREE.MathUtils.lerp(startPos[0], endPos[0], t);
      const y = THREE.MathUtils.lerp(startPos[1], endPos[1], t);
      const z = THREE.MathUtils.lerp(startPos[2], endPos[2], t);
      ref.current.setNextKinematicTranslation({ x, y, z });
    }
  });

  return (
    <RigidBody ref={ref} type="kinematicPosition" colliders="cuboid">
      <mesh receiveShadow castShadow>
        <boxGeometry args={[3, 0.5, 3]} />
        <meshStandardMaterial color="#ccaaff" />
      </mesh>
    </RigidBody>
  );
}

// 4. ПАДАЮЩИЕ ПЛАТФОРМЫ
function FallingPlatform({ position }: { position: [number, number, number] }) {
  const [falling, setFalling] = useState(false);
  const [color, setColor] = useState("#44ff44");
  const ref = useRef<RapierRigidBody>(null);
  const startPos = useRef(new THREE.Vector3(...position));

  useEffect(() => {
    if (falling) {
      const t = setTimeout(() => {
        setFalling(false);
        setColor("#44ff44");
        if (ref.current) {
          ref.current.setTranslation(startPos.current, true);
          ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          ref.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
        }
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [falling]);

  return (
    <RigidBody
      ref={ref}
      type={falling ? "dynamic" : "fixed"}
      position={position}
      colliders="cuboid"
      onCollisionEnter={({ other }) => {
        if (!falling && other.rigidBodyObject?.userData?.type !== "bullet") {
          setColor("#ff0000");
          setTimeout(() => setFalling(true), 500);
        }
      }}
    >
      <mesh>
        <boxGeometry args={[2.5, 0.5, 2.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </RigidBody>
  );
}

// --- СБОРКА УРОВНЯ ---
export function ObstacleCourse() {
  const START_HEIGHT = 40;

  return (
    <group>
      {/* БАТУТ НА ЗЕМЛЕ */}
      <JumpPad position={[0, 0, 0]} />

      {/* СТАРТ НАВЕРХУ */}
      <Platform position={[0, START_HEIGHT, 0]} args={[10, 1, 10]} color="#444" />
      <Text position={[0, START_HEIGHT + 3, 0]} fontSize={3} color="white">
        START: TEAM UP!
      </Text>

      {/* Платформы */}
      <MovingPlatform startPos={[0, START_HEIGHT, 6]} endPos={[0, START_HEIGHT, 14]} speed={1.5} />
      <MovingPlatform startPos={[0, START_HEIGHT, 16]} endPos={[0, START_HEIGHT, 24]} speed={1.5} delay={1} />
      <Platform position={[0, START_HEIGHT, 30]} args={[8, 1, 8]} color="#666" />

      {/* Спиннер */}
      <Spinner position={[0, START_HEIGHT + 1, 30]} speed={2} />
      <Text position={[0, START_HEIGHT + 4, 30]} fontSize={1} color="red">
        Watch out!
      </Text>

      {/* Мост */}
      <Platform position={[0, START_HEIGHT, 45]} args={[12, 1, 8]} color="#444" />
      <Text position={[0, START_HEIGHT + 3, 45]} fontSize={1.5} color="#aaf">
        Help each other!
      </Text>
      <TeamBridge position={[0, START_HEIGHT, 53]} />
      <Platform position={[0, START_HEIGHT, 65]} args={[10, 1, 10]} color="#666" />

      {/* Паркур */}
      <FallingPlatform position={[-3, START_HEIGHT, 72]} />
      <FallingPlatform position={[0, START_HEIGHT, 76]} />
      <FallingPlatform position={[3, START_HEIGHT, 80]} />
      <FallingPlatform position={[0, START_HEIGHT, 84]} />

      {/* Финиш */}
      <Platform position={[0, START_HEIGHT, 92]} args={[15, 1, 10]} color="#gold" />
      <Text position={[0, START_HEIGHT + 3, 92]} fontSize={4} color="gold">
        FINISH!
      </Text>

      <mesh position={[5, START_HEIGHT + 1, 92]}>
        <cylinderGeometry args={[0.5, 0.5, 2]} />
        <meshStandardMaterial color="gold" />
      </mesh>
      <mesh position={[-5, START_HEIGHT + 1, 92]}>
        <cylinderGeometry args={[0.5, 0.5, 2]} />
        <meshStandardMaterial color="gold" />
      </mesh>
    </group>
  );
}
