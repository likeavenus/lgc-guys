// === Credits.tsx ===
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const TEAM = [
  { name: "Евсей Денисов", role: "Начальник =)" },
  { name: "Ксения Денисова", role: "Product owner" },
  { name: "Роман Прохоров", role: "IT Lead" },
  { name: "", role: "" },
  { name: "Дмитрий Олейник", role: "Backend developer" },
  { name: "Виктор Калянов", role: "Backend developer" },
  { name: "", role: "" },
  { name: "Гулиев Рафаэль", role: "Frontend developer" },
  { name: "Михаил Бакаев", role: "Frontend developer" },
  { name: "", role: "" },
  { name: "Анастасия Петросян", role: "System analytics" },
  { name: "Анна Рязанова", role: "System analytics" },
  { name: "Анна Величко", role: "Business Analytics" },
  { name: "", role: "" },
  { name: "Наталья Войлошникова", role: "QA Testing / Scrum master" },
  { name: "Дарья Миронова", role: "QA Testing / Scrum master" },
  { name: "Александр Камаев", role: "QA Testing" },
  { name: "", role: "" },
  { name: "Сергей Ходырев", role: "DevOps" },
  { name: "", role: "" },
  { name: "Макс Пархоменко", role: "UX/UI Designer" },
  { name: "", role: "" },
  { name: "", role: "" },
  { name: "Happy New Year 2025!", role: "🎄 From Team with Love 🎄" },
];

export function Credits({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const [finished, setFinished] = useState(false);
  const startY = -25; // Начальная позиция (внизу за экраном)
  const endY = TEAM.length * 2.5 + 10; // Конечная позиция (все титры прошли)

  useFrame((state, delta) => {
    if (!groupRef.current || !active || finished) return;

    // Плавно поднимаем титры вверх
    groupRef.current.position.y += delta * 2.5;

    // Когда дошли до конца, останавливаем
    if (groupRef.current.position.y >= endY) {
      groupRef.current.position.y = endY;
      setFinished(true);
    }
  });

  if (!active) return null;

  return (
    <group
      ref={groupRef}
      position={[0, startY, 230]} // ПОДАЛЬШЕ ОТ ПЛАТФОРМЫ (Z=230 вместо 195)
      rotation={[0, Math.PI, 0]} // ПОВОРОТ НА 180 ГРАДУСОВ (теперь читаемо)
    >
      {/* Заголовок */}
      <Text
        position={[0, 0, 0]}
        fontSize={2.5}
        color="#ffd700"
        outlineWidth={0.12}
        outlineColor="black"
        anchorX="center"
      >
        CREDITS
      </Text>

      {/* Команда */}
      {TEAM.map((member, i) => {
        if (!member.name) {
          return <group key={i} />;
        }

        return (
          <group key={i} position={[0, -i * 2.5 - 4, 0]}>
            {/* Имя */}
            <Text
              position={[0, 0.5, 0]}
              fontSize={1.2}
              color="white"
              outlineWidth={0.06}
              outlineColor="black"
              anchorX="center"
            >
              {member.name}
            </Text>

            {/* Роль */}
            <Text
              position={[0, -0.5, 0]}
              fontSize={0.7}
              color="#00ffff"
              outlineWidth={0.04}
              outlineColor="black"
              anchorX="center"
            >
              {member.role}
            </Text>
          </group>
        );
      })}
    </group>
  );
}
