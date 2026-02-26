/**
 * PolicyParameterSelectorView - View for selecting policy parameters
 * Duplicated from PolicyParameterSelectorFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { IconChevronRight, IconChevronUp } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import HeaderNavigation from '@/components/shared/HomeHeader';
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui';
import { spacing } from '@/designTokens';
import { colors } from '@/designTokens/colors';
import { useIsMobile } from '@/hooks/useChartDimensions';
import { useDisclosure } from '@/hooks/useDisclosure';
import { RootState } from '@/store';
import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { PolicyStateProps } from '@/types/pathwayState';
import { countPolicyModifications } from '@/utils/countParameterChanges';
import MainEmpty from '../../components/policyParameterSelector/MainEmpty';
import Menu from '../../components/policyParameterSelector/Menu';
import PolicyParameterSelectorMain from '../../components/PolicyParameterSelectorMain';

interface PolicyParameterSelectorViewProps {
  policy: PolicyStateProps;
  onPolicyUpdate: (updatedPolicy: PolicyStateProps) => void;
  onNext: () => void;
  onBack?: () => void;
}

export default function PolicyParameterSelectorView({
  policy,
  onPolicyUpdate,
  onNext,
  onBack,
}: PolicyParameterSelectorViewProps) {
  const [selectedLeafParam, setSelectedLeafParam] = useState<ParameterMetadata | null>(null);
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const isMobile = useIsMobile();

  // Get metadata from Redux state
  const { parameterTree, parameters, loading, error } = useSelector(
    (state: RootState) => state.metadata
  );

  // Count modifications from policy prop
  const modificationCount = countPolicyModifications(policy);

  const headerHeight = parseInt(spacing.appShell.header.height, 10);
  const navbarWidth = parseInt(spacing.appShell.navbar.width, 10);
  const footerHeight = parseInt(spacing.appShell.footer.height, 10);

  // Show error if metadata failed to load
  if (error) {
    return (
      <div>
        <p className="tw:text-red-600">Error loading parameters: {error}</p>
        <p>Please try refreshing the page.</p>
      </div>
    );
  }

  function handleMenuItemClick(paramLabel: string) {
    const param: ParameterMetadata | null = parameters[paramLabel] || null;
    if (param && param.type === 'parameter') {
      setSelectedLeafParam(param);
      closeMobile();
    }
  }

  return (
    <div className="tw:flex tw:flex-col tw:h-screen tw:overflow-hidden">
      {/* Header */}
      <div style={{ height: headerHeight }} className="tw:shrink-0">
        <HeaderNavigation />
      </div>

      <div className="tw:flex tw:flex-1 tw:min-h-0">
        {/* Navbar - desktop only */}
        {!isMobile && (
          <div
            className="tw:bg-gray-50 tw:p-md tw:overflow-auto tw:shrink-0"
            style={{ width: navbarWidth }}
          >
            {loading || !parameterTree ? (
              <div>Loading parameters...</div>
            ) : (
              <Menu setSelectedParamLabel={handleMenuItemClick} parameterTree={parameterTree} />
            )}
          </div>
        )}

        {/* Main content */}
        <div
          className="tw:flex-1 tw:min-w-0 tw:bg-gray-50 tw:p-md tw:overflow-auto"
          style={isMobile ? { paddingBottom: footerHeight } : undefined}
        >
          {loading || !parameterTree ? (
            <MainEmpty />
          ) : selectedLeafParam ? (
            <PolicyParameterSelectorMain
              key={selectedLeafParam.parameter}
              param={selectedLeafParam}
              policy={policy}
              onPolicyUpdate={onPolicyUpdate}
            />
          ) : (
            <MainEmpty />
          )}
        </div>
      </div>

      {/* Desktop footer - fixed at bottom like Mantine AppShell.Footer */}
      {!isMobile && (
        <div
          className="tw:p-md tw:border-t tw:border-gray-200 tw:bg-white tw:shrink-0"
          style={{ height: footerHeight }}
        >
          <div className="tw:flex tw:justify-between tw:items-center tw:flex-wrap tw:gap-sm">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
            {modificationCount > 0 && (
              <div className="tw:flex tw:items-center tw:gap-xs">
                <div
                  className="tw:rounded-full"
                  style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: colors.primary[600],
                  }}
                />
                <span className="tw:text-sm tw:text-gray-400">
                  {modificationCount} parameter modification
                  {modificationCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            <Button onClick={onNext}>
              Review my policy
              <IconChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Mobile bottom bar */}
      {isMobile && (
        <div
          className="tw:fixed tw:bottom-0 tw:left-0 tw:right-0 tw:p-md tw:bg-white tw:z-50"
          style={{ borderTop: `1px solid ${colors.border.light}` }}
        >
          <div className="tw:flex tw:justify-between tw:items-center tw:gap-sm tw:flex-nowrap">
            <Button variant="outline" size="sm" onClick={toggleMobile}>
              <IconChevronUp
                size={16}
                style={{
                  transform: mobileOpened ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease',
                }}
              />
              Parameters
              {modificationCount > 0 && (
                <span
                  className="tw:inline-flex tw:items-center tw:justify-center tw:rounded-full tw:text-white tw:ml-1.5"
                  style={{
                    width: '18px',
                    height: '18px',
                    backgroundColor: colors.primary[600],
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {modificationCount}
                </span>
              )}
            </Button>
            <div className="tw:flex tw:gap-sm tw:flex-nowrap">
              {onBack && (
                <Button variant="outline" size="sm" onClick={onBack}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={onNext}>
                Review
                <IconChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet for parameter tree */}
      {isMobile && (
        <Sheet open={mobileOpened} onOpenChange={(open) => !open && closeMobile()}>
          <SheetContent side="bottom" className="tw:h-[70vh]">
            <SheetHeader>
              <SheetTitle>Select parameters</SheetTitle>
            </SheetHeader>
            {loading || !parameterTree ? (
              <div>Loading parameters...</div>
            ) : (
              <Menu setSelectedParamLabel={handleMenuItemClick} parameterTree={parameterTree} />
            )}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
