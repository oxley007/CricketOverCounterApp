import React, { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import SubscriptionModal from "../../components/iap/SubscriptionList";

export default function Upgrade() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  // Reset modal visibility whenever screen gains focus
  useFocusEffect(
    useCallback(() => {
      setVisible(true);
    }, [])
  );

  const handleClose = () => {
    setVisible(false);
    router.replace("/"); // back to home
  };

  return (
    <SubscriptionModal
      visible={visible}
      onClose={handleClose}
    />
  );
}
