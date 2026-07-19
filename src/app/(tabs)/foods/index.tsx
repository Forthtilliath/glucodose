import { Link, useRouter } from "expo-router";
import { desc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { foods } from "@/db/schema";
import { formatCarbs } from "@/lib/insulin";
import { colors } from "@/theme/colors";

export default function FoodsScreen() {
  const router = useRouter();
  const { data } = useLiveQuery(
    db.select().from(foods).where(eq(foods.isArchived, false)).orderBy(desc(foods.updatedAt))
  );

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
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push(
                item.type === "recipe" ? `/foods/recipe/${item.id}` : `/foods/ingredient/${item.id}`
              )
            }
          >
            <View style={styles.rowMain}>
              <View style={[styles.badge, item.type === "recipe" ? styles.badgeRecipe : styles.badgeIngredient]}>
                <Text style={styles.badgeText}>{item.type === "recipe" ? "Recette" : "Ingrédient"}</Text>
              </View>
              <Text style={styles.rowLabel}>{item.name}</Text>
            </View>
            <Text style={styles.rowValue}>{formatCarbs(item.carbsPer100g)}/100g</Text>
          </Pressable>
        )}
      />
      <Link href="/foods/new" asChild>
        <Pressable style={styles.fab}>
          <Ionicons name="add" size={28} color={colors.primaryText} />
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16, paddingBottom: 96 },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  badgeIngredient: { backgroundColor: "#dbeafe" },
  badgeRecipe: { backgroundColor: "#dcfce7" },
  badgeText: { fontSize: 11, fontWeight: "700", color: colors.text },
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
