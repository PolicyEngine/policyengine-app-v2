import {
  IconBasket,
  IconBolt,
  IconBriefcase,
  IconBuildingBank,
  IconBuildingCommunity,
  IconCar,
  IconChartLine,
  IconCoin,
  IconFlask,
  IconFolder,
  IconHeartbeat,
  IconHomeDollar,
  IconMap,
  IconReceiptTax,
  IconSchool,
  IconSettings,
  IconShieldCheck,
  IconShieldLock,
  IconStethoscope,
  IconUsers,
  IconWifi,
  IconWorld,
} from '@tabler/icons-react';

type TablerIcon = typeof IconFolder;

/** Top-level folders by their segment under `gov.`, for the landing cards. */
const TOP_LEVEL_ICONS: Record<string, TablerIcon> = {
  // US
  aca: IconStethoscope,
  bls: IconChartLine,
  contrib: IconFlask,
  dhs: IconShieldLock,
  dol: IconBriefcase,
  ed: IconSchool,
  fcc: IconWifi,
  hhs: IconHeartbeat,
  hud: IconHomeDollar,
  irs: IconReceiptTax,
  local: IconBuildingCommunity,
  simulation: IconSettings,
  ssa: IconShieldCheck,
  states: IconMap,
  territories: IconWorld,
  usda: IconBasket,
  // UK
  bank_of_england: IconCoin,
  dcms: IconUsers,
  dfe: IconSchool,
  dft: IconCar,
  dhsc: IconHeartbeat,
  dwp: IconUsers,
  dynamic: IconSettings,
  economic_assumptions: IconChartLine,
  hmrc: IconReceiptTax,
  indices: IconChartLine,
  local_authorities: IconBuildingCommunity,
  ofgem: IconBolt,
  treasury: IconBuildingBank,
};

export function folderIcon(path: string): TablerIcon {
  const segments = path.split('.');
  return (segments.length === 2 && TOP_LEVEL_ICONS[segments[1]]) || IconFolder;
}
