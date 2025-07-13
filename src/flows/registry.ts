import PolicyCreationView from '@/policyFlow/PolicyCreationView';
import PolicyTestView from '@/TEST_TO_DELETE/policyTestView';
import TestCompleteView from '@/TEST_TO_DELETE/testCompleteFlowView';
import TestView2 from '@/TEST_TO_DELETE/testView2';
import TestView3 from '@/TEST_TO_DELETE/testView3';
import { PolicyCreationFlow, TestCompleteFlow, TestFlow } from './policyCreationFlow';

export const componentRegistry = {
  PolicyCreationView: PolicyCreationView,
  PolicyTestView: PolicyTestView,
  TestView2: TestView2,
  TestView3: TestView3,
  TestCompleteView: TestCompleteView,
} as const;

export const flowRegistry = {
  PolicyCreationFlow: PolicyCreationFlow,
  TestFlow: TestFlow,
  TestCompleteFlow: TestCompleteFlow,
} as const;

export type ComponentKey = keyof typeof componentRegistry;
export type FlowKey = keyof typeof flowRegistry;
