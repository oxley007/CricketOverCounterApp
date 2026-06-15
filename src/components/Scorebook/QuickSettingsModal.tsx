import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from "react-native";
import MatchRulesSettings from "../RunModal/MatchRulesSettings";
import BallReminderSettings from "../BallReminder/BallReminderSettings";
import BaseRunsInput from "../Settings/BaseRunsInput";

// Helper types matching your state controls
interface QuickSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QuickSettingsModal({
  visible,
  onClose,
}: QuickSettingsModalProps) {
  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Dimmed Background Overlay Context */}
      <View style={styles.overlay}>
        {/* Clickable background spacer to dismiss the modal safely */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        {/* Modal Container Content Sheet */}
        <View style={styles.modal}>
          {/* Header Layout */}
          <Text style={styles.title}>Match Quick Settings</Text>
          <Text style={styles.subtitle}>
            Adjust parameters for the active innings
          </Text>

          {/* Main Controls Scrolling Boundary */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.divider} />

            {/* 1. Custom Rules Component Mounts */}
            <MatchRulesSettings />

            {/* 2. Ball Reminder Settings Layer */}
            <BallReminderSettings compact showDescription={false} />

            <View style={{ marginTop: 10 }} />

            {/* 3. Base Run Counter Inputs */}
            <BaseRunsInput />

            <View style={styles.divider} />
          </ScrollView>

          {/* Persistent Bottom Action Trigger to Close Sheet */}
          <Pressable style={styles.submitButton} onPress={onClose}>
            <Text style={styles.submitText}>Save Changes</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Extracted style token layout rules
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6, 14, 32, 0.65)", // surface-container-lowest tint layout overlay
    justifyContent: "flex-end", // Aligns modal directly as a bottom-up tray sheet
  },
  modal: {
    // Applied matching custom dark theme tokens from your source design structure
    backgroundColor: "#fff", // bg-surface (#0b1326)
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 24, // Consistent structural content breathing room
    maxHeight: "75%", // Constrains height safely below header status margins
  },
  scrollContent: {
    paddingBottom: 24,
  },
  title: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 20, // text-headline-md config matches
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
    color: "#333", // text-on-surface
  },
  subtitle: {
    fontFamily: "Hanken Grotesk",
    fontSize: 12,
    fontWeight: "400",
    marginBottom: 12,
    textAlign: "center",
    color: "555", // text-on-surface-variant
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(134, 147, 153, 0.25)", // outline token opacity level marker
    marginVertical: 14,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: "rgba(0, 194, 243, 0.15)", // primary-container blend wrapper
    borderWidth: 1.5,
    borderColor: "#00c2f3", // primary-container accent ring boundary
    paddingVertical: 14,
    borderRadius: 12, // rounded-xl token consistency standard
    alignItems: "center",
    justifyContent: "center",

    // Performance safe container shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  submitText: {
    fontFamily: "Plus Jakarta Sans",
    fontSize: 16,
    fontWeight: "700",
    color: "#333", // text-primary contrast highlighting
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
});
