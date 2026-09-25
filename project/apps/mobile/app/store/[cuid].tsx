import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPublicStore, getStoreCatalog } from '@precoperto/supabase';
import { getMobileSupabaseClient } from '@/lib/supabase';
import { formatCurrency, formatDayOfWeek, formatTime } from '@precoperto/utils';
import { colors, styles } from '@/lib/styles';

interface StorePayload {
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  is_private: boolean;
  hours: {
    day_of_week: number;
    is_closed: boolean;
    open_time: string | null;
    close_time: string | null;
  }[];
}
interface CatalogPayload {
  products: {
    cuid: string;
    name: string;
    type: 'product' | 'service';
    price: number;
    currency: 'AOA';
  }[];
}

export default function StoreScreen() {
  const { cuid } = useLocalSearchParams<{ cuid: string }>();
  const router = useRouter();
  const [store, setStore] = useState<StorePayload | null>(null);
  const [catalog, setCatalog] = useState<CatalogPayload>({ products: [] });
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const client = getMobileSupabaseClient();
    void Promise.all([
      getPublicStore(client, String(cuid)),
      getStoreCatalog(client, String(cuid)),
    ]).then(([storeResult, catalogResult]) => {
      if (storeResult.error) setError(storeResult.error.message);
      else {
        setStore(storeResult.data as unknown as StorePayload);
        setCatalog((catalogResult.data ?? { products: [] }) as unknown as CatalogPayload);
      }
    });
  }, [cuid]);
  if (error)
    return (
      <View style={[styles.screen, { padding: 20 }]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  if (!store)
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.green} style={{ marginTop: 120 }} />
      </View>
    );
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.green, fontWeight: '800', marginBottom: 16 }}>‹ Voltar</Text>
      </Pressable>
      <View style={styles.card}>
        <Text style={styles.title}>{store.name}</Text>
        {store.is_private ? (
          <Text style={[styles.badge, { alignSelf: 'flex-start', marginTop: 10 }]}>Privado</Text>
        ) : null}
        {store.description ? (
          <Text style={[styles.subtitle, { marginTop: 10 }]}>{store.description}</Text>
        ) : null}
        <Text style={{ color: colors.muted, marginTop: 12 }}>
          {[store.address, store.city, store.province].filter(Boolean).join(', ') ||
            'Localização por completar'}
        </Text>
      </View>
      <Text style={styles.sectionTitle}>Produtos e serviços</Text>
      {catalog.products.length ? (
        catalog.products.map((product) => (
          <Pressable
            key={product.cuid}
            style={styles.card}
            onPress={() => router.push(`/products/${product.cuid}`)}
          >
            <View style={styles.spaceBetween}>
              <Text style={{ color: colors.ink, fontWeight: '800', flex: 1 }}>{product.name}</Text>
              <Text style={{ color: colors.darkGreen, fontWeight: '900' }}>
                {formatCurrency(Number(product.price), product.currency)}
              </Text>
            </View>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>
              {product.type === 'service' ? 'Serviço' : 'Produto'}
            </Text>
          </Pressable>
        ))
      ) : (
        <View style={styles.card}>
          <Text style={{ color: colors.muted }}>Ainda sem produtos activos.</Text>
        </View>
      )}
      <Text style={styles.sectionTitle}>Horário</Text>
      <View style={styles.card}>
        {store.hours.map((hour) => (
          <View key={hour.day_of_week} style={styles.spaceBetween}>
            <Text>{formatDayOfWeek(hour.day_of_week, true)}</Text>
            <Text style={{ color: colors.muted }}>
              {hour.is_closed
                ? 'Fechado'
                : `${formatTime(hour.open_time)} – ${formatTime(hour.close_time)}`}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
