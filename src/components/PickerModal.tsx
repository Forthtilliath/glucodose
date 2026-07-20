import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

export type PickerItem = {
  id: number;
  label: string;
  subtitle?: string;
  imageUri?: string | null;
};

type Props = {
  visible: boolean;
  title: string;
  items: PickerItem[];
  onSelect: (item: PickerItem) => void;
  onClose: () => void;
  emptyMessage?: string;
  // Recherche initiale à l'ouverture (ex: reprendre ce que l'utilisateur a
  // déjà tapé ailleurs). Par défaut, la recherche démarre vide.
  initialQuery?: string;
  // Filtre personnalisé (ex: classement par pertinence) ; par défaut, simple
  // sous-chaîne insensible à la casse, comme avant.
  filterItems?: (items: PickerItem[], query: string) => PickerItem[];
};

export function PickerModal({
  visible,
  title,
  items,
  onSelect,
  onClose,
  emptyMessage,
  initialQuery,
  filterItems,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState(initialQuery ?? "");

  useEffect(() => {
    if (visible) setQuery(initialQuery ?? "");
  }, [visible, initialQuery]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    if (filterItems) return filterItems(items, query);
    const q = query.trim().toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query, filterItems]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer">
            <Text style={styles.close}>Fermer</Text>
          </Pressable>
        </View>
        <TextInput
          style={styles.search}
          placeholder="Rechercher…"
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          accessibilityLabel="Rechercher"
        />
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <Text style={styles.empty}>{emptyMessage ?? "Aucun résultat."}</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => {
                onSelect(item);
                setQuery("");
              }}
              accessibilityRole="button"
              accessibilityLabel={item.subtitle ? `${item.label}, ${item.subtitle}` : item.label}
            >
              {item.imageUri ? (
                <Image source={{ uri: item.imageUri }} style={styles.rowThumbnail} accessibilityIgnoresInvertColors />
              ) : item.imageUri === null ? (
                <View style={styles.rowThumbnailPlaceholder}>
                  <Ionicons name="cube-outline" size={18} color={colors.textMuted} />
                </View>
              ) : null}
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                {item.subtitle ? <Text style={styles.rowSubtitle}>{item.subtitle}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingTop: 60, paddingHorizontal: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
    title: { fontSize: 20, fontWeight: "700", color: colors.text },
    close: { fontSize: 16, color: colors.primary },
    search: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      marginBottom: 8,
      color: colors.text,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      marginBottom: 8,
    },
    rowThumbnail: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.background },
    rowThumbnailPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
    rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    empty: { textAlign: "center", color: colors.textMuted, marginTop: 24 },
  });
}
