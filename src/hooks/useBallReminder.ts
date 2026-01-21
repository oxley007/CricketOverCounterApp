import { useEffect, useMemo, useRef, useState } from "react";
import { useMatchStore } from "../state/matchStore";
import { Vibration, Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function useBallReminder(enabled: boolean = true) {
  const events = useMatchStore((state) => state.events);
  const proUnlocked = useMatchStore((state) => state.proUnlocked);
  const thresholdPercent = useMatchStore(
    (state) => state.ballReminderThresholdPercent
  );

  const [timeSinceLastBall, setTimeSinceLastBall] = useState(0);
  const [flashOn, setFlashOn] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAlertedRef = useRef(false);

  const lastEvent = events[events.length - 1];
  const isWicket = lastEvent?.type === "wicket";

  const legalBallCount = useMemo(
    () => events.filter((e) => e.countsAsBall).length,
    [events]
  );

  const overs = useMemo(
    () => legalBallCount / 6,
    [legalBallCount]
  );

  const isFreeTrialPeriod = useMemo(
    () => overs <= 6,
    [overs]
  );

  const isEndOfOver =
    lastEvent?.countsAsBall === true && legalBallCount > 0 && legalBallCount % 6 === 0;

  const shouldPause = isWicket || isEndOfOver;

  const lastDeliveryTimestamp = useMemo(() => lastEvent?.timestamp ?? null, [lastEvent]);

  // -----------------------------
  // Timer effect (since last delivery)
  // -----------------------------
  useEffect(() => {
    if (!enabled) return; // <-- early exit if not enabled

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!lastDeliveryTimestamp) return;
    if (shouldPause) {
      setTimeSinceLastBall(0);
      return;
    }

    intervalRef.current = setInterval(() => {
      const diffSeconds = Math.min(
        120,
        Math.floor((Date.now() - lastDeliveryTimestamp) / 1000)
      );
      setTimeSinceLastBall(diffSeconds);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastDeliveryTimestamp, shouldPause, events.length, enabled]);

  // -----------------------------
  // Reset timer on new delivery
  // -----------------------------
  const prevDeliveryRef = useRef<number | null>(null);
  useEffect(() => {
    if (!enabled) return; // <-- early exit

    if (lastDeliveryTimestamp && lastDeliveryTimestamp !== prevDeliveryRef.current) {
      setTimeSinceLastBall(0);
    }
    prevDeliveryRef.current = lastDeliveryTimestamp;
  }, [lastDeliveryTimestamp, enabled]);

  // -----------------------------
  // Compute average delivery time
  // -----------------------------
  const deliveryIntervals = useMemo(() => {
    if (!enabled || events.length < 2) return [];

    const intervals: number[] = [];
    let legalBallCount = 0;

    for (let i = 1; i < events.length; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      if (prev.countsAsBall) legalBallCount++;
      const prevIsWicket = prev.type === "wicket";
      const currIsWicket = curr.type === "wicket";
      const prevIsEndOfOver = prev.countsAsBall && legalBallCount % 6 === 0;
      if (prevIsWicket || prevIsEndOfOver || currIsWicket) continue;

      const diff = curr.timestamp - prev.timestamp;
      if (diff > 0) intervals.push(Math.min(Math.floor(diff / 1000), 120));
    }

    return intervals;
  }, [events, enabled]);

  const averageBallTime =
    deliveryIntervals.length > 0
      ? deliveryIntervals.reduce((a, b) => a + b, 0) / deliveryIntervals.length
      : 30;

  const thresholdSeconds = Math.round(averageBallTime * (thresholdPercent / 100));
  const avgBallPlusThreshold = Math.round(averageBallTime + thresholdSeconds);

  // -----------------------------
  // Flashing logic
  // -----------------------------
  useEffect(() => {
    if (!enabled) return;

    let flashInterval: NodeJS.Timeout | undefined;
    const hasExceededLimit = timeSinceLastBall > avgBallPlusThreshold;

    if (timeSinceLastBall === 0) {
      hasAlertedRef.current = false;
      setFlashOn(true);
      return;
    }

    if (hasExceededLimit) {
      if (!hasAlertedRef.current) {
        hasAlertedRef.current = true;

        console.log("Vibration check:", { proUnlocked, isFreeTrialPeriod });

        if (proUnlocked || isFreeTrialPeriod) {
          console.log("Vibrating now!");

          if (Platform.OS === "ios") {
            // iOS: max 2 haptics (reliable)
            Vibration.vibrate(200);

            setTimeout(() => Vibration.vibrate(200), 300);
            setTimeout(() => Vibration.vibrate(200), 600);
          } else {
            // Android: full pattern
            Vibration.vibrate([0, 500, 300, 500]);
          }
        } else {
          console.log("Not vibrating because not Pro and not free trial");
        }
      }

      // Flashing ALWAYS runs while exceeded
      flashInterval = setInterval(() => {
        setFlashOn((prev) => !prev);
      }, 500);
    } else {
      setFlashOn(true);
      hasAlertedRef.current = false;
    }

    return () => {
      if (flashInterval) clearInterval(flashInterval);
    };
  }, [timeSinceLastBall, avgBallPlusThreshold, enabled, proUnlocked, isFreeTrialPeriod]);

  useEffect(() => {
    if (!enabled) {
      setTimeSinceLastBall(0);
      setFlashOn(true);
      hasAlertedRef.current = false;
    }
  }, [enabled]);

  // -----------------------------
  // Formatting
  // -----------------------------
  const minutes = Math.floor(timeSinceLastBall / 60);
  const seconds = timeSinceLastBall % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return {
    timeSinceLastBall,
    formattedTime,
    thresholdSeconds,
    averageBallTime,
    avgBallPlusThreshold,
    flashOn,
    paused: shouldPause,
    pauseReason: isWicket ? "wicket" : isEndOfOver ? "overEnd" : null,
    deliveryIntervals,
  };
}
