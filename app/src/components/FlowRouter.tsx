import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
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

  // Construct absolute path from countryId and returnPath
  const absoluteReturnPath = `/${countryId}/${returnPath}`;

  // Initialize flow on mount with return path
  useEffect(() => {
    dispatch(setFlow({ flow, returnPath: absoluteReturnPath }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <FlowContainer />;
}
