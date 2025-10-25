import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FlowContainer from './FlowContainer';
import { clearFlow, setFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import { Flow } from '@/types/flow';

interface FlowRouterProps {
  flow: Flow;
  returnPath: string;
}

export default function FlowRouter({ flow, returnPath }: FlowRouterProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentFlow, flowStack } = useSelector((state: RootState) => state.flow);
  const flowInitialized = useRef(false);

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
      navigate(returnPath, { replace: true });
    }
  }, [currentFlow, flowStack, navigate, returnPath]);

  return <FlowContainer />;
}
