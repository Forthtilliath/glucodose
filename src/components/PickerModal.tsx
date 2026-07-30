import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, SectionList, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";

export type PickerItem = {
  id: number;
  label: string;
  subtitle?: string;
  imageUri?: string | null;
  // Regroupe les résultats en sections (ex: groupes alimentaires Ciqual,
  // ingrédients vs recettes) quand on parcourt la liste sans rechercher.
  // Ignoré pendant une recherche active : on veut alors les meilleurs
  // résultats globaux, pas la liste repliée par section.
  group?: string;
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
  // Actions "ajouter" toujours visibles en haut de la liste, même si la
  // recherche ne matche rien (contrairement aux résultats, filtrés).
  extraActions?: { label: string; onPress: () => void }[];
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
  extraActions,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState(initialQuery ?? "");

  useEffect(() => {
    if (visible) setQuery(initialQuery ?? "");
  }, [visible, initialQuery]);

  const isSearching = query.trim().length > 0;
  const filtered = useMemo(() => {
    if (!isSearching) return items;
    if (filterItems) return filterItems(items, query);
    const q = query.trim().toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, query, filterItems, isSearching]);

  // Sections triées par titre : ordre stable et indépendant de l'ordre des
  // groupes dans les données sources. Pas de section pendant une recherche
  // (résultats classés par pertinence, pas par groupe), ni si aucun item
  // n'a de groupe (tous les pickers non-catégorisés, comportement inchangé).
  const sections = useMemo(() => {
    if (isSearching || !filtered.some((item) => item.group)) {
      return [{ title: null as string | null, data: filtered }];
    }
    const byGroup = new Map<string, PickerItem[]>();
    for (const item of filtered) {
      const key = item.group ?? "Autres";
      const group = byGroup.get(key);
      if (group) group.push(item);
      else byGroup.set(key, [item]);
    }
    return [...byGroup.entries()]
      .sort(([a], [b]) => a.localeCompare(b, "fr"))
      .map(([title, data]) => ({ title, data }));
  }, [filtered, isSearching]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Fermer">
            <Text style={styles.close}>Fermer</Text>
          </Pressable>
        </View>
        <View style={styles.searchRow}>
          <TextInput
            style={[styles.search, styles.searchInput]}
            placeholder="Rechercher…"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            accessibilityLabel="Rechercher"
          />
          <VoiceSearchButton onResult={setQuery} accessibilityLabel="Dicter la recherche" />
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            extraActions && extraActions.length > 0 ? (
              <View style={styles.extraActions}>
                {extraActions.map((action) => (
                  <Pressable
                    key={action.label}
                    style={styles.row}
                    onPress={action.onPress}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.rowLabel, styles.extraActionLabel]}>{action.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>{emptyMessage ?? "Aucun résultat."}</Text>
          }
          renderSectionHeader={({ section: { title } }) =>
            title ? <Text style={styles.sectionHeader}>{title}</Text> : null
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
    searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    search: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    searchInput: { flex: 1, marginBottom: 0 },
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
    sectionHeader: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textMuted,
      textTransform: "uppercase",
      marginTop: 8,
      marginBottom: 6,
    },
    extraActions: { marginBottom: 4 },
    extraActionLabel: { color: colors.primary },
  });
}
