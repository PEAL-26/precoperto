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
import { requestCurrentLocation } from '@/lib/location';
import { styles, colors } from '@/lib/styles';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, bootstrap } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function locate() {
    const result = await requestCurrentLocation();
    if (result.status === 'granted') {
      setLocation({ latitude: result.latitude, longitude: result.longitude });
      setError(null);
    } else
      setError(
        result.status === 'denied'
          ? 'A permissão de localização foi recusada.'
          : 'Não foi possível obter a localização.',
      );
  }
  async function submit() {
    if (!location) {
      setError('Obtenha a localização para criar o pré-cadastro.');
      return;
    }
    if (password.length < 8) {
      setError('A password deve ter pelo menos 8 caracteres.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await signUp({ name, email, password, ...location });
      if (result.requiresConfirmation)
        setSuccess('Verifique o email para activar a conta. Depois, entre para concluir o perfil.');
      else {
        await bootstrap({ name, ...location });
        router.replace('/profile');
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Não foi possível criar a conta.',
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Criar conta</Text>
        <Text style={[styles.subtitle, { marginTop: 6, marginBottom: 22 }]}>
          Comece a mostrar os seus produtos e serviços.
        </Text>
        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {success ? <Text style={styles.success}>{success}</Text> : null}
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, { marginBottom: 14 }]}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, { marginBottom: 16 }]}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />
          <Pressable style={styles.secondary} onPress={() => void locate()}>
            <Text style={styles.secondaryText}>
              {location ? 'Localização obtida' : 'Obter localização'}
            </Text>
          </Pressable>
          <Text style={{ color: colors.muted, fontSize: 12, marginVertical: 10 }}>
            A localização é obrigatória para o pré-cadastro e não é guardada para rastreamento.
          </Text>
          <Pressable
            style={styles.primary}
            onPress={() => void submit()}
            disabled={pending || Boolean(success)}
          >
            {pending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>Criar conta</Text>
            )}
          </Pressable>
          <Pressable
            style={{ alignItems: 'center', marginTop: 18 }}
            onPress={() => router.push('/login')}
          >
            <Text style={{ color: colors.green, fontWeight: '800' }}>Já tenho conta</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
