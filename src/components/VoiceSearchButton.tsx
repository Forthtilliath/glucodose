import { useRef, useState } from "react";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";

import { useColors } from "@/theme/colors";

type Props = {
  onResult: (transcript: string) => void;
  accessibilityLabel?: string;
};

// Bouton micro pour dicter une recherche au lieu de la taper. Les événements
// de reconnaissance sont globaux au module natif (pas propres à une
// instance) : plusieurs boutons peuvent être montés en même temps (ex. champ
// nom + sélecteur Ciqual sur le même écran). `requestedRef` distingue le
// bouton qui a démarré CETTE session des autres instances montées, pour
// qu'un seul reçoive le résultat au lieu de tous.
export function VoiceSearchButton({ onResult, accessibilityLabel = "Recherche vocale" }: Props) {
  const colors = useColors();
  const [isListening, setIsListening] = useState(false);
  const requestedRef = useRef(false);

  useSpeechRecognitionEvent("start", () => {
    if (requestedRef.current) setIsListening(true);
  });
  useSpeechRecognitionEvent("end", () => {
    if (requestedRef.current) {
      setIsListening(false);
      requestedRef.current = false;
    }
  });
  useSpeechRecognitionEvent("error", () => {
    if (requestedRef.current) {
      setIsListening(false);
      requestedRef.current = false;
    }
  });
  useSpeechRecognitionEvent("result", (event) => {
    if (!requestedRef.current) return;
    const transcript = event.results[0]?.transcript;
    if (transcript) onResult(transcript);
  });

  async function handlePress() {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) return;
    requestedRef.current = true;
    ExpoSpeechRecognitionModule.start({ lang: "fr-FR", interimResults: false });
  }

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={isListening ? "Arrêter la recherche vocale" : accessibilityLabel}
    >
      <Ionicons
        name={isListening ? "mic" : "mic-outline"}
        size={20}
        color={isListening ? colors.danger : colors.primary}
      />
    </Pressable>
  );
}
