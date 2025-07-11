import { useSelector } from "react-redux"
import { componentRegistry } from "@/flows/registry";

export default function FlowContainer() {
  const flow = useSelector((state: any) => state.flow);

  if (!flow || !flow.initialFrame) {
    return <p>No flow available</p>;
  }

  // Temporarily just get the initial frame from the flow
  const componentName = flow.initialFrame;

  // Check if the component exists in the registry
  const hasKey = componentName in componentRegistry;

  const Component = componentRegistry[componentName as keyof typeof componentRegistry];

  if (!Component) {
    return (
      <div>
        <p>Component not found: {componentName}</p>
        <p>Available components: {Object.keys(componentRegistry).join(', ')}</p>
      </div>
    );
  }

  return (
    <>
      <Component />
    </>
  );
}