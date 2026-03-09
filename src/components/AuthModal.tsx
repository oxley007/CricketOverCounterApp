"use client";

import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    OAuthProvider,
    onAuthStateChanged,
    signInWithCredential,
    signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Button, Modal, Portal } from "react-native-paper";
import { auth } from "../services/firebaseConfig";
import { syncUserData } from "../services/syncUserData";
import { useAuthStore } from "../state/authStore";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function AuthModal({ visible, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const setGuest = useAuthStore((s) => s.setGuest);

  // ================= GOOGLE SETUP (ANDROID) =================
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "YOUR_IOS_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_GOOGLE_CLIENT_ID.apps.googleusercontent.com",
    // expoClientId: optional if using Expo Go
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.authentication!;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(() => onClose())
        .catch((err) => Alert.alert("Google Login Error", err.message));
    }
  }, [response]);

  // ================= APPLE LOGIN (IOS) =================
  const handleAppleLogin = async () => {
    try {
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        ],
      });

      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: appleCredential.identityToken!,
      });

      await signInWithCredential(auth, credential);
      onClose();
    } catch (e: any) {
      console.log("🍎 Apple Login Error Object:", e);
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(
          "Apple Login Failed",
          e.message || JSON.stringify(e, null, 2),
        );
      }
    }
  };

  // ================= EMAIL LOGIN =================
  const handleEmailLogin = async () => {
    try {
      // Try login
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        // Sign up if user doesn't exist
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          onClose();
        } catch (signupErr: any) {
          Alert.alert("Signup Error", signupErr.message);
        }
      } else {
        Alert.alert("Login Error", err.message);
      }
    }
  };

  // ================= AUTO CLOSE WHEN ALREADY LOGGED IN =================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // wrap the async call
        (async () => {
          try {
            // After successful login
            setGuest(false); // add this to handleEmailLogin, Google, Apple
            await syncUserData();
          } catch (err) {
            console.error("❌ Failed to sync user data:", err);
          }

          onClose(); // your existing logic
        })();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.headerTitle}>Login or Sign Up</Text>
        <Text style={styles.headerSubtitle}>
          Login or signup for free to allow your data/stats to be saved to the
          cloud
        </Text>

        {/* APPLE - iOS only */}
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={{ width: "100%", height: 44, marginBottom: 12 }}
            onPress={handleAppleLogin}
          />
        )}

        {/* GOOGLE - Android only */}
        {Platform.OS === "android" && (
          <Button
            mode="contained"
            buttonColor="#4285F4"
            onPress={() => promptAsync()}
            style={{ marginBottom: 12 }}
          >
            Continue with Google
          </Button>
        )}

        {/* HORIZONTAL SEPARATOR */}
        <View style={styles.separatorContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* EMAIL - All platforms */}
        <TextInput
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />

        <Button mode="contained" onPress={handleEmailLogin}>
          Continue with Email
        </Button>

        {/* HORIZONTAL SEPARATOR */}
        <View style={styles.separatorContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.line} />
        </View>

        {/* Continue as Guest */}
        <Button
          mode="outlined"
          buttonColor="#ff7043"
          onPress={() => {
            Alert.alert(
              "Continue as Guest",
              "⚠️ Warning: Continuing as guest does NOT save your data or stats to the cloud.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Continue",
                  onPress: () => {
                    setGuest(true);
                    onClose();
                  },
                },
              ],
            );
          }}
        >
          Continue as Guest
        </Button>
        <Text style={styles.headerSubtitle}>
          ⚠️ Warning: Continuing as Guest does NOT save your data or stats to
          the cloud and they can be lost on app updates. It is strongly
          recommended to signup above to save to cloud.
        </Text>

        <Button onPress={onClose} style={{ marginTop: 10 }}>
          Cancel
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
  },
  emailSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  orText: {
    marginHorizontal: 8,
    color: "#555",
    fontWeight: "600",
  },
});
