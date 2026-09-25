import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { styles } from '@/lib/styles';

export default function NotFoundScreen() {
  return (
    <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Text style={styles.title}>Página não encontrada</Text>
      <Link href="/" style={{ color: '#19734a', fontWeight: '800', marginTop: 18 }}>
        Voltar a explorar
      </Link>
    </View>
  );
}
