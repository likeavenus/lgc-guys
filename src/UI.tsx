// src/UI.tsx
import { useEffect, useState } from "react";

// Мы будем экспортировать стейт силы глобально или через пропсы,
// но для простоты пусть UI просто слушает событие (или мы передадим ref).
// Давай сделаем проще: UI просто отображает состояние заряда.

export const useCharge = () => {
  const [charge, setCharge] = useState(0);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isCharging) {
      interval = setInterval(() => {
        setCharge((prev) => Math.min(prev + 0.05, 1)); // Заряжаем от 0 до 1 за ~20 кадров
      }, 16);
    } else {
      setCharge(0);
    }
    return () => clearInterval(interval);
  }, [isCharging]);

  return { charge, isCharging, setIsCharging };
};

export function UI({ charge }: { charge: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Прицел */}
      <div
        style={{
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          background: "white",
          border: "1px solid black",
        }}
      />

      {/* Полоска силы (показываем только когда заряжаем) */}
      {charge > 0 && (
        <div
          style={{
            width: "100px",
            height: "10px",
            background: "rgba(0,0,0,0.5)",
            borderRadius: "5px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${charge * 100}%`,
              height: "100%",
              background: charge > 0.8 ? "red" : "yellow", // Краснеет при максимуме
              transition: "width 0.05s linear",
            }}
          />
        </div>
      )}
    </div>
  );
}
