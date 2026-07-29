import { Text } from "react-native";
import { fireEvent, render } from "@testing-library/react-native";

import { SwipeableRow } from "./SwipeableRow";

describe("SwipeableRow", () => {
  it("affiche son contenu enfant", () => {
    const { getByText } = render(
      <SwipeableRow onDelete={() => {}} deleteLabel="Supprimer">
        <Text>Mon contenu</Text>
      </SwipeableRow>
    );
    expect(getByText("Mon contenu")).toBeTruthy();
  });

  it("appelle onDelete quand on presse le bouton Supprimer révélé par le swipe", () => {
    const onDelete = jest.fn();
    const { getByLabelText } = render(
      <SwipeableRow onDelete={onDelete} deleteLabel="Supprimer le test">
        <Text>Contenu</Text>
      </SwipeableRow>
    );

    fireEvent.press(getByLabelText("Supprimer le test"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
