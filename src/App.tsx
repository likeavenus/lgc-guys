import { Canvas } from "@react-three/fiber";
import {
  KeyboardControls,
  type KeyboardControlsEntry,
  PointerLockControls,
  Stats,
} from "@react-three/drei";
import { Scene } from "./Scene";
import { useEffect, useState, useRef } from "react";
import { GameEvents } from "./GameState";
import "./index.css";

enum Controls {
  forward = "forward",
  back = "back",
  left = "left",
  right = "right",
  jump = "jump",
}

export function App() {
  const [isDead, setIsDead] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);

  // ОПТИМИЗАЦИЯ: Прямая ссылка на DOM элемент полоски заряда
  const chargeBarRef = useRef<HTMLDivElement>(null);
  const chargeContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDeath = (dead: boolean) => {
      setIsDead(dead);
      if (dead) setRespawnTimer(10);
    };

    // ПРЯМОЕ ОБНОВЛЕНИЕ DOM (БЕЗ RE-RENDER)
    const handleCharge = (val: number) => {
      if (chargeContainerRef.current) {
        chargeContainerRef.current.style.opacity = val > 0 ? "1" : "0";
      }
      if (chargeBarRef.current) {
        chargeBarRef.current.style.width = `${val * 100}%`;
        chargeBarRef.current.style.backgroundColor =
          val > 0.9 ? "#ff4444" : "#ffcc00";
      }
    };

    GameEvents.on("death", handleDeath);
    GameEvents.on("charge", handleCharge);

    return () => {
      GameEvents.off("death", handleDeath);
      GameEvents.off("charge", handleCharge);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isDead && respawnTimer > 0) {
      interval = setInterval(() => setRespawnTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isDead, respawnTimer]);

  const map: KeyboardControlsEntry[] = [
    { name: Controls.forward, keys: ["ArrowUp", "KeyW"] },
    { name: Controls.back, keys: ["ArrowDown", "KeyS"] },
    { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
    { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
    { name: Controls.jump, keys: ["Space"] },
  ];

  return (
    <>
      <KeyboardControls map={map}>
        <Canvas
          shadows
          camera={{ fov: 60 }}
          dpr={[1, 1.5]}
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <Stats />
          <color attach="background" args={["#111"]} />
          <Scene />
          {/* PointerLockControls нужен только для захвата мыши, камеру мы будем крутить сами в PlayerCapsule */}
          <PointerLockControls />
        </Canvas>
      </KeyboardControls>

      {/* --- HUD --- */}
      {!isDead && (
        <>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "10px",
              height: "10px",
              background: "white",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              mixBlendMode: "difference",
            }}
          />

          {/* Оптимизированный бар */}
          <div
            ref={chargeContainerRef}
            style={{
              position: "absolute",
              top: "55%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "200px",
              height: "10px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: "5px",
              overflow: "hidden",
              opacity: 0,
              transition: "opacity 0.1s",
            }}
          >
            <div
              ref={chargeBarRef}
              style={{
                width: "0%",
                height: "100%",
                background: "#ffcc00",
                transition: "width 0.05s linear",
              }} // Очень быстрая анимация
            />
          </div>
        </>
      )}

      {isDead && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(50, 0, 0, 0.6)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "red",
            fontFamily: "monospace",
            pointerEvents: "none",
          }}
        >
          <h1 style={{ fontSize: "4rem", margin: 0 }}>ВЫ ПОГИБЛИ</h1>
          <p style={{ color: "white", fontSize: "2rem", marginTop: "20px" }}>
            ВОСКРЕШЕНИЕ ЧЕРЕЗ: {respawnTimer}
          </p>
        </div>
      )}
    </>
  );
}
