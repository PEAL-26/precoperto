import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { DashboardData } from '@precoperto/supabase';
import type { SocialLinks } from '@precoperto/types';
import { getProductStatusLabel } from '@precoperto/utils';
import { getDashboard, updateProduct, updateStore, upsertStoreHours } from '@precoperto/supabase';
import { getMobileSupabaseClient } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { requestCurrentLocation } from '@/lib/location';
import { getMobileAssetUrl } from '@/lib/assets';
import { ProductEditorSheet } from '@/components/ProductEditorSheet';
import { BottomSheet } from '@/components/BottomSheet';
import { colors, styles } from '@/lib/styles';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<'profile' | 'hours' | 'product' | null>(null);
  const [editingProduct, setEditingProduct] = useState<
    DashboardData['products'][number] | undefined
  >();
  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const result = await getDashboard(getMobileSupabaseClient());
    if (result.data) setData(result.data);
    else setError(result.error?.message ?? 'Perfil não encontrado.');
    setLoading(false);
  }, [user]);
  useEffect(() => {
    // Profile data is loaded from Supabase when the authenticated user changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  if (!user) {
    return (
      <View
        style={[styles.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}
      >
        <Text style={styles.title}>Precisa de entrar</Text>
        <Pressable
          style={[styles.primary, { marginTop: 18, paddingHorizontal: 25 }]}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.primaryText}>Entrar</Text>
        </Pressable>
      </View>
    );
  }
  if (loading)
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={colors.green} style={{ marginTop: 120 }} />
      </View>
    );
  if (!data)
    return (
      <BootstrapProfile
        onBootstrap={async () => {
          await load();
        }}
        error={error}
      />
    );
  const avatar = getMobileAssetUrl('store-assets', data.store.avatar);
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.spaceBetween}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ color: colors.green, fontWeight: '800' }}>‹ Voltar</Text>
          </Pressable>
          <Pressable onPress={() => void signOut().then(() => router.replace('/login'))}>
            <Text style={{ color: colors.muted }}>Sair</Text>
          </Pressable>
        </View>
        <View style={[styles.card, { marginTop: 18, alignItems: 'center' }]}>
          {avatar ? (
            <Text style={{ fontSize: 40 }}>◉</Text>
          ) : (
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900' }}>
              {data.store.name.slice(0, 1)}
            </Text>
          )}
          <Text style={{ color: colors.ink, fontSize: 25, fontWeight: '900', marginTop: 8 }}>
            {data.store.name}
          </Text>
          <Text style={{ color: colors.muted }}>{data.user.email}</Text>
          <Text style={[styles.badge, { marginTop: 10 }]}>
            {data.store.is_private ? 'Privado' : 'Público'}
          </Text>
        </View>
        <View style={styles.card}>
          <View style={styles.spaceBetween}>
            <Text style={styles.sectionTitle}>Perfil</Text>
            <Pressable onPress={() => setEditor('profile')}>
              <Text style={{ color: colors.green, fontWeight: '800' }}>Editar</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            {data.store.description || 'Complete a descrição do estabelecimento.'}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 8 }}>
            {[data.store.address, data.store.city, data.store.province]
              .filter(Boolean)
              .join(', ') || 'Localização por completar'}
          </Text>
        </View>
        <View style={styles.card}>
          <View style={styles.spaceBetween}>
            <Text style={styles.sectionTitle}>Horários</Text>
            <Pressable onPress={() => setEditor('hours')}>
              <Text style={{ color: colors.green, fontWeight: '800' }}>Editar</Text>
            </Pressable>
          </View>
          {data.hours.map((hour) => (
            <View key={hour.cuid} style={[styles.spaceBetween, { paddingVertical: 4 }]}>
              <Text>{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][hour.day_of_week]}</Text>
              <Text style={{ color: colors.muted }}>
                {hour.is_closed
                  ? 'Fechado'
                  : `${hour.open_time?.slice(0, 5)} – ${hour.close_time?.slice(0, 5)}`}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.spaceBetween}>
          <Text style={styles.sectionTitle}>Produtos e serviços</Text>
          <Pressable
            onPress={() => {
              setEditingProduct(undefined);
              setEditor('product');
            }}
          >
            <Text style={{ color: colors.green, fontWeight: '800' }}>+ Adicionar</Text>
          </Pressable>
        </View>
        {data.products.length ? (
          data.products.map((product) => (
            <View style={styles.card} key={product.cuid}>
              <View style={styles.spaceBetween}>
                <Text style={{ color: colors.ink, fontWeight: '800', flex: 1 }}>
                  {product.name}
                </Text>
                <Text style={styles.badge}>{getProductStatusLabel(product.status)}</Text>
              </View>
              <Text style={{ color: colors.darkGreen, fontWeight: '900', marginVertical: 7 }}>
                {Number(product.price).toLocaleString('pt-AO')} AOA
              </Text>
              <View style={styles.row}>
                <Pressable
                  style={styles.secondary}
                  onPress={() => {
                    setEditingProduct(product);
                    setEditor('product');
                  }}
                >
                  <Text style={styles.secondaryText}>Editar</Text>
                </Pressable>
                {product.status !== 'active' ? (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => void updateStatus(product.cuid, 'active')}
                  >
                    <Text style={styles.secondaryText}>Activar</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={styles.secondary}
                    onPress={() => void updateStatus(product.cuid, 'inactive')}
                  >
                    <Text style={styles.secondaryText}>Desactivar</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={{ color: colors.muted }}>Ainda não publicou produtos.</Text>
          </View>
        )}
      </ScrollView>
      {editor === 'profile' ? (
        <BottomSheet visible title="Editar perfil" onClose={() => setEditor(null)}>
          <StoreEditor
            store={data.store}
            onSaved={() => {
              setEditor(null);
              void load();
            }}
            onCancel={() => setEditor(null)}
          />
        </BottomSheet>
      ) : null}
      {editor === 'hours' ? (
        <BottomSheet visible title="Editar horários" onClose={() => setEditor(null)}>
          <HoursEditor
            storeCuid={data.store.cuid}
            hours={data.hours}
            onSaved={() => {
              setEditor(null);
              void load();
            }}
          />
        </BottomSheet>
      ) : null}
      {editor === 'product' ? (
        <BottomSheet
          visible
          title={editingProduct ? 'Editar produto' : 'Adicionar produto'}
          onClose={() => setEditor(null)}
        >
          <ProductEditorSheet
            storeCuid={data.store.cuid}
            categories={data.categories}
            product={editingProduct}
            onSaved={() => {
              setEditor(null);
              void load();
            }}
            onCancel={() => setEditor(null)}
          />
        </BottomSheet>
      ) : null}
    </View>
  );

  async function updateStatus(cuid: string, status: 'active' | 'inactive') {
    const result = await updateProduct(getMobileSupabaseClient(), cuid, { status });
    if (result.error) setError(result.error.message);
    else void load();
  }
}

function BootstrapProfile({
  onBootstrap,
  error,
}: {
  onBootstrap: () => Promise<void>;
  error: string | null;
}) {
  const { user, bootstrap } = useAuth();
  const [name, setName] = useState(
    typeof user?.user_metadata?.name === 'string' ? user.user_metadata.name : '',
  );
  const [message, setMessage] = useState<string | null>(error);
  async function complete() {
    const result = await requestCurrentLocation();
    if (result.status !== 'granted') {
      setMessage('É necessário permitir a localização.');
      return;
    }
    await bootstrap({ name, latitude: result.latitude, longitude: result.longitude });
    await onBootstrap();
  }
  return (
    <View style={[styles.screen, { padding: 20, justifyContent: 'center' }]}>
      <Text style={styles.title}>Complete o perfil</Text>
      {message ? <Text style={styles.error}>{message}</Text> : null}
      <TextInput
        style={[styles.input, { marginVertical: 14 }]}
        value={name}
        onChangeText={setName}
        placeholder="Nome"
      />
      <Pressable style={styles.primary} onPress={() => void complete()}>
        <Text style={styles.primaryText}>Obter localização e concluir</Text>
      </Pressable>
    </View>
  );
}

function StoreEditor({
  store,
  onSaved,
  onCancel,
}: {
  store: DashboardData['store'];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(store.name);
  const [description, setDescription] = useState(store.description ?? '');
  const [address, setAddress] = useState(store.address ?? '');
  const [phone, setPhone] = useState(store.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(store.whatsapp ?? '');
  const [email, setEmail] = useState(store.email ?? '');
  const [website, setWebsite] = useState(store.website ?? '');
  const [city, setCity] = useState(store.city ?? '');
  const [province, setProvince] = useState(store.province ?? '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(store.social_links ?? {});
  const [isPrivate, setIsPrivate] = useState(store.is_private);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setPending(true);
    const result = await updateStore(getMobileSupabaseClient(), store.cuid, {
      name,
      description: description || null,
      address: address || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      website: website || null,
      city: city || null,
      province: province || null,
      social_links: socialLinks,
      is_private: isPrivate,
    });
    setPending(false);
    if (result.error) setError(result.error.message);
    else onSaved();
  }
  return (
    <View style={{ gap: 12 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.label}>Endereço</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />
      <Text style={styles.label}>Telefone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>WhatsApp</Text>
      <TextInput
        style={styles.input}
        value={whatsapp}
        onChangeText={setWhatsapp}
        keyboardType="phone-pad"
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Website</Text>
      <TextInput
        style={styles.input}
        value={website}
        onChangeText={setWebsite}
        keyboardType="url"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Facebook</Text>
      <TextInput
        style={styles.input}
        value={socialLinks.facebook ?? ''}
        onChangeText={(value) => setSocialLinks((current) => ({ ...current, facebook: value }))}
        keyboardType="url"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Instagram</Text>
      <TextInput
        style={styles.input}
        value={socialLinks.instagram ?? ''}
        onChangeText={(value) => setSocialLinks((current) => ({ ...current, instagram: value }))}
        keyboardType="url"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Cidade</Text>
      <TextInput style={styles.input} value={city} onChangeText={setCity} />
      <Text style={styles.label}>Província</Text>
      <TextInput style={styles.input} value={province} onChangeText={setProvince} />
      <Pressable style={styles.row} onPress={() => setIsPrivate(!isPrivate)}>
        <Text
          style={[
            styles.badge,
            isPrivate ? { backgroundColor: '#fff0cc', color: '#835b14' } : null,
          ]}
        >
          {isPrivate ? 'Privado' : 'Público'}
        </Text>
        <Text style={{ color: colors.muted, flex: 1, marginLeft: 10 }}>
          Toque para alterar a privacidade
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
          <Text style={styles.primaryText}>Guardar</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HoursEditor({
  storeCuid,
  hours,
  onSaved,
}: {
  storeCuid: string;
  hours: DashboardData['hours'];
  onSaved: () => void;
}) {
  const [values, setValues] = useState(
    hours.map((hour) => ({
      day_of_week: hour.day_of_week,
      is_closed: hour.is_closed,
      open_time: hour.open_time?.slice(0, 5) ?? '08:00',
      close_time: hour.close_time?.slice(0, 5) ?? '18:00',
    })),
  );
  const [error, setError] = useState<string | null>(null);
  async function save() {
    const result = await upsertStoreHours(
      getMobileSupabaseClient(),
      storeCuid,
      values.map((value) => ({
        ...value,
        open_time: value.is_closed ? null : value.open_time,
        close_time: value.is_closed ? null : value.close_time,
      })),
    );
    if (result.error) setError(result.error.message);
    else onSaved();
  }
  return (
    <View style={{ gap: 12 }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {values.map((value, index) => (
        <View
          key={value.day_of_week}
          style={{ borderBottomColor: colors.line, borderBottomWidth: 1, paddingBottom: 10 }}
        >
          <View style={styles.spaceBetween}>
            <Text style={{ fontWeight: '800' }}>
              {
                ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][
                  value.day_of_week
                ]
              }
            </Text>
            <Pressable
              onPress={() =>
                setValues((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, is_closed: !item.is_closed } : item,
                  ),
                )
              }
            >
              <Text style={{ color: colors.green, fontWeight: '800' }}>
                {value.is_closed ? 'Fechado' : 'Aberto'}
              </Text>
            </Pressable>
          </View>
          {!value.is_closed ? (
            <View style={[styles.row, { marginTop: 8 }]}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={value.open_time}
                onChangeText={(text) =>
                  setValues((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, open_time: text } : item,
                    ),
                  )
                }
                placeholder="08:00"
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={value.close_time}
                onChangeText={(text) =>
                  setValues((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, close_time: text } : item,
                    ),
                  )
                }
                placeholder="18:00"
              />
            </View>
          ) : null}
        </View>
      ))}
      <Pressable style={styles.primary} onPress={() => void save()}>
        <Text style={styles.primaryText}>Guardar horários</Text>
      </Pressable>
    </View>
  );
}
