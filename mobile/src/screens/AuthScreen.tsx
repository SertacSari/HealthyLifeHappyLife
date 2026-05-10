import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";

import { colors } from "../theme/colors";

type Props = {
  email: string;
  setEmail: (v: string) => void;

  password: string;
  setPassword: (v: string) => void;

  name: string;
  setName: (v: string) => void;

  runLogin: () => void;
  runSignup: () => void;
};

export function AuthScreen({
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  runLogin,
  runSignup,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>HL</Text>
      </View>

      <Text style={styles.title}>
        Healthy Life, Happy Life
      </Text>

      <Text style={styles.subtitle}>
        Your personal fitness companion
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#94a3b8"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#94a3b8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholder="Display Name"
          placeholderTextColor="#94a3b8"
          value={name}
          onChangeText={setName}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={runLogin}
        >
          <Text style={styles.buttonText}>
            Login
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={runSignup}
        >
          <Text style={styles.signupText}>
            Create Account
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 24,
  },

  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },

  logoText: {
    color: "white",
    fontSize: 30,
    fontWeight: "800",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: colors.textLight,
    marginBottom: 40,
    fontSize: 15,
  },

  form: {
    gap: 14,
  },

  input: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },

  signupButton: {
    alignItems: "center",
    paddingVertical: 12,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  signupText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 15,
  },
});