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

  // Initialize flow on mount
  useEffect(() => {
    dispatch(setFlow(flow));
    flowInitialized.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FlowContainer />;
}
