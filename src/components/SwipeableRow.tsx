import { type ReactNode, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

import { type ThemeColors, useColors } from "@/theme/colors";

type Props = {
  children: ReactNode;
  onDelete: () => void;
  deleteLabel: string;
};

// Glisser une ligne de liste vers la gauche pour révéler un bouton
// supprimer, en plus du tap sur la ligne pour l'éditer.
export function SwipeableRow({ children, onDelete, deleteLabel }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const swipeableRef = useRef<Swipeable>(null);

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={() => (
        <Pressable
          style={styles.deleteAction}
          onPress={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
          accessibilityRole="button"
          accessibilityLabel={deleteLabel}
        >
          <Ionicons name="trash-outline" size={22} color="#ffffff" />
          <Text style={styles.deleteActionText}>Supprimer</Text>
        </Pressable>
      )}
    >
      {children}
    </Swipeable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    deleteAction: {
      backgroundColor: colors.danger,
      justifyContent: "center",
      alignItems: "center",
      width: 84,
      marginBottom: 10,
      borderRadius: 12,
      gap: 2,
    },
    deleteActionText: { color: "#ffffff", fontSize: 11, fontWeight: "600" },
  });
}
