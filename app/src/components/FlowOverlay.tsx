import { useDispatch, useSelector } from 'react-redux';
import { Box, CloseButton } from '@mantine/core';
import { clearFlow } from '@/reducers/flowReducer';
import { RootState } from '@/store';
import FlowContainer from './FlowContainer';

export default function FlowOverlay() {
  const { currentFlow } = useSelector((state: RootState) => state.flow);
  const dispatch = useDispatch();

  // Don't render anything if there's no active flow
  if (!currentFlow) {
    return null;
  }

  const handleClose = () => {
    dispatch(clearFlow());
  };

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 1000,
        overflow: 'auto',
      }}
    >
      <CloseButton
        size="lg"
        onClick={handleClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1001,
        }}
        aria-label="Close flow"
      />
      <FlowContainer />
    </Box>
  );
}
