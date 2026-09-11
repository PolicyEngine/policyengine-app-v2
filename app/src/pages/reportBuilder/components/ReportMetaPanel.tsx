/**
 * ReportMetaPanel - Segmented breadcrumb for report title and year
 *
 * Renders as three separate segments (icon, name, year) that flow
 * directly into TopBar's flex layout via display: contents.
 */

import React, { useLayoutEffect, useState } from 'react';
import { IconCheck, IconFileDescription, IconPencil } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@/components/ui';
import { colors, spacing, typography } from '@/designTokens';
import { getTaxYears } from '@/libs/metadataUtils';
import { FONT_SIZES } from '../constants';
import type { ReportBuilderState } from '../types';
import { changeReportYear, householdMatchesReportYear } from '../utils/changeReportYear';

const SEGMENT_HEIGHT = 38;

const segmentBase: React.CSSProperties = {
  height: SEGMENT_HEIGHT,
  borderRadius: spacing.radius.feature,
  background: colors.white,
  border: `1px solid ${colors.primary[200]}`,
  boxShadow: `0 2px 8px ${colors.shadow.light}`,
  display: 'flex',
  alignItems: 'center',
};

interface ReportMetaPanelProps {
  reportState: ReportBuilderState;
  setReportState: React.Dispatch<React.SetStateAction<ReportBuilderState>>;
  isReadOnly?: boolean;
}

export function ReportMetaPanel({ reportState, setReportState, isReadOnly }: ReportMetaPanelProps) {
  const yearOptions = useSelector(getTaxYears);
  const [yearError, setYearError] = useState<string | null>(null);
  const hasHousehold = reportState.simulations.some(
    (simulation) => simulation.population.household
  );
  const needsHouseholdYearCopy = reportState.simulations.some(
    ({ population }) =>
      population.household && !householdMatchesReportYear(population.household, reportState.year)
  );
  const handleYearChange = (year: string) => {
    try {
      const next = changeReportYear(reportState, year);
      setReportState(next);
      setYearError(null);
    } catch (error) {
      setYearError(
        error instanceof Error ? error.message : 'Unable to change the household input year.'
      );
    }
  };
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [inputWidth, setInputWidth] = useState<number | null>(null);
  const measureRef = React.useRef<HTMLSpanElement>(null);

  const handleLabelSubmit = () => {
    setReportState((prev) => ({ ...prev, label: labelInput || 'Untitled report' }));
    setIsEditingLabel(false);
  };

  const defaultReportLabel = 'Untitled report';

  useLayoutEffect(() => {
    if (measureRef.current && isEditingLabel) {
      const textToMeasure = labelInput || defaultReportLabel;
      measureRef.current.textContent = textToMeasure;
      setInputWidth(measureRef.current.offsetWidth);
    }
  }, [labelInput, isEditingLabel]);

  return (
    <div style={{ display: 'contents' }}>
      {/* Icon segment */}
      <div
        style={{
          width: SEGMENT_HEIGHT,
          height: SEGMENT_HEIGHT,
          borderRadius: spacing.radius.feature,
          background: `linear-gradient(135deg, ${colors.primary[50]} 0%, ${colors.primary[100]} 100%)`,
          border: `1px solid ${colors.primary[200]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconFileDescription size={20} color={colors.primary[600]} />
      </div>

      {/* Name segment */}
      <div
        style={{
          ...segmentBase,
          flex: 1,
          minWidth: 0,
          padding: `0 ${spacing.lg}`,
          gap: spacing.sm,
          cursor: isReadOnly ? 'default' : isEditingLabel ? 'text' : 'pointer',
          position: 'relative',
        }}
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!isReadOnly && !isEditingLabel) {
            setLabelInput(reportState.label || '');
            setIsEditingLabel(true);
          }
        }}
        onKeyDown={(e) => {
          if (!isReadOnly && !isEditingLabel && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setLabelInput(reportState.label || '');
            setIsEditingLabel(true);
          }
        }}
      >
        <Text
          c={colors.primary[500]}
          fw={600}
          style={{
            fontSize: FONT_SIZES.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          Name
        </Text>

        {isEditingLabel ? (
          <>
            <span
              ref={measureRef}
              style={{
                position: 'absolute',
                visibility: 'hidden',
                whiteSpace: 'pre',
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
                fontSize: FONT_SIZES.small,
              }}
            />
            <Input
              value={labelInput}
              onChange={(e) => setLabelInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelSubmit()}
              onBlur={handleLabelSubmit}
              placeholder={defaultReportLabel}
              autoFocus
              className="tw:border-none tw:bg-transparent tw:p-0 tw:h-auto tw:shadow-none tw:focus-visible:ring-0"
              style={{
                flex: 1,
                minWidth: 0,
                width: inputWidth ? inputWidth + 8 : 'auto',
                fontFamily: typography.fontFamily.primary,
                fontWeight: 600,
                fontSize: FONT_SIZES.small,
              }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleLabelSubmit();
              }}
              aria-label="Confirm report name"
              className="tw:text-teal-600"
              style={{ flexShrink: 0 }}
            >
              <IconCheck size={14} />
            </Button>
          </>
        ) : (
          <>
            <Text
              fw={600}
              style={{
                fontFamily: typography.fontFamily.primary,
                fontSize: FONT_SIZES.small,
                color: colors.gray[800],
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {reportState.label || defaultReportLabel}
            </Text>
            {!isReadOnly && (
              <IconPencil
                size={12}
                color={colors.gray[400]}
                style={{ flexShrink: 0, marginLeft: 'auto' }}
              />
            )}
          </>
        )}
      </div>

      {/* Year segment */}
      <div
        style={{
          ...segmentBase,
          padding: `0 ${spacing.md}`,
          gap: spacing.sm,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <Text
          c={colors.primary[500]}
          fw={600}
          style={{
            fontSize: FONT_SIZES.tiny,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
            pointerEvents: 'none',
          }}
        >
          Year
        </Text>
        <Select value={reportState.year} onValueChange={handleYearChange} disabled={isReadOnly}>
          <SelectTrigger
            aria-label="Report year"
            aria-describedby={hasHousehold && !isReadOnly ? 'household-year-help' : undefined}
            className="tw:border-none tw:bg-transparent tw:shadow-none tw:focus-visible:ring-0 tw:h-auto tw:p-0 tw:min-h-0"
            style={{
              fontFamily: typography.fontFamily.primary,
              fontSize: FONT_SIZES.small,
              fontWeight: 500,
              color: colors.gray[700],
              cursor: isReadOnly ? 'default' : 'pointer',
              width: isReadOnly ? 'auto' : 72,
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {yearOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {hasHousehold && !isReadOnly && (
        <Text
          id="household-year-help"
          size="sm"
          className="tw:basis-full tw:order-1 tw:text-muted-foreground"
        >
          Changing the year copies each household’s inputs to that year. Ages and monetary amounts
          stay the same; no aging or inflation adjustment is applied. New households are saved when
          you submit. Existing households and policy dates stay unchanged.
        </Text>
      )}
      {needsHouseholdYearCopy && !isReadOnly && (
        <div className="tw:basis-full tw:order-1">
          <Button variant="outline" onClick={() => handleYearChange(reportState.year)}>
            Use household inputs in {reportState.year}
          </Button>
        </div>
      )}
      {yearError && !isReadOnly && (
        <Text role="alert" size="sm" className="tw:basis-full tw:order-1">
          {yearError}
        </Text>
      )}
    </div>
  );
}
