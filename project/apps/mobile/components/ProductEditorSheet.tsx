import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { Category, Product } from '@precoperto/types';
import { getProductAssetPath } from '@precoperto/utils';
import { createProduct, updateProduct, uploadAsset } from '@precoperto/supabase';
import { getMobileSupabaseClient } from '@/lib/supabase';
import { styles } from '@/lib/styles';

export function ProductEditorSheet({
  storeCuid,
  categories,
  product,
  onSaved,
  onCancel,
}: {
  storeCuid: string;
  categories: Category[];
  product?: Product;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [type, setType] = useState<'product' | 'service'>(product?.type ?? 'product');
  const [category, setCategory] = useState(product?.category_cuid ?? categories[0]?.cuid ?? '');
  const [price, setPrice] = useState(product ? String(product.price) : '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [status, setStatus] = useState<'active' | 'inactive' | 'archived'>(
    product?.status ?? 'active',
  );
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }
  async function save() {
    if (!name || !category || !price) {
      setError('Preencha nome, categoria e preço.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const client = getMobileSupabaseClient();
      const body = {
        store_cuid: storeCuid,
        name,
        type,
        category_cuid: category,
        price: Number(price),
        currency: 'AOA' as const,
        description: description || null,
        status,
        cover: product?.cover ?? null,
      };
      const result = product
        ? await updateProduct(client, product.cuid, body)
        : await createProduct(client, body);
      if (result.error) throw new Error(result.error.message);
      if (image && result.data) {
        const path = getProductAssetPath(
          storeCuid,
          result.data.cuid,
          image.fileName ?? 'cover.jpg',
        );
        const upload = await uploadAsset(
          client,
          'product-assets',
          path,
          { uri: image.uri, name: image.fileName, type: image.mimeType },
          image.mimeType,
        );
        if (upload.error) throw new Error(upload.error.message);
        await updateProduct(client, result.data.cuid, { cover: path });
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível guardar.');
    } finally {
      setPending(false);
    }
  }
  return (
    <View style={{ gap: 12 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Tipo</Text>
      <View style={styles.row}>
        <Pressable style={[styles.secondary, { flex: 1 }]} onPress={() => setType('product')}>
          <Text style={[styles.secondaryText, type === 'product' ? { color: '#fff' } : null]}>
            Produto
          </Text>
        </Pressable>
        <Pressable style={[styles.secondary, { flex: 1 }]} onPress={() => setType('service')}>
          <Text style={[styles.secondaryText, type === 'service' ? { color: '#fff' } : null]}>
            Serviço
          </Text>
        </Pressable>
      </View>
      <Text style={styles.label}>Categoria</Text>
      <View style={styles.row}>
        {categories.map((item) => (
          <Pressable
            key={item.cuid}
            style={[styles.secondary, { flex: 1 }]}
            onPress={() => setCategory(item.cuid)}
          >
            <Text style={[styles.secondaryText, category === item.cuid ? { color: '#fff' } : null]}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Preço (AOA)</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.label}>Estado</Text>
      <View style={styles.row}>
        {['active', 'inactive', 'archived'].map((item) => (
          <Pressable
            key={item}
            style={[styles.secondary, { flex: 1 }]}
            onPress={() => setStatus(item as typeof status)}
          >
            <Text style={[styles.secondaryText, status === item ? { color: '#fff' } : null]}>
              {item === 'active' ? 'Activo' : item === 'inactive' ? 'Inactivo' : 'Arquivado'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.secondary} onPress={() => void chooseImage()}>
        <Text style={styles.secondaryText}>
          {image ? 'Trocar imagem' : 'Escolher imagem (opcional)'}
        </Text>
      </Pressable>
      <View style={styles.row}>
        <Pressable style={[styles.secondary, { flex: 1 }]} onPress={onCancel}>
          <Text style={styles.secondaryText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.primary, { flex: 1 }]}
          onPress={() => void save()}
          disabled={pending}
        >
          {pending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Guardar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
