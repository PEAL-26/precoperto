import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { styles, colors } from '@/lib/styles';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function submit() {
    setPending(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível entrar.');
    } finally {
      setPending(false);
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { justifyContent: 'center', flexGrow: 1 }]}
      >
        <Text style={styles.title}>Entrar</Text>
        <Text style={[styles.subtitle, { marginTop: 6, marginBottom: 22 }]}>
          Bem-vindo de volta ao PrecoPerto.
        </Text>
        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="voce@exemplo.com"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, { marginBottom: 18 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="A sua password"
          />
          <Pressable style={styles.primary} onPress={() => void submit()} disabled={pending}>
            {pending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Entrar</Text>
            )}
          </Pressable>
          <Pressable
            style={{ alignItems: 'center', marginTop: 18 }}
            onPress={() => router.push('/register')}
          >
            <Text style={{ color: colors.green, fontWeight: '800' }}>Criar uma conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
