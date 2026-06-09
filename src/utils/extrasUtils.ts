import { BallEvent } from "../state/matchStore";

export function getExtrasDisplay(ball: BallEvent) {
  const extras: string[] = [];
  let color = "#c471ed";

  if (!ball.isExtra) {
    return { extras, color, isExtraOnly: false };
  }

  switch (ball.extraType) {
    case "wide":
      extras.push(`Wd${ball.runs ? ` ${ball.runs}` : ""}`);
      color = "#fff";
      break;
    case "noBall":
      extras.push(`NB${ball.runs ? ` ${ball.runs}` : ""}`);
      color = "#fff";
      break;
    case "bye":
      extras.push(`B${ball.runs ? ` ${ball.runs}` : ""}`);
      break;
    case "legBye":
      extras.push(`LB${ball.runs ? ` ${ball.runs}` : ""}`);
      break;
    case "penalty":
      extras.push(`P${ball.runs ? ` ${ball.runs}` : ""}`);
      break;
  }

  // extra-only if no runs on top of the extra itself
  const isExtraOnly = ball.runs === 0;

  return {
    extras,
    color,
    isExtraOnly,
  };
}
