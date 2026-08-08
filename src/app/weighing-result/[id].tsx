import { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { db } from "@/db/client";
import { deleteWeighing } from "@/db/repository";
import { weighings } from "@/db/schema";
import { formatCarbs, formatInsulinUnits, formatWeight } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

// Le temps que la notification reste visible avant de s'effacer en fondu —
// le résultat en dessous, lui, reste affiché tant que l'écran est ouvert.
const TOAST_VISIBLE_MS = 2500;
const TOAST_FADE_MS = 300;

export default function WeighingResultScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const weighingId = Number(id);

  const { data } = useLiveQuery(db.select().from(weighings).where(eq(weighings.id, weighingId)));
  const weighing = data?.[0];

  const [toastVisible, setToastVisible] = useState(true);
  const [toastOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: TOAST_FADE_MS,
        useNativeDriver: true,
      }).start(() => setToastVisible(false));
    }, TOAST_VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, [toastOpacity]);

  async function handleUndo() {
    await deleteWeighing(weighingId);
    router.back();
  }

  // La pesée a été annulée (ou n'existe plus pour une autre raison) pendant
  // que cet écran était ouvert : rien de pertinent à afficher, on repart.
  useEffect(() => {
    if (data && data.length === 0) router.back();
  }, [data, router]);

  if (!weighing) return <View style={styles.container} />;

  const hasInsulinDose = weighing.ratioLabelSnapshot != null;

  return (
    <View style={styles.container}>
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={20} color={colors.primaryText} />
          <Text style={styles.toastText}>Pesée enregistrée</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.foodName}>{weighing.foodNameSnapshot}</Text>
        <Text style={styles.subtitle}>
          {new Date(weighing.weighedAt).toLocaleString("fr-FR")} · {formatWeight(weighing.netWeightG)} net
        </Text>

        {hasInsulinDose ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Dose d’insuline totale</Text>
            <Text style={styles.resultValue}>{formatInsulinUnits(weighing.totalInsulinUnits)} U</Text>
            {weighing.correctionInsulinUnits > 0 && (
              <Text style={styles.resultBreakdown}>
                {formatInsulinUnits(weighing.mealInsulinUnits)} U repas + {""}
                {formatInsulinUnits(weighing.correctionInsulinUnits)} U correction
              </Text>
            )}
            <Text style={styles.resultCarbs}>
              {formatCarbs(weighing.carbsG)} de glucides · {weighing.ratioLabelSnapshot}
            </Text>
          </View>
        ) : (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Glucides</Text>
            <Text style={styles.resultValue}>{formatCarbs(weighing.carbsG)}</Text>
          </View>
        )}

        <Pressable
          onPress={handleUndo}
          hitSlop={10}
          style={styles.undoLink}
          accessibilityRole="button"
          accessibilityLabel="Annuler cette pesée"
        >
          <Text style={styles.undoLinkText}>Annuler cette pesée</Text>
        </Pressable>

        <Pressable
          style={styles.closeButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Fermer et faire une nouvelle pesée"
        >
          <Text style={styles.closeButtonText}>Nouvelle pesée</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingTop: 24, paddingBottom: 48, alignItems: "center" },
    toast: {
      position: "absolute",
      top: 12,
      left: 16,
      right: 16,
      zIndex: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.success,
      borderRadius: 10,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    toastText: { color: colors.primaryText, fontSize: 15, fontWeight: "700" },
    foodName: { fontSize: 22, fontWeight: "700", color: colors.text, textAlign: "center" },
    subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, textAlign: "center" },
    resultBox: {
      marginTop: 32,
      width: "100%",
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 32,
      alignItems: "center",
    },
    resultLabel: { fontSize: 15, color: colors.textMuted, fontWeight: "600" },
    resultValue: { fontSize: 56, fontWeight: "800", color: colors.primary, marginTop: 8 },
    resultBreakdown: { fontSize: 13, color: colors.textMuted, marginTop: 10, textAlign: "center" },
    resultCarbs: { fontSize: 13, color: colors.textMuted, marginTop: 14, textAlign: "center" },
    undoLink: { marginTop: 20 },
    undoLinkText: { color: colors.danger, fontSize: 14, fontWeight: "700" },
    closeButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 16,
      alignItems: "center",
      width: "100%",
      marginTop: 32,
    },
    closeButtonText: { color: colors.primaryText, fontSize: 17, fontWeight: "700" },
  });
}
