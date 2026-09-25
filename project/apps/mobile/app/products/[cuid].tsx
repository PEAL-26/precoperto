import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getProductDetails } from '@precoperto/supabase';
import { getMobileAssetUrl } from '@/lib/assets';
import { getMobileSupabaseClient } from '@/lib/supabase';
import { formatCurrency, formatDayOfWeek, formatTime } from '@precoperto/utils';
import { colors, styles } from '@/lib/styles';

interface ProductPayload {
  product: {
    name: string;
    type: 'product' | 'service';
    price: number;
    currency: 'AOA';
    description: string | null;
    cover: string | null;
  };
  category: { name: string };
  store: {
    cuid: string;
    name: string;
    is_private: boolean;
    address: string | null;
    city: string | null;
    province: string | null;
    phone: string | null;
    whatsapp: string | null;
  };
  hours:
    | {
        day_of_week: number;
        is_closed: boolean;
        open_time: string | null;
        close_time: string | null;
      }[]
    | null;
}

export default function ProductDetailsScreen() {
  const { cuid } = useLocalSearchParams<{ cuid: string }>();
  const router = useRouter();
  const [payload, setPayload] = useState<ProductPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    void getProductDetails(getMobileSupabaseClient(), String(cuid)).then(
      ({ data, error: rpcError }) => {
        if (rpcError) setError(rpcError.message);
        else setPayload(data as unknown as ProductPayload);
      },
    );
  }, [cuid]);
  if (error)
    return (
      <View style={[styles.screen, { padding: 20 }]}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  if (!payload)
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.green} style={{ marginTop: 120 }} />
      </View>
    );
  const cover = getMobileAssetUrl('product-assets', payload.product.cover);
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: colors.green, fontWeight: '800', marginBottom: 16 }}>‹ Voltar</Text>
      </Pressable>
      <View style={styles.card}>
        {cover ? (
          <Image
            source={{ uri: cover }}
            style={{ height: 210, width: '100%', borderRadius: 14, marginBottom: 16 }}
          />
        ) : (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#dbece0',
              borderRadius: 14,
              height: 210,
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.green, fontSize: 54, fontWeight: '900' }}>
              {payload.product.name.slice(0, 1)}
            </Text>
          </View>
        )}
        <Text
          style={{
            color: colors.green,
            fontSize: 12,
            fontWeight: '800',
            textTransform: 'uppercase',
          }}
        >
          {payload.product.type === 'service' ? 'Serviço' : 'Produto'} · {payload.category.name}
        </Text>
        <Text style={{ color: colors.ink, fontSize: 30, fontWeight: '900', marginTop: 7 }}>
          {payload.product.name}
        </Text>
        <Text
          style={{ color: colors.darkGreen, fontSize: 24, fontWeight: '900', marginVertical: 12 }}
        >
          {formatCurrency(Number(payload.product.price), payload.product.currency)}
        </Text>
        {payload.product.description ? (
          <Text style={styles.subtitle}>{payload.product.description}</Text>
        ) : null}
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Estabelecimento</Text>
        <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '800' }}>
          {payload.store.name}
        </Text>
        {payload.store.city || payload.store.province ? (
          <Text style={{ color: colors.muted, marginTop: 5 }}>
            {[payload.store.city, payload.store.province].filter(Boolean).join(', ')}
          </Text>
        ) : null}
        {payload.store.is_private ? (
          <Text style={styles.success}>Estabelecimento privado. Contactos protegidos.</Text>
        ) : (
          <Pressable
            style={styles.secondary}
            onPress={() => router.push(`/store/${payload.store.cuid}`)}
          >
            <Text style={styles.secondaryText}>Ver estabelecimento</Text>
          </Pressable>
        )}
      </View>
      {payload.hours?.length ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Horário</Text>
          {payload.hours.map((hour) => (
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
      ) : null}
    </ScrollView>
  );
}
