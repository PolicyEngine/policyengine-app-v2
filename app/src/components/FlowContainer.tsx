import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { componentRegistry, flowRegistry } from '@/flows/registry';
import { navigateToFlow, navigateToFrame, returnFromFlow } from '@/reducers/flowReducer';
import { isComponentKey, isFlowKey, isNavigationObject } from '@/types/flow';

export default function FlowContainer() {
  const { currentFlow, currentFrame, flowStack, returnPath } = useSelector((state: any) => state.flow);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  if (!currentFlow || !currentFrame) {
    return <p>No flow available</p>;
  }

  const isInSubflow = flowStack.length > 0;
  const flowDepth = flowStack.length;
  const parentFlowContext = isInSubflow
    ? {
        parentFrame: flowStack[flowStack.length - 1].frame,
      }
    : undefined;

  // Handle navigation function that components can use
  const handleNavigate = (eventName: string) => {
    const frameConfig = currentFlow.frames[currentFrame];
    const target = frameConfig.on[eventName];

    if (!target) {
      console.error(
        `No target defined for event ${eventName} in frame ${currentFrame}; available events: ${Object.keys(frameConfig.on).join(', ')}`
      );
      return;
    }

    // Handle special return keyword
    if (target === '__return__') {
      dispatch(returnFromFlow());
      return;
    }

    // Handle navigation object with flow and returnTo
    if (isNavigationObject(target)) {
      const targetFlow = flowRegistry[target.flow];
      dispatch(
        navigateToFlow({
          flow: targetFlow,
          returnFrame: target.returnTo,
        })
      );
      return;
    }

    // Handle string targets (existing logic)
    if (typeof target === 'string') {
      // Check if target is a flow or component
      if (isFlowKey(target)) {
        const targetFlow = flowRegistry[target];
        dispatch(navigateToFlow({ flow: targetFlow }));
      } else if (isComponentKey(target)) {
        dispatch(navigateToFrame(target));
      } else {
        console.error(`Unknown target type: ${target}`);
      }
    }
  };

  // Handle returning from a subflow
  const handleReturn = () => {
    const isTopLevel = flowStack.length === 0;
    dispatch(returnFromFlow());
    if (isTopLevel && returnPath) {
      console.log(`[FlowContainer] Navigating to returnPath: ${returnPath}`);
      
      navigate(returnPath, { replace: true });
    }
    return;
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

  console.log(`Rendering component: ${componentKey} for frame: ${currentFrame}`);

  return (
    <>
      <Component
        onNavigate={handleNavigate}
        onReturn={handleReturn}
        flowConfig={currentFlow}
        isInSubflow={isInSubflow}
        flowDepth={flowDepth}
        parentFlowContext={parentFlowContext}
      />
    </>
  );
}
