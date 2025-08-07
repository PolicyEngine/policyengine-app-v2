import NewExistingIngredientSelector from "@/components/NewExistingIngredientSelector";

export default function SimulationSetupPopulationFrame() {

  // TODO: After roping in population ingredient, write correct functions
  function temporaryNullFunc() {
    return;
  }

  return (
    <NewExistingIngredientSelector ingredientName="population" onClickCreateNew={temporaryNullFunc} onClickExisting={temporaryNullFunc}/>
  );
}