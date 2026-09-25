import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SearchProduct } from '@precoperto/types';
import { formatCurrency, formatDistance, getInitials } from '@precoperto/utils';
import { colors, styles } from '@/lib/styles';

export function ProductCard({ product, onPress }: { product: SearchProduct; onPress: () => void }) {
  const distance = formatDistance(product.distance_meters);
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={cardStyles.cover}>
          {product.cover ? (
            <Image source={{ uri: product.cover }} style={cardStyles.image} />
          ) : (
            <Text style={cardStyles.coverText}>{getInitials(product.name)}</Text>
          )}
        </View>
        <View style={cardStyles.info}>
          <Text style={cardStyles.type}>
            {product.type === 'service' ? 'Serviço' : 'Produto'} · {product.category_name}
          </Text>
          <Text style={cardStyles.name}>{product.name}</Text>
          <Text style={cardStyles.price}>
            {formatCurrency(Number(product.price), product.currency)}
          </Text>
          <View style={styles.spaceBetween}>
            <Text style={cardStyles.store} numberOfLines={1}>
              {product.store_name}
            </Text>
            {distance ? <Text style={cardStyles.distance}>{distance}</Text> : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  cover: {
    alignItems: 'center',
    backgroundColor: '#dbece0',
    borderRadius: 14,
    height: 92,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 92,
  },
  image: { height: '100%', width: '100%' },
  coverText: { color: colors.green, fontSize: 28, fontWeight: '900' },
  info: { flex: 1, gap: 5, paddingLeft: 12 },
  type: { color: colors.green, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  name: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  price: { color: colors.darkGreen, fontSize: 16, fontWeight: '900' },
  store: { color: colors.muted, flex: 1, fontSize: 12 },
  distance: { color: colors.green, fontSize: 12, fontWeight: '800' },
});
