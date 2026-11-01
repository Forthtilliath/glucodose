import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VoiceSearchButton } from "@forthtilliath/react-native-kit/components/picker/VoiceSearchButton";

import { searchCiqualFoods, type CiqualFood } from "@/lib/ciqual";
import { formatCarbs } from "@/lib/insulin";
import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  name: string;
  onChangeName: (name: string) => void;
  // Recherche Ciqual (suggestions, loupe, dictée) : à la création seulement.
  withCiqual: boolean;
  onSelectCiqualFood: (food: CiqualFood) => void;
  onOpenCiqualPicker: () => void;
};

// Champ « Nom » d'un ingrédient, avec suggestions Ciqual pendant la frappe.
export function IngredientNameField({ name, onChangeName, withCiqual, onSelectCiqualFood, onOpenCiqualPicker }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);

  // Suggestions compactes affichées automatiquement pendant la frappe. La
  // modale plein écran (icône loupe) reste dispo pour chercher plus large.
  // L'ouverture est pilotée par un état explicite (pas dérivée du focus natif
  // du champ) : sinon, comme le nom sélectionné correspond forcément à un
  // résultat Ciqual, le dropdown se re-remplissait avec la nouvelle valeur
  // avant même que le blur ait le temps de s'appliquer, et restait ouvert.
  const suggestions = useMemo(
    () => (withCiqual && isSuggestionsOpen ? searchCiqualFoods(name) : []),
    [withCiqual, isSuggestionsOpen, name]
  );

  function handleSelectSuggestion(food: CiqualFood) {
    setIsSuggestionsOpen(false);
    onSelectCiqualFood(food);
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="ex: Nutella"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={onChangeName}
          onFocus={() => setIsSuggestionsOpen(true)}
          onBlur={() => setTimeout(() => setIsSuggestionsOpen(false), 150)}
          accessibilityLabel="Nom de l'ingrédient"
        />
        {name.length > 0 && (
          <Pressable onPress={() => onChangeName("")} hitSlop={10} accessibilityRole="button" accessibilityLabel="Vider le nom">
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </Pressable>
        )}
        {withCiqual && (
          <Pressable
            onPress={onOpenCiqualPicker}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Chercher un aliment dans la base Ciqual"
          >
            <Ionicons name="search-outline" size={20} color={colors.primary} />
          </Pressable>
        )}
        {withCiqual && (
          <VoiceSearchButton
            onResult={(transcript) => {
              onChangeName(transcript);
              setIsSuggestionsOpen(true);
            }}
            accessibilityLabel="Dicter le nom de l'aliment à chercher dans Ciqual"
            stopAccessibilityLabel="Arrêter la recherche vocale"
            lang="fr-FR"
            styles={{ iconColor: colors.primary, iconColorActive: colors.danger }}
          />
        )}
      </View>
      {suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((food) => (
            <Pressable
              key={food.name}
              style={styles.suggestionRow}
              onPress={() => handleSelectSuggestion(food)}
              accessibilityRole="button"
              accessibilityLabel={`${food.name}, ${formatCarbs(food.carbsPer100g)} pour 100 grammes, source Ciqual`}
            >
              <Text style={styles.suggestionName}>{food.name}</Text>
              <Text style={styles.suggestionCarbs}>{formatCarbs(food.carbsPer100g)} / 100 g</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { position: "relative", zIndex: 10 },
    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    input: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.text,
    },
    suggestionsBox: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      marginTop: 4,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      overflow: "hidden",
      zIndex: 20,
      elevation: 4,
    },
    suggestionRow: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    suggestionName: { fontSize: 15, color: colors.text },
    suggestionCarbs: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  });
}
