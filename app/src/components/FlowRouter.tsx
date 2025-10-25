import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import FlowContainer from './FlowContainer';
import { clearFlow, setFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { Flow } from '@/types/flow';

interface FlowRouterProps {
  flow: Flow;
  returnPath: string; // Relative path (e.g., 'reports') - will be prefixed with /:countryId
}

export default function FlowRouter({ flow, returnPath }: FlowRouterProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { countryId } = useParams<{ countryId: string }>();
  const { currentFlow, flowStack } = useSelector((state: RootState) => state.flow);
  const flowInitialized = useRef(false);

  // Construct absolute path from countryId and returnPath
  const absoluteReturnPath = `/${countryId}/${returnPath}`;

  // Effect 1: Initialize flow on mount, clear on unmount
  useEffect(() => {
    dispatch(setFlow(flow));
    flowInitialized.current = true;

    return () => {
      dispatch(clearFlow());
      flowInitialized.current = false;
    };
    // Flow is static per route, dispatch is stable
    // Only run on mount/unmount to avoid cleanup race condition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect 2: Navigate back when top-level flow completes
  useEffect(() => {
    // Only navigate if:
    // - Flow was initialized (not initial render)
    // - Flow is now cleared (completion)
    // - Not in a subflow (flowStack empty)
    if (flowInitialized.current && !currentFlow && flowStack.length === 0) {
      navigate(absoluteReturnPath, { replace: true });
    }
  }, [currentFlow, flowStack, navigate, absoluteReturnPath]);

  return <FlowContainer />;
}
