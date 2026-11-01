import type { ComponentProps } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

type Props = ComponentProps<typeof KeyboardAwareScrollView>;

// ScrollView des écrans de saisie : à l'ouverture du clavier, fait défiler
// jusqu'au champ actif pour qu'il reste visible au-dessus du clavier (Android
// en edge-to-edge ne redimensionne plus l'écran tout seul). « handled » :
// toucher un bouton clavier ouvert déclenche le bouton du premier coup, au
// lieu de seulement fermer le clavier.
export function FormScrollView({ bottomOffset = 24, keyboardShouldPersistTaps = "handled", ...props }: Props) {
  return (
    <KeyboardAwareScrollView
      bottomOffset={bottomOffset}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...props}
    />
  );
}
