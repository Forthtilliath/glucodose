import { useState } from "react";
import { Pressable } from "react-native";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { Ionicons } from "@expo/vector-icons";

import { useColors } from "@/theme/colors";

type Props = {
  onResult: (transcript: string) => void;
  accessibilityLabel?: string;
};

// Bouton micro pour dicter une recherche au lieu de la taper. Un seul
// composant à la fois doit être monté en écoute active : les événements de
// reconnaissance sont globaux au module natif, pas propres à une instance.
export function VoiceSearchButton({ onResult, accessibilityLabel = "Recherche vocale" }: Props) {
  const colors = useColors();
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("error", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event) => {
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
