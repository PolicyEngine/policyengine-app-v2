import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import FlowContainer from './FlowContainer';
import { setFlow } from '@/reducers/flowReducer';
import { Flow } from '@/types/flow';

interface FlowRouterProps {
  flow: Flow;
  returnPath: string; // Relative path (e.g., 'reports') - will be prefixed with /:countryId
}

export default function FlowRouter({ flow, returnPath }: FlowRouterProps) {
  const dispatch = useDispatch();
  const { countryId } = useParams<{ countryId: string }>();
  const currentFlow = useSelector((state: any) => state.flow.currentFlow);

  // Construct absolute path from countryId and returnPath
  const absoluteReturnPath = `/${countryId}/${returnPath}`;

  // Initialize ONLY if there's no current flow set, to avoid resetting mid-flow;
  // relevant when a component above (Layout) causes re-render.
  useEffect(() => {
    console.log('[FlowRouter] Effect running - currentFlow:', currentFlow);
    console.log('[FlowRouter] Expected flow:', flow);
    if (!currentFlow) {
      console.log('[FlowRouter] No current flow, initializing with returnPath:', absoluteReturnPath);
      dispatch(setFlow({ flow, returnPath: absoluteReturnPath }));
    } else {
      console.log('[FlowRouter] Flow already exists, skipping setFlow');
    }
    // Initialize flow once on mount, hence empty deps array
    // This is not an anti-pattern; see 
    // https://react.dev/reference/react/useEffect#specifying-reactive-dependencies,
    // where React gives example of initializing on mount without dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FlowContainer />;
}
