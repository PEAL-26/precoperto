import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { SearchProduct } from '@precoperto/types';
import { getMobileAssetUrl } from '@/lib/assets';
import { getMobileSupabaseClient } from '@/lib/supabase';
import { requestCurrentLocation } from '@/lib/location';
import { useAuth } from '@/lib/auth-context';
import { ProductCard } from '@/components/ProductCard';
import { colors, styles } from '@/lib/styles';
import { getNextSearchCursor, searchProducts } from '@precoperto/supabase';

export default function ExploreScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchProduct[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    'A localização será usada apenas para ordenar resultados.',
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextCursor: string | null, append = false) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: searchError } = await searchProducts(getMobileSupabaseClient(), {
          search: query,
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          cursor: nextCursor,
          limit: 24,
        });
        if (searchError) throw new Error(searchError.message);
        const nextItems = (data ?? []) as SearchProduct[];
        setItems((current) => (append ? [...current, ...nextItems] : nextItems));
        setCursor(getNextSearchCursor(nextItems));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Não foi possível pesquisar.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [latitude, longitude, query],
  );

  useEffect(() => {
    // Search is an external data source and is loaded when its inputs change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(null);
  }, [load]);

  async function locate() {
    const result = await requestCurrentLocation();
    if (result.status === 'granted') {
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setLocationMessage('Localização activada: resultados ordenados por proximidade.');
    } else if (result.status === 'denied') {
      setLocationMessage('Permissão recusada. A pesquisa continua sem distância.');
    } else {
      setLocationMessage('Localização indisponível. A pesquisa continua sem distância.');
    }
  }

  function submitSearch() {
    setQuery(input.trim());
  }

  function refresh() {
    setRefreshing(true);
    void load(null);
  }

  const header = (
    <View>
      <View style={styles.spaceBetween}>
        <View>
          <Text style={styles.title}>Explorar</Text>
          <Text style={styles.subtitle}>Preços perto de si.</Text>
        </View>
        {user ? (
          <Pressable onPress={() => router.push('/profile')}>
            <Text style={{ color: colors.green, fontWeight: '800' }}>Perfil</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/login')}>
            <Text style={{ color: colors.green, fontWeight: '800' }}>Entrar</Text>
          </Pressable>
        )}
      </View>
      <View style={[styles.card, { marginTop: 18 }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={submitSearch}
          placeholder="Pesquisar produtos e serviços"
          returnKeyType="search"
        />
        <Pressable style={[styles.primary, { marginTop: 10 }]} onPress={submitSearch}>
          <Text style={styles.primaryText}>Pesquisar</Text>
        </Pressable>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10 }}>{locationMessage}</Text>
        {latitude === null ? (
          <Pressable style={styles.secondary} onPress={() => void locate()}>
            <Text style={styles.secondaryText}>Usar localização</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.spaceBetween}>
        <Text style={styles.sectionTitle}>
          {query ? `Resultados para “${query}”` : 'Produtos e serviços'}
        </Text>
        <Text style={{ color: colors.muted }}>{items.length}</Text>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && items.length === 0 ? (
        <Text style={{ color: colors.muted, paddingVertical: 20 }}>A carregar…</Text>
      ) : null}
      {!loading && items.length === 0 ? (
        <View style={styles.card}>
          <Text style={{ color: colors.ink, fontWeight: '800' }}>Nenhum resultado</Text>
          <Text style={{ color: colors.muted, marginTop: 5 }}>Tente outra pesquisa.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.product_cuid}
        renderItem={({ item }) => (
          <ProductCard
            product={{ ...item, cover: getMobileAssetUrl('product-assets', item.cover) }}
            onPress={() => router.push(`/products/${item.product_cuid}`)}
          />
        )}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.green} />
        }
        onEndReached={() => {
          if (cursor && !loading) void load(cursor, true);
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={header}
        ListFooterComponent={
          loading && items.length > 0 ? (
            <Text style={{ color: colors.muted, padding: 18, textAlign: 'center' }}>
              A carregar mais…
            </Text>
          ) : (
            <View style={{ height: 20 }} />
          )
        }
      />
    </View>
  );
}
