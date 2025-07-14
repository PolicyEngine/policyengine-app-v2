import { mockParamFolder } from "@/TEST_TO_DELETE/mockParamFolder";
import NestedMenu from "../common/NestedMenu";

export default function ParamList() {
  
  return (
    <NestedMenu data={mockParamFolder} />
  )
}