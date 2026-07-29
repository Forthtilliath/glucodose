import { useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SwipeableRow } from "@/components/SwipeableRow";
import { db } from "@/db/client";
import { deleteContainer } from "@/db/repository";
import { containers } from "@/db/schema";
import { confirmDestructive } from "@/lib/confirmDelete";
import { formatWeight } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function ContainersScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data } = useLiveQuery(db.select().from(containers).orderBy(desc(containers.updatedAt)));

  function handleDelete(container: { id: number; name: string; photoUri: string | null }) {
    confirmDestructive(`Supprimer "${container.name}" ?`, () =>
      deleteContainer(container.id, container.photoUri)
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun récipient enregistré pour l'instant.</Text>
        }
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item)} deleteLabel={`Supprimer le récipient ${item.name}`}>
            <Pressable
              style={styles.row}
              onPress={() => router.push(`/containers/${item.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Récipient ${item.name}, tare ${formatWeight(item.tareWeightG)}. Modifier.`}
            >
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.thumbnail} accessibilityIgnoresInvertColors />
              ) : (
                <View style={styles.thumbnailPlaceholder}>
                  <Ionicons name="cube-outline" size={22} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.rowMain}>
                <Text style={styles.rowLabel}>{item.name}</Text>
                {item.notes ? <Text style={styles.rowSubtitle}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.rowWeight}>{formatWeight(item.tareWeightG)}</Text>
            </Pressable>
          </SwipeableRow>
        )}
      />
      <Link href="/containers/new" asChild>
        <Pressable style={styles.fab} accessibilityRole="button" accessibilityLabel="Ajouter un récipient">
          <Ionicons name="add" size={28} color={colors.primaryText} />
        </Pressable>
      </Link>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: 16, paddingBottom: 96 },
    empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
    },
    thumbnail: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.background },
    thumbnailPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    rowMain: { flex: 1 },
    rowLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
    rowSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    rowWeight: { fontSize: 16, fontWeight: "700", color: colors.primary },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
  });
}
