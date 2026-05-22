"use client";

import * as AppleAuthentication from "expo-apple-authentication";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
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
import { useAuthStore } from "../state/authStore";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
  hideGuest?: boolean;
};

export default function AuthModal({
  visible,
  onClose,
  onSuccess,
  title = "Login or Sign Up",
  subtitle = "Login or signup for free to allow your data/stats to be saved to the cloud",
  hideGuest = false,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setGuest = useAuthStore((s) => s.setGuest);

  const variant = Constants.expoConfig?.extra?.variant;
  const isLittleWicket = variant === "littlewicket";

  // ================= GOOGLE SETUP (ANDROID) =================
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "://googleusercontent.com",
    androidClientId: isLittleWicket
      ? "://googleusercontent.com"
      : "://googleusercontent.com",
    webClientId: "://googleusercontent.com",
  });

  useEffect(() => {
    console.log("Auth Response Type:", response?.type);

    if (response?.type === "success" && response.authentication) {
      const { idToken } = response.authentication;

      if (idToken) {
        const credential = GoogleAuthProvider.credential(idToken);

        handleOAuthLogin(credential).then(() => {
          if (router.canGoBack()) {
            router.back();
          }
        });
      } else {
        console.error("❌ No idToken found in response.authentication");
      }
    }
  }, [response]);

  // ================= APPLE LOGIN (IOS) =================
  const handleAppleLogin = async () => {
    if (loading) return;

    setLoading(true);
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

      await handleOAuthLogin(credential);
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert("Apple Login Failed", e.message || JSON.stringify(e));
      }
      setLoading(false);
    }
  };

  const handleFinalizeLogin = async () => {
    setGuest(false);
    onClose();
    onSuccess?.();
  };

  // ================= EMAIL LOGIN =================
  const handleEmailLogin = async () => {
    if (loading) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      await handleFinalizeLogin();
    } catch (err: any) {
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          await handleFinalizeLogin();
        } catch (signupErr: any) {
          Alert.alert("Signup Error", signupErr.message);
          setLoading(false);
        }
      } else {
        Alert.alert("Login Error", err.message);
        setLoading(false);
      }
    }
  };

  const handleOAuthLogin = async (credential: any) => {
    if (loading) return;

    setLoading(true);
    try {
      await signInWithCredential(auth, credential);
      await handleFinalizeLogin();
    } catch (err: any) {
      if (err.code === "auth/account-exists-with-different-credential") {
        const email = err.customData.email;
        const methods = await auth.fetchSignInMethodsForEmail(email);
        Alert.alert(
          "Account Already Exists",
          `An account already exists for ${email} using ${methods.join(", ")}. Please login with that method first.`,
        );
      } else {
        Alert.alert("Login Failed", err.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setGuest(false);
        onClose();
      }
    });

    return unsubscribe;
  }, [onClose, setGuest]);

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onClose}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>

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
            style={{
              width: "100%",
              height: 44,
              marginBottom: 12,
              opacity: loading ? 0.5 : 1,
            }}
            onPress={loading ? undefined : handleAppleLogin}
          />
        )}

        {/* GOOGLE - Android only */}
        {Platform.OS === "android" && (
          <Button
            mode="contained"
            buttonColor="#4285F4"
            onPress={() => promptAsync()}
            style={{ marginBottom: 12 }}
            loading={loading}
            disabled={loading}
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
          editable={!loading}
          placeholder="Email"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          editable={!loading}
          placeholder="Password"
          style={styles.input}
          value={password}
          secureTextEntry
          onChangeText={setPassword}
        />

        <Button
          mode="contained"
          onPress={handleEmailLogin}
          loading={loading}
          disabled={loading}
        >
          Continue with Email
        </Button>

        {/* Continue as Guest (Conditionally Hidden) */}
        {!hideGuest && (
          <>
            <View style={styles.separatorContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

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
              ⚠️ Warning: Continuing as Guest does NOT save your data or stats
              to the cloud and they can be lost on app updates. It is strongly
              recommended to signup above to save to cloud.
            </Text>
          </>
        )}

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
