import { Image } from "react-native";
import { render } from "@testing-library/react-native";
import { Ionicons } from "@expo/vector-icons";

import { Thumbnail } from "./Thumbnail";

describe("Thumbnail", () => {
  it("affiche la photo quand une uri est fournie", () => {
    const { UNSAFE_getByType, UNSAFE_queryByType } = render(
      <Thumbnail photoUri="file:///photo.jpg" placeholderIcon="cube-outline" />
    );
    expect(UNSAFE_getByType(Image).props.source).toEqual({ uri: "file:///photo.jpg" });
    expect(UNSAFE_queryByType(Ionicons)).toBeNull();
  });

  it("affiche l'icône de substitution quand il n'y a pas de photo", () => {
    const { UNSAFE_getByType, UNSAFE_queryByType } = render(
      <Thumbnail photoUri={null} placeholderIcon="restaurant-outline" />
    );
    expect(UNSAFE_getByType(Ionicons).props.name).toBe("restaurant-outline");
    expect(UNSAFE_queryByType(Image)).toBeNull();
  });
});
