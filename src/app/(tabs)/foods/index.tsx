import { useMemo } from "react";
import { Link, useRouter } from "expo-router";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { SwipeableRow } from "@/components/SwipeableRow";
import { Thumbnail } from "@/components/Thumbnail";
import { db } from "@/db/client";
import { foods } from "@/db/schema";
import { confirmDeleteOrArchiveFood } from "@/lib/confirmDelete";
import { formatCarbs } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

export default function FoodsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const { data } = useLiveQuery(
    db.select().from(foods).where(eq(foods.isArchived, false)).orderBy(desc(foods.updatedAt))
  );

  async function handleDelete(food: { id: number; name: string; photoUri: string | null }) {
    await confirmDeleteOrArchiveFood(food, () => {});
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun aliment enregistré pour l'instant.</Text>
        }
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item)} deleteLabel={`Supprimer l'aliment ${item.name}`}>
            <Pressable
              style={styles.row}
              onPress={() =>
                router.push(
                  item.type === "recipe" ? `/foods/recipe/${item.id}` : `/foods/ingredient/${item.id}`
                )
              }
              accessibilityRole="button"
              accessibilityLabel={`${item.type === "recipe" ? "Recette" : "Ingrédient"} ${item.name}, ${formatCarbs(item.carbsPer100g)} pour 100g. Modifier.`}
            >
              <Thumbnail photoUri={item.photoUri} placeholderIcon="restaurant-outline" />
              <View style={styles.rowMain}>
                <View style={[styles.badge, item.type === "recipe" ? styles.badgeRecipe : styles.badgeIngredient]}>
                  <Text style={styles.badgeText}>{item.type === "recipe" ? "Recette" : "Ingrédient"}</Text>
                </View>
                <Text style={styles.rowLabel}>{item.name}</Text>
              </View>
              <Text style={styles.rowValue}>{formatCarbs(item.carbsPer100g)}/100g</Text>
            </Pressable>
          </SwipeableRow>
        )}
      />
      <Link href="/foods/new" asChild>
        <Pressable style={styles.fab} accessibilityRole="button" accessibilityLabel="Ajouter un aliment">
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
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
    rowMain: { flex: 1, flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 10 },
    rowLabel: { fontSize: 16, fontWeight: "600", color: colors.text, flexShrink: 1 },
    rowValue: { fontSize: 15, fontWeight: "700", color: colors.primary, flexShrink: 0 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeIngredient: { backgroundColor: colors.badgeIngredientBg },
    badgeRecipe: { backgroundColor: colors.badgeRecipeBg },
    badgeText: { fontSize: 11, fontWeight: "700", color: colors.badgeText },
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
