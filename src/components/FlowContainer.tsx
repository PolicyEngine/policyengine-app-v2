import { useDispatch, useSelector } from 'react-redux';
import { componentRegistry, flowRegistry } from '@/flows/registry';
import { navigateToFlow, navigateToFrame, returnFromFlow } from '@/reducers/flowReducer';
import { isComponentKey, isFlowKey } from '@/types/flow';

export default function FlowContainer() {
  const { currentFlow, currentFrame } = useSelector((state: any) => state.flow);
  const dispatch = useDispatch();

  if (!currentFlow || !currentFrame) {
    return <p>No flow available</p>;
  }

  // Handle navigation function that components can use
  const handleNavigate = (eventName: string) => {
    const frameConfig = currentFlow.frames[currentFrame];
    const target = frameConfig.on[eventName];

    if (!target) {
      console.error(`No target defined for event ${eventName} in frame ${currentFrame}`);
      console.log('Available events:', Object.keys(frameConfig.on));
      return;
    }

    // Handle special return keyword
    if (target === '__return__') {
      dispatch(returnFromFlow());
      return;
    }

    // Check if target is a flow or component
    if (isFlowKey(target)) {
      const targetFlow = flowRegistry[target];
      dispatch(navigateToFlow({ flow: targetFlow }));
    } else if (isComponentKey(target)) {
      dispatch(navigateToFrame(target));
    } else {
      console.error(`Unknown target type: ${target}`);
    }
  };

  // Handle returning from a subflow
  const handleReturn = () => {
    dispatch(returnFromFlow());
  };

  // Get the component to render
  const componentKey = currentFrame as keyof typeof componentRegistry;

  // Check if the component exists in the registry
  if (!(componentKey in componentRegistry)) {
    return (
      <div>
        <p>Component not found: {currentFrame}</p>
        <p>Available components: {Object.keys(componentRegistry).join(', ')}</p>
      </div>
    );
  }

  const Component = componentRegistry[componentKey];

  return (
    <>
      <Component
        onNavigate={handleNavigate}
        onReturn={handleReturn}
        flowConfig={currentFlow.frames[currentFrame]}
      />
    </>
  );
}
