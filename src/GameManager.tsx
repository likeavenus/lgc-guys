import { usePlayersList } from "playroomkit";
import { PlayerCapsule } from "./PlayerCapsule";

export const GameManager = () => {
  const players = usePlayersList(true); // true = создать стейт, если его нет

  return (
    <>
      {players.map((player) => (
        <PlayerCapsule key={player.id} playerState={player} />
      ))}
    </>
  );
};
