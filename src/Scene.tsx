import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Physics, RigidBody } from "@react-three/rapier";
import { Stars, Text } from "@react-three/drei";
import { GameManager } from "./GameManager";
import { BulletManager } from "./BulletManager";
import { ChristmasTree } from "./ChristmasTree";
import { Snow } from "./Snow";
import { SnowballImpacts, type ImpactHandle } from "./SnowballImpacts";
import { ObstacleCourse } from "./ObstacleCourse";
import {
  ModernHouse,
  ClassicHouse,
  Snowman,
  OptimizedForest,
} from "./Decorations";
import type { EffectComposer } from "three/examples/jsm/Addons.js";
import { getState, isHost, RPC, setState } from "playroomkit";
import { SquidGameStage } from "./SquidGameStage";

export function Scene() {
  const impactsRef = useRef<ImpactHandle>(null);

  const currentStage = getState("gameStage") || "OBSTACLE_COURSE";
  console.log("currentStage: ", currentStage);

  // useEffect(() => {
  //   if (isHost()) {
  //     // Раскомментируй эту строку ОДИН РАЗ, сохрани,
  //     // подожди пока обновится, а потом закомментируй обратно.
  //     setState("gameStage", "OBSTACLE_COURSE", true);
  //   }
  // }, [currentStage]);

  const handleImpact = (pos: THREE.Vector3, normal?: THREE.Vector3) => {
    let finalNormal = normal;
    if (!normal) {
      finalNormal =
        pos.y > 0.5 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
    }

    if (impactsRef.current && finalNormal) {
      impactsRef.current.addImpact(pos, finalNormal);
    }
  };

  // Генерируем случайный лес
  const forestTrees = useMemo(() => {
    const trees = [];
    for (let i = 0; i < 40; i++) {
      const angle = (i / 40) * Math.PI * 2;
      const radius = 45 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 1.0 + Math.random() * 1.5;
      trees.push({ pos: [x, 0, z] as [number, number, number], scale });
    }
    return trees;
  }, []);

  return (
    <>
      <color attach="background" args={["#0a0a1a"]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[50, 80, 50]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-60}
        shadow-camera-right={60}
        shadow-camera-top={60}
        shadow-camera-bottom={-60}
      />

      <Stars
        radius={200}
        depth={80}
        count={3000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <Snow />

      <Physics>
        <GameManager />
        <BulletManager onImpact={handleImpact} />

        {/* Земля */}
        <RigidBody type="fixed" friction={0.5} restitution={0.1}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[200, 200]} />
            <meshStandardMaterial color="#eef" roughness={1} />
          </mesh>
        </RigidBody>

        {/* Дома */}
        <ClassicHouse position={[-15, 0, 10]} rotation={[0, Math.PI / 6, 0]} />
        <ModernHouse position={[15, 0, 10]} rotation={[0, -Math.PI / 6, 0]} />

        {/* Снеговики */}
        <Snowman position={[-10, 1, 18]} rotation={[0, 0.5, 0]} />
        <Snowman position={[10, 1, 18]} rotation={[0, -0.5, 0]} />
        <Snowman position={[0, 1, 15]} />

        {/* Деревья у домов */}
        <group position={[-8, 0, 50]} scale={[2.8, 3, 2.8]}>
          <ChristmasTree />
        </group>

        <OptimizedForest trees={forestTrees} />

        {/* <ObstacleCourse /> */}
        {currentStage === "OBSTACLE_COURSE" && <ObstacleCourse />}
        {currentStage === "RED_LIGHT_GREEN_LIGHT" && <SquidGameStage />}
        {/* ЛЕСТНИЦА В НЕБО (чтобы добраться до старта, если спавн внизу) */}
        <group position={[0, 0, -5]}>
          <Text position={[0, 2, 0]} fontSize={1} color="gold">
            CLIMB TO START!
          </Text>
          {Array.from({ length: 20 }).map((_, i) => (
            <RigidBody
              key={i}
              type="fixed"
              friction={0}
              position={[0, i * 2, -i * 2]}
              colliders="cuboid"
            >
              <mesh receiveShadow castShadow>
                <boxGeometry args={[3, 0.2, 1]} />
                <meshStandardMaterial color="#885533" />
              </mesh>
            </RigidBody>
          ))}
          {/* Последняя ступенька ведет к началу трассы */}
          <RigidBody colliders="cuboid" type="fixed" position={[0, 39, -15]}>
            <mesh>
              <boxGeometry args={[3, 0.2, 40]} />
              <meshStandardMaterial color="#885533" />
            </mesh>
          </RigidBody>
        </group>

        <SnowballImpacts ref={impactsRef} />
      </Physics>
    </>
  );
}

export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Создаем аудио
    audioRef.current = new Audio("/bgmusic.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    // Обработчик успешного запуска
    audioRef.current.addEventListener("canplaythrough", () => {
      console.log("Audio ready to play");
    });

    // Обработчик ошибок
    audioRef.current.addEventListener("error", (e) => {
      console.error("Audio error:", e);
      console.error("Failed to load:", audioRef.current?.src);
    });

    const playAudio = async () => {
      try {
        await audioRef.current?.play();
        setIsPlaying(true);
        console.log("Music playing!");
      } catch (err) {
        console.log("Autoplay blocked, click anywhere to start music");
        setIsPlaying(false);
      }
    };

    // Пытаемся запустить сразу
    playAudio();

    // Запуск по клику
    const handleInteraction = () => {
      if (!isPlaying) {
        playAudio();
      }
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, []);

  return null;
}
