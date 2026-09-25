import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/lib/styles';

export function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityLabel="Fechar" onPress={onClose}>
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(17,38,25,0.48)' },
  dismissArea: { flex: 1 },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: '#c7d2ca',
    borderRadius: 99,
    height: 5,
    marginTop: 10,
    width: 42,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  title: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  close: { color: colors.muted, fontSize: 30, lineHeight: 30 },
  content: { paddingBottom: 20 },
});
