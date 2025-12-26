// === NicknameScreen.tsx (создай новый файл) ===
import { useState } from "react";

export function NicknameScreen({ onStart }: { onStart: (nickname: string) => void }) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 0) {
      onStart(name.trim());
    }
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10000
    }}>
      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "20px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        textAlign: "center",
        maxWidth: "400px",
        width: "90%"
      }}>
        <h1 style={{
          fontSize: "32px",
          marginBottom: "10px",
          color: "#333"
        }}>
          🎄 Christmas Run 🎄
        </h1>
        <p style={{
          color: "#666",
          marginBottom: "30px",
          fontSize: "16px"
        }}>
          Multiplayer Obstacle Course
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your nickname"
            maxLength={15}
            autoFocus
            style={{
              width: "100%",
              padding: "15px",
              fontSize: "18px",
              border: "2px solid #ddd",
              borderRadius: "10px",
              marginBottom: "20px",
              boxSizing: "border-box",
              outline: "none",
              transition: "border-color 0.3s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#667eea"}
            onBlur={(e) => e.target.style.borderColor = "#ddd"}
          />

          <button
            type="submit"
            disabled={name.trim().length === 0}
            style={{
              width
