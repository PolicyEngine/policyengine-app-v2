import { Separator } from '@/components/ui';
import NestedMenu from '@/components/common/NestedMenu';
import { ParameterTreeNode } from '@/types/metadata';

interface PolicyParameterSelectorMenuProps {
  setSelectedParamLabel: (param: string) => void;
  parameterTree: ParameterTreeNode;
}

export default function PolicyParameterSelectorMenu({
  setSelectedParamLabel,
  parameterTree,
}: PolicyParameterSelectorMenuProps) {
  // Convert parameter tree to format expected by NestedMenu
  const menuOptions = parameterTree.children || [];

  return (
    <div className="tw:flex tw:flex-col tw:h-full">
      <div>
        <SelectorMenuHeader />
        <Separator className="tw:my-xs" />
      </div>

      <div className="tw:flex-1 tw:overflow-auto">
        <NestedMenu menuOptions={menuOptions} onItemClick={setSelectedParamLabel} />
      </div>
    </div>
  );
}

function SelectorMenuHeader() {
  return (
    <div>
      <p className="tw:font-bold">Select parameters</p>
      <p>Make changes and add provisions to your policy</p>
    </div>
  );
}
