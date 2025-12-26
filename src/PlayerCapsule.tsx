import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useKeyboardControls, Text, Billboard } from "@react-three/drei";
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
} from "@react-three/rapier";
import { getState, myPlayer, RPC, usePlayersList } from "playroomkit";
import type { PlayerState } from "playroomkit";
import { GameEvents } from "./GameState";

const MOVE_SPEED = 9;
const JUMP_FORCE = 17;
const GRAVITY_SCALE = 2.3;
const startZ = Math.floor(Math.random() * 20);

export function PlayerCapsule({ playerState }: { playerState: PlayerState }) {
  const body = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  const players = usePlayersList(true);
  const angelPlayer = players.find((p) => p.getState("role") === "angel");
  const [showAngelHint, setShowAngelHint] = useState(false);
  const wasJumpPressed = useRef(false); // НОВЫЙ РЕФ
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { camera } = useThree();
  const isMe = myPlayer().id === playerState.id;
  const color = playerState.getProfile()?.color?.hex;
  const name = playerState.getProfile().name;
  const [isDead, setIsDead] = useState(false);
  const [isClimbing, setIsClimbing] = useState(false);

  const knockbackTimer = useRef(0);
  const lastChargeEmit = useRef(0);
  const chargeRef = useRef(0);
  const isChargingRef = useRef(false);

  const direction = new THREE.Vector3();
  const frontVector = new THREE.Vector3();
  const sideVector = new THREE.Vector3();
  const dummyVec = new THREE.Vector3();

  useEffect(() => {
    if (isMe) GameEvents.emit("death", isDead);
  }, [isDead, isMe]);

  useEffect(() => {
    if (!isMe) return;
    const handleTeleport = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t" && angelPlayer && showAngelHint) {
        const aPos = angelPlayer.getState("pos");
        if (aPos && body.current) {
          body.current.setTranslation(
            { x: aPos.x, y: aPos.y + 1, z: aPos.z },
            true
          );
          body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      }
    };
    window.addEventListener("keydown", handleTeleport);
    return () => window.removeEventListener("keydown", handleTeleport);
  }, [isMe, angelPlayer, showAngelHint]);

  useEffect(() => {
    if (!isMe) return;
    const handleMouseDown = () => {
      if (isDead) return;
      isChargingRef.current = true;
      chargeRef.current = 0;
      GameEvents.emit("charge", 0.01);
    };

    const handleMouseUp = () => {
      if (isDead || !isChargingRef.current) return;
      isChargingRef.current = false;
      const force = chargeRef.current;
      chargeRef.current = 0;
      GameEvents.emit("charge", 0);
      const finalForce = force < 0.1 ? 0.1 : force;
      if (body.current) {
        const origin = body.current.translation();
        const spawnPos = { x: origin.x, y: origin.y + 1.5, z: origin.z };
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        spawnPos.x += dir.x * 1.5;
        spawnPos.z += dir.z * 1.5;
        spawnPos.y += dir.y * 1.5;
        RPC.call(
          "shoot",
          {
            pos: spawnPos,
            dir: { x: dir.x, y: dir.y, z: dir.z },
            force: finalForce * 35 + 15,
            shooterId: myPlayer().id,
          },
          RPC.Mode.ALL
        );
      }
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMe, camera, isDead]);

  useFrame((state, delta) => {
    if (!body.current) return;

    const pos = body.current.translation();
    const linvel = body.current.linvel();

    const gameState = getState("squidStatus");
    if (isMe && gameState === "RED") {
      const speed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2);
      if (speed > 0.5) {
        setIsDead(true);
        RPC.call("play_shot_sound", null, RPC.Mode.ALL);
      }
    }

    if (isMe) {
      const time = state.clock.elapsedTime;
      const squidStatus = getState("squidStatus");
      if (squidStatus === "RED" && !isDead) {
        const currentSpeed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2);
        if (currentSpeed > 0.3) {
          setIsDead(true);
          RPC.call("playShot", null, RPC.Mode.ALL);
        }
      }

      if (angelPlayer) {
        const aPos = angelPlayer.getState("pos");
        if (aPos) {
          const dist = new THREE.Vector3(pos.x, pos.y, pos.z).distanceTo(
            new THREE.Vector3(aPos.x, aPos.y, aPos.z)
          );
          setShowAngelHint(dist > 40);
        }
      }

      if (knockbackTimer.current > 0) {
        knockbackTimer.current -= delta;
        const camDir = dummyVec;
        state.camera.getWorldDirection(camDir);
        const targetCamPos = new THREE.Vector3(pos.x, pos.y + 2.5, pos.z).sub(
          new THREE.Vector3(camDir.x, 0, camDir.z).normalize().multiplyScalar(6)
        );
        state.camera.position.lerp(targetCamPos, 0.25);
        playerState.setState("pos", pos);
        if (visualRef.current) {
          playerState.setState("quat", visualRef.current.quaternion.toArray());
        }
        return;
      }

      if (!isDead && pos.y < -15) setIsDead(true);

      if (isChargingRef.current) {
        chargeRef.current = Math.min(chargeRef.current + delta, 1);
        if (time - lastChargeEmit.current > 0.06) {
          GameEvents.emit("charge", chargeRef.current);
          lastChargeEmit.current = time;
        }
      }

      const { forward, back, left, right, jump } = getKeys();
      const camDir = dummyVec;
      state.camera.getWorldDirection(camDir);
      const forwardDir = isDead
        ? camDir.clone()
        : new THREE.Vector3(camDir.x, 0, camDir.z).normalize();

      frontVector.set(0, 0, 0);
      sideVector.set(0, 0, 0);
      if (forward) frontVector.add(forwardDir);
      if (back) frontVector.sub(forwardDir);

      const rightDir = new THREE.Vector3()
        .crossVectors(camDir.normalize(), new THREE.Vector3(0, 1, 0))
        .normalize();
      if (right) sideVector.add(rightDir);
      if (left) sideVector.sub(rightDir);

      direction
        .subVectors(frontVector, sideVector)
        .addVectors(frontVector, sideVector)
        .normalize();

      if (direction.length() > 0.1 && visualRef.current) {
        const targetRotation = Math.atan2(direction.x, direction.z);
        const targetQuat = new THREE.Quaternion();
        targetQuat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetRotation);
        visualRef.current.quaternion.slerp(targetQuat, 0.2);
      }

      if (visualRef.current) {
        playerState.setState("quat", visualRef.current.quaternion.toArray());
      }

      const speed = isDead ? 15 : MOVE_SPEED;
      direction.multiplyScalar(speed);
      if (!forward && !back && !left && !right) direction.set(0, 0, 0);

      if (isDead) {
        const newPos = new THREE.Vector3(pos.x, pos.y, pos.z).add(
          direction.multiplyScalar(delta)
        );
        body.current.setNextKinematicTranslation(newPos);
        state.camera.position.lerp(newPos, 0.5);
      } else {
        if (isClimbing) {
          let climbSpeed = 0;
          if (forward) climbSpeed = 5;
          if (back) climbSpeed = -5;
          body.current.setLinvel(
            { x: direction.x, y: climbSpeed, z: direction.z },
            true
          );
        } else {
          body.current.setLinvel(
            { x: direction.x, y: linvel.y, z: direction.z },
            true
          );

          // ПРАВИЛЬНЫЙ ПРЫЖОК: срабатывает только при НАЖАТИИ, а не при ЗАЖАТИИ
          if (jump && !wasJumpPressed.current && Math.abs(linvel.y) < 0.5) {
            body.current.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true);
          }
          wasJumpPressed.current = jump; // Запоминаем состояние клавиши
        }

        const targetCamPos = new THREE.Vector3(pos.x, pos.y + 2.5, pos.z).sub(
          new THREE.Vector3(camDir.x, 0, camDir.z).normalize().multiplyScalar(6)
        );
        state.camera.position.lerp(targetCamPos, 0.25);
      }

      playerState.setState("pos", pos);
      playerState.setState("dead", isDead);
    } else {
      const pos = playerState.getState("pos");
      if (pos) body.current.setTranslation(pos, true);
      const quatArray = playerState.getState("quat");
      if (quatArray && visualRef.current) {
        const targetQuat = new THREE.Quaternion().fromArray(quatArray);
        visualRef.current.quaternion.slerp(targetQuat, 0.2);
      }
    }
  });

  const isRemoteDead = !isMe && playerState.getState("dead");

  useEffect(() => {
    if (isDead) {
      const timer = setTimeout(() => {
        setIsDead(false);
        if (body.current) {
          body.current.setTranslation({ x: 0, y: 5, z: 0 }, true);
          body.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isDead]);

  useEffect(() => {
    console.log("name: ", name);
    if (isMe && name === "Darya Kotik") {
      console.log("!!!");
      playerState.setState("role", "angel");
    }
  }, [isMe, name]);

  return (
    <RigidBody
      ref={body}
      colliders={false}
      name={isMe ? "player" : `player_${playerState.id}`}
      enabledRotations={[false, false, false]}
      gravityScale={isDead ? 0 : GRAVITY_SCALE}
      type={isDead ? "kinematicPosition" : "dynamic"}
      position={[0, 5, startZ]}
      onIntersectionEnter={({ other }) => {
        if (other.rigidBodyObject?.userData?.isLadder) setIsClimbing(true);
        if (isDead && other.rigidBodyObject?.userData?.isMedkit) {
          setIsDead(false);
          body.current?.setBodyType(0);
          body.current?.setTranslation({ x: 0, y: 5, z: 0 }, true);
          body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
        }
      }}
      onIntersectionExit={({ other }) => {
        if (other.rigidBodyObject?.userData?.isLadder) setIsClimbing(false);
      }}
      onCollisionEnter={(payload) => {
        const { other } = payload;

        if (!isDead && other.rigidBodyObject?.userData?.isTrap) {
          const trapType = other.rigidBodyObject.userData.type;
          body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
          knockbackTimer.current = 0.8;
          let impulse = new THREE.Vector3(
            (Math.random() - 0.5) * 100,
            50,
            (Math.random() - 0.5) * 100
          );

          if (trapType === "pendulum") {
            const myPos = body.current?.translation();
            const trapPos = other.rigidBodyObject.translation();
            if (myPos && trapPos) {
              const dir = new THREE.Vector3(
                myPos.x - trapPos.x,
                0,
                myPos.z - trapPos.z
              ).normalize();
              impulse = dir.multiplyScalar(200);
              impulse.y = 40;
            }
          }
          body.current?.applyImpulse(impulse, true);
        }

        if (other.rigidBodyObject?.userData?.isMovingPlatform) {
          body.current?.setBodyType(1);
        }
      }}
      onCollisionExit={({ other }) => {
        if (other.rigidBodyObject?.userData?.isMovingPlatform) {
          body.current?.setBodyType(0);
        }
      }}
    >
      <CapsuleCollider args={[0.5, 0.5]} />

      {showAngelHint && isMe && (
        <Billboard position={[0, 2.5, 0]}>
          <Text fontSize={0.3} color="cyan">
            Press [T] to follow Angel
          </Text>
        </Billboard>
      )}

      <group ref={visualRef}>
        <Billboard position={[0, 1.8, 0]}>
          <Text
            fontSize={0.3}
            color="white"
            outlineWidth={0.02}
            outlineColor="black"
          >
            {name}
          </Text>
        </Billboard>

        <mesh castShadow receiveShadow position={[0, 0, 0]}>
          <capsuleGeometry args={[0.5, 1, 4, 8]} />
          <meshStandardMaterial
            color={
              isRemoteDead || (isMe && isDead) ? "#555" : color || "hotpink"
            }
            transparent
            opacity={isRemoteDead || (isMe && isDead) ? 0.5 : 1}
          />
        </mesh>

        <mesh position={[0.2, 0.4, 0.4]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
        <mesh position={[-0.2, 0.4, 0.4]}>
          <sphereGeometry args={[0.1]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </group>
    </RigidBody>
  );
}
