import { countryIds } from '@/libs/countries';
import { MetadataRegionEntry } from '@/types/metadata';
import { ScopeType, UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';

// Re-export types for convenience
export type { MetadataRegionEntry };
export { US_REGION_TYPES, UK_REGION_TYPES };
export type { ScopeType };

/**
 * Region option for display in dropdowns
 */
export interface RegionOption {
  value: string;
  label: string;
  type:
    | (typeof US_REGION_TYPES)[keyof typeof US_REGION_TYPES]
    | (typeof UK_REGION_TYPES)[keyof typeof UK_REGION_TYPES];
  // Congressional district specific fields
  stateAbbreviation?: string;
  stateName?: string;
}

/**
 * Place option for US Census places (cities, towns, CDPs)
 */
export interface PlaceOption {
  placeFips: string;
  name: string;
  stateAbbrev: string;
  stateName: string;
}

// Source: US Census Bureau Population Estimates 2023
// Places with population > 100,000
// Total: 333 places
export const US_PLACES_OVER_100K: PlaceOption[] = [
  { placeFips: '07000', name: 'Birmingham city', stateAbbrev: 'AL', stateName: 'Alabama' },
  { placeFips: '37000', name: 'Huntsville city', stateAbbrev: 'AL', stateName: 'Alabama' },
  { placeFips: '50000', name: 'Mobile city', stateAbbrev: 'AL', stateName: 'Alabama' },
  { placeFips: '51000', name: 'Montgomery city', stateAbbrev: 'AL', stateName: 'Alabama' },
  { placeFips: '77256', name: 'Tuscaloosa city', stateAbbrev: 'AL', stateName: 'Alabama' },
  { placeFips: '03000', name: 'Anchorage municipality', stateAbbrev: 'AK', stateName: 'Alaska' },
  { placeFips: '07940', name: 'Buckeye city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '12000', name: 'Chandler city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '27400', name: 'Gilbert town', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '27820', name: 'Glendale city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '28380', name: 'Goodyear city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '46000', name: 'Mesa city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '54050', name: 'Peoria city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '55000', name: 'Phoenix city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '65000', name: 'Scottsdale city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '71510', name: 'Surprise city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '73000', name: 'Tempe city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '77000', name: 'Tucson city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '85540', name: 'Yuma city', stateAbbrev: 'AZ', stateName: 'Arizona' },
  { placeFips: '23290', name: 'Fayetteville city', stateAbbrev: 'AR', stateName: 'Arkansas' },
  { placeFips: '41000', name: 'Little Rock city', stateAbbrev: 'AR', stateName: 'Arkansas' },
  { placeFips: '02000', name: 'Anaheim city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '02252', name: 'Antioch city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '03526', name: 'Bakersfield city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '06000', name: 'Berkeley city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '08954', name: 'Burbank city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '11194', name: 'Carlsbad city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '13014', name: 'Chico city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '13392', name: 'Chula Vista city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '14218', name: 'Clovis city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '16000', name: 'Concord city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '16350', name: 'Corona city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '16532', name: 'Costa Mesa city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '19766', name: 'Downey city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '21712', name: 'El Cajon city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '22230', name: 'El Monte city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '22020', name: 'Elk Grove city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '22804', name: 'Escondido city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '23182', name: 'Fairfield city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '24680', name: 'Fontana city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '26000', name: 'Fremont city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '27000', name: 'Fresno city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '28000', name: 'Fullerton city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '29000', name: 'Garden Grove city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '30000', name: 'Glendale city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '33000', name: 'Hayward city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '33434', name: 'Hesperia city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '36000', name: 'Huntington Beach city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '36546', name: 'Inglewood city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '36770', name: 'Irvine city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '37692', name: 'Jurupa Valley city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '40130', name: 'Lancaster city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '43000', name: 'Long Beach city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '44000', name: 'Los Angeles city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '46842', name: 'Menifee city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '48354', name: 'Modesto city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '49270', name: 'Moreno Valley city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '50076', name: 'Murrieta city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '53000', name: 'Oakland city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '53322', name: 'Oceanside city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '53896', name: 'Ontario city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '53980', name: 'Orange city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '54652', name: 'Oxnard city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '55156', name: 'Palmdale city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '56000', name: 'Pasadena city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '58072', name: 'Pomona city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '59451', name: 'Rancho Cucamonga city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '60466', name: 'Rialto city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '60620', name: 'Richmond city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '62000', name: 'Riverside city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '62938', name: 'Roseville city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '64000', name: 'Sacramento city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '64224', name: 'Salinas city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '65000', name: 'San Bernardino city', stateAbbrev: 'CA', stateName: 'California' },
  {
    placeFips: '65042',
    name: 'San Buenaventura (Ventura) city',
    stateAbbrev: 'CA',
    stateName: 'California',
  },
  { placeFips: '66000', name: 'San Diego city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '67000', name: 'San Francisco city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '68000', name: 'San Jose city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '68252', name: 'San Mateo city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '69000', name: 'Santa Ana city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '69084', name: 'Santa Clara city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '69088', name: 'Santa Clarita city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '69196', name: 'Santa Maria city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '70098', name: 'Santa Rosa city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '72016', name: 'Simi Valley city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '75000', name: 'Stockton city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '77000', name: 'Sunnyvale city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '78120', name: 'Temecula city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '78582', name: 'Thousand Oaks city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '80000', name: 'Torrance city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '81554', name: 'Vacaville city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '81666', name: 'Vallejo city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '82590', name: 'Victorville city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '82954', name: 'Visalia city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '84200', name: 'West Covina city', stateAbbrev: 'CA', stateName: 'California' },
  { placeFips: '03455', name: 'Arvada city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '04000', name: 'Aurora city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '07850', name: 'Boulder city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '12815', name: 'Centennial city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '16000', name: 'Colorado Springs city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '20000', name: 'Denver city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '27425', name: 'Fort Collins city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '32155', name: 'Greeley city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '43000', name: 'Lakewood city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '62000', name: 'Pueblo city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '77290', name: 'Thornton city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '83835', name: 'Westminster city', stateAbbrev: 'CO', stateName: 'Colorado' },
  { placeFips: '08000', name: 'Bridgeport city', stateAbbrev: 'CT', stateName: 'Connecticut' },
  { placeFips: '37000', name: 'Hartford city', stateAbbrev: 'CT', stateName: 'Connecticut' },
  { placeFips: '52000', name: 'New Haven city', stateAbbrev: 'CT', stateName: 'Connecticut' },
  { placeFips: '73000', name: 'Stamford city', stateAbbrev: 'CT', stateName: 'Connecticut' },
  { placeFips: '80000', name: 'Waterbury city', stateAbbrev: 'CT', stateName: 'Connecticut' },
  {
    placeFips: '50000',
    name: 'Washington city',
    stateAbbrev: 'DC',
    stateName: 'District of Columbia',
  },
  { placeFips: '10275', name: 'Cape Coral city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '12875', name: 'Clearwater city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '14400', name: 'Coral Springs city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '16475', name: 'Davie town', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '24000', name: 'Fort Lauderdale city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '25175', name: 'Gainesville city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '30000', name: 'Hialeah city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '32000', name: 'Hollywood city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '35000', name: 'Jacksonville city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '38250', name: 'Lakeland city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '45060', name: 'Miami Gardens city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '45000', name: 'Miami city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '45975', name: 'Miramar city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '53000', name: 'Orlando city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '54000', name: 'Palm Bay city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '54200', name: 'Palm Coast city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '55775', name: 'Pembroke Pines city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '58050', name: 'Pompano Beach city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '58715', name: 'Port St. Lucie city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '63000', name: 'St. Petersburg city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '70600', name: 'Tallahassee city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '71000', name: 'Tampa city', stateAbbrev: 'FL', stateName: 'Florida' },
  { placeFips: '76600', name: 'West Palm Beach city', stateAbbrev: 'FL', stateName: 'Florida' },
  {
    placeFips: '03440',
    name: 'Athens-Clarke County unified government (balance)',
    stateAbbrev: 'GA',
    stateName: 'Georgia',
  },
  { placeFips: '04000', name: 'Atlanta city', stateAbbrev: 'GA', stateName: 'Georgia' },
  {
    placeFips: '04204',
    name: 'Augusta-Richmond County consolidated government (balance)',
    stateAbbrev: 'GA',
    stateName: 'Georgia',
  },
  { placeFips: '19000', name: 'Columbus city', stateAbbrev: 'GA', stateName: 'Georgia' },
  { placeFips: '49008', name: 'Macon-Bibb County', stateAbbrev: 'GA', stateName: 'Georgia' },
  { placeFips: '68516', name: 'Sandy Springs city', stateAbbrev: 'GA', stateName: 'Georgia' },
  { placeFips: '69000', name: 'Savannah city', stateAbbrev: 'GA', stateName: 'Georgia' },
  { placeFips: '72122', name: 'South Fulton city', stateAbbrev: 'GA', stateName: 'Georgia' },
  { placeFips: '71550', name: 'Urban Honolulu CDP', stateAbbrev: 'HI', stateName: 'Hawaii' },
  { placeFips: '08830', name: 'Boise City city', stateAbbrev: 'ID', stateName: 'Idaho' },
  { placeFips: '52120', name: 'Meridian city', stateAbbrev: 'ID', stateName: 'Idaho' },
  { placeFips: '56260', name: 'Nampa city', stateAbbrev: 'ID', stateName: 'Idaho' },
  { placeFips: '03012', name: 'Aurora city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '14000', name: 'Chicago city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '23074', name: 'Elgin city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '38570', name: 'Joliet city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '51622', name: 'Naperville city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '59000', name: 'Peoria city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '65000', name: 'Rockford city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '72000', name: 'Springfield city', stateAbbrev: 'IL', stateName: 'Illinois' },
  { placeFips: '10342', name: 'Carmel city', stateAbbrev: 'IN', stateName: 'Indiana' },
  { placeFips: '22000', name: 'Evansville city', stateAbbrev: 'IN', stateName: 'Indiana' },
  { placeFips: '23278', name: 'Fishers city', stateAbbrev: 'IN', stateName: 'Indiana' },
  { placeFips: '25000', name: 'Fort Wayne city', stateAbbrev: 'IN', stateName: 'Indiana' },
  {
    placeFips: '36003',
    name: 'Indianapolis city (balance)',
    stateAbbrev: 'IN',
    stateName: 'Indiana',
  },
  { placeFips: '71000', name: 'South Bend city', stateAbbrev: 'IN', stateName: 'Indiana' },
  { placeFips: '12000', name: 'Cedar Rapids city', stateAbbrev: 'IA', stateName: 'Iowa' },
  { placeFips: '19000', name: 'Davenport city', stateAbbrev: 'IA', stateName: 'Iowa' },
  { placeFips: '21000', name: 'Des Moines city', stateAbbrev: 'IA', stateName: 'Iowa' },
  { placeFips: '36000', name: 'Kansas City city', stateAbbrev: 'KS', stateName: 'Kansas' },
  { placeFips: '52575', name: 'Olathe city', stateAbbrev: 'KS', stateName: 'Kansas' },
  { placeFips: '53775', name: 'Overland Park city', stateAbbrev: 'KS', stateName: 'Kansas' },
  { placeFips: '71000', name: 'Topeka city', stateAbbrev: 'KS', stateName: 'Kansas' },
  { placeFips: '79000', name: 'Wichita city', stateAbbrev: 'KS', stateName: 'Kansas' },
  {
    placeFips: '46027',
    name: 'Lexington-Fayette urban county',
    stateAbbrev: 'KY',
    stateName: 'Kentucky',
  },
  {
    placeFips: '48006',
    name: 'Louisville/Jefferson County metro government (balance)',
    stateAbbrev: 'KY',
    stateName: 'Kentucky',
  },
  { placeFips: '05000', name: 'Baton Rouge city', stateAbbrev: 'LA', stateName: 'Louisiana' },
  { placeFips: '40735', name: 'Lafayette city', stateAbbrev: 'LA', stateName: 'Louisiana' },
  { placeFips: '55000', name: 'New Orleans city', stateAbbrev: 'LA', stateName: 'Louisiana' },
  { placeFips: '70000', name: 'Shreveport city', stateAbbrev: 'LA', stateName: 'Louisiana' },
  { placeFips: '04000', name: 'Baltimore city', stateAbbrev: 'MD', stateName: 'Maryland' },
  { placeFips: '07000', name: 'Boston city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '09000', name: 'Brockton city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '11000', name: 'Cambridge city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '37000', name: 'Lowell city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '37490', name: 'Lynn city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '45000', name: 'New Bedford city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '55745', name: 'Quincy city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '67000', name: 'Springfield city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '82000', name: 'Worcester city', stateAbbrev: 'MA', stateName: 'Massachusetts' },
  { placeFips: '03000', name: 'Ann Arbor city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '21000', name: 'Dearborn city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '22000', name: 'Detroit city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '34000', name: 'Grand Rapids city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '46000', name: 'Lansing city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '76460', name: 'Sterling Heights city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '84000', name: 'Warren city', stateAbbrev: 'MI', stateName: 'Michigan' },
  { placeFips: '43000', name: 'Minneapolis city', stateAbbrev: 'MN', stateName: 'Minnesota' },
  { placeFips: '54880', name: 'Rochester city', stateAbbrev: 'MN', stateName: 'Minnesota' },
  { placeFips: '58000', name: 'St. Paul city', stateAbbrev: 'MN', stateName: 'Minnesota' },
  { placeFips: '36000', name: 'Jackson city', stateAbbrev: 'MS', stateName: 'Mississippi' },
  { placeFips: '15670', name: 'Columbia city', stateAbbrev: 'MO', stateName: 'Missouri' },
  { placeFips: '35000', name: 'Independence city', stateAbbrev: 'MO', stateName: 'Missouri' },
  { placeFips: '38000', name: 'Kansas City city', stateAbbrev: 'MO', stateName: 'Missouri' },
  { placeFips: '41348', name: "Lee's Summit city", stateAbbrev: 'MO', stateName: 'Missouri' },
  { placeFips: '70000', name: 'Springfield city', stateAbbrev: 'MO', stateName: 'Missouri' },
  { placeFips: '65000', name: 'St. Louis city', stateAbbrev: 'MO', stateName: 'Missouri' },
  { placeFips: '06550', name: 'Billings city', stateAbbrev: 'MT', stateName: 'Montana' },
  { placeFips: '28000', name: 'Lincoln city', stateAbbrev: 'NE', stateName: 'Nebraska' },
  { placeFips: '37000', name: 'Omaha city', stateAbbrev: 'NE', stateName: 'Nebraska' },
  { placeFips: '31900', name: 'Henderson city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '40000', name: 'Las Vegas city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '51800', name: 'North Las Vegas city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '60600', name: 'Reno city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '68400', name: 'Sparks city', stateAbbrev: 'NV', stateName: 'Nevada' },
  { placeFips: '45140', name: 'Manchester city', stateAbbrev: 'NH', stateName: 'New Hampshire' },
  { placeFips: '21000', name: 'Elizabeth city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '36000', name: 'Jersey City city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '51000', name: 'Newark city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '57000', name: 'Paterson city', stateAbbrev: 'NJ', stateName: 'New Jersey' },
  { placeFips: '02000', name: 'Albuquerque city', stateAbbrev: 'NM', stateName: 'New Mexico' },
  { placeFips: '39380', name: 'Las Cruces city', stateAbbrev: 'NM', stateName: 'New Mexico' },
  { placeFips: '63460', name: 'Rio Rancho city', stateAbbrev: 'NM', stateName: 'New Mexico' },
  { placeFips: '01000', name: 'Albany city', stateAbbrev: 'NY', stateName: 'New York' },
  { placeFips: '11000', name: 'Buffalo city', stateAbbrev: 'NY', stateName: 'New York' },
  { placeFips: '51000', name: 'New York city', stateAbbrev: 'NY', stateName: 'New York' },
  { placeFips: '63000', name: 'Rochester city', stateAbbrev: 'NY', stateName: 'New York' },
  { placeFips: '73000', name: 'Syracuse city', stateAbbrev: 'NY', stateName: 'New York' },
  { placeFips: '84000', name: 'Yonkers city', stateAbbrev: 'NY', stateName: 'New York' },
  { placeFips: '10740', name: 'Cary town', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '12000', name: 'Charlotte city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '14100', name: 'Concord city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '19000', name: 'Durham city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '22920', name: 'Fayetteville city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '28000', name: 'Greensboro city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '31400', name: 'High Point city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '55000', name: 'Raleigh city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  { placeFips: '74440', name: 'Wilmington city', stateAbbrev: 'NC', stateName: 'North Carolina' },
  {
    placeFips: '75000',
    name: 'Winston-Salem city',
    stateAbbrev: 'NC',
    stateName: 'North Carolina',
  },
  { placeFips: '25700', name: 'Fargo city', stateAbbrev: 'ND', stateName: 'North Dakota' },
  { placeFips: '01000', name: 'Akron city', stateAbbrev: 'OH', stateName: 'Ohio' },
  { placeFips: '15000', name: 'Cincinnati city', stateAbbrev: 'OH', stateName: 'Ohio' },
  { placeFips: '16000', name: 'Cleveland city', stateAbbrev: 'OH', stateName: 'Ohio' },
  { placeFips: '18000', name: 'Columbus city', stateAbbrev: 'OH', stateName: 'Ohio' },
  { placeFips: '21000', name: 'Dayton city', stateAbbrev: 'OH', stateName: 'Ohio' },
  { placeFips: '77000', name: 'Toledo city', stateAbbrev: 'OH', stateName: 'Ohio' },
  { placeFips: '09050', name: 'Broken Arrow city', stateAbbrev: 'OK', stateName: 'Oklahoma' },
  { placeFips: '52500', name: 'Norman city', stateAbbrev: 'OK', stateName: 'Oklahoma' },
  { placeFips: '55000', name: 'Oklahoma City city', stateAbbrev: 'OK', stateName: 'Oklahoma' },
  { placeFips: '75000', name: 'Tulsa city', stateAbbrev: 'OK', stateName: 'Oklahoma' },
  { placeFips: '05800', name: 'Bend city', stateAbbrev: 'OR', stateName: 'Oregon' },
  { placeFips: '23850', name: 'Eugene city', stateAbbrev: 'OR', stateName: 'Oregon' },
  { placeFips: '31250', name: 'Gresham city', stateAbbrev: 'OR', stateName: 'Oregon' },
  { placeFips: '34100', name: 'Hillsboro city', stateAbbrev: 'OR', stateName: 'Oregon' },
  { placeFips: '59000', name: 'Portland city', stateAbbrev: 'OR', stateName: 'Oregon' },
  { placeFips: '64900', name: 'Salem city', stateAbbrev: 'OR', stateName: 'Oregon' },
  { placeFips: '02000', name: 'Allentown city', stateAbbrev: 'PA', stateName: 'Pennsylvania' },
  { placeFips: '60000', name: 'Philadelphia city', stateAbbrev: 'PA', stateName: 'Pennsylvania' },
  { placeFips: '61000', name: 'Pittsburgh city', stateAbbrev: 'PA', stateName: 'Pennsylvania' },
  { placeFips: '59000', name: 'Providence city', stateAbbrev: 'RI', stateName: 'Rhode Island' },
  { placeFips: '13330', name: 'Charleston city', stateAbbrev: 'SC', stateName: 'South Carolina' },
  { placeFips: '16000', name: 'Columbia city', stateAbbrev: 'SC', stateName: 'South Carolina' },
  {
    placeFips: '50875',
    name: 'North Charleston city',
    stateAbbrev: 'SC',
    stateName: 'South Carolina',
  },
  { placeFips: '59020', name: 'Sioux Falls city', stateAbbrev: 'SD', stateName: 'South Dakota' },
  { placeFips: '14000', name: 'Chattanooga city', stateAbbrev: 'TN', stateName: 'Tennessee' },
  { placeFips: '15160', name: 'Clarksville city', stateAbbrev: 'TN', stateName: 'Tennessee' },
  { placeFips: '40000', name: 'Knoxville city', stateAbbrev: 'TN', stateName: 'Tennessee' },
  { placeFips: '48000', name: 'Memphis city', stateAbbrev: 'TN', stateName: 'Tennessee' },
  { placeFips: '51560', name: 'Murfreesboro city', stateAbbrev: 'TN', stateName: 'Tennessee' },
  {
    placeFips: '52006',
    name: 'Nashville-Davidson metropolitan government (balance)',
    stateAbbrev: 'TN',
    stateName: 'Tennessee',
  },
  { placeFips: '01000', name: 'Abilene city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '01924', name: 'Allen city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '03000', name: 'Amarillo city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '04000', name: 'Arlington city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '05000', name: 'Austin city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '07000', name: 'Beaumont city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '10768', name: 'Brownsville city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '13024', name: 'Carrollton city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '15976', name: 'College Station city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '16432', name: 'Conroe city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '17000', name: 'Corpus Christi city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '19000', name: 'Dallas city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '19972', name: 'Denton city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '22660', name: 'Edinburg city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '24000', name: 'El Paso city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '27000', name: 'Fort Worth city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '27684', name: 'Frisco city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '29000', name: 'Garland city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '30464', name: 'Grand Prairie city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '35000', name: 'Houston city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '37000', name: 'Irving city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '39148', name: 'Killeen city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '41464', name: 'Laredo city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '41980', name: 'League City city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '42508', name: 'Lewisville city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '45000', name: 'Lubbock city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '45384', name: 'McAllen city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '45744', name: 'McKinney city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '47892', name: 'Mesquite city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '48072', name: 'Midland city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '50820', name: 'New Braunfels city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '53388', name: 'Odessa city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '56000', name: 'Pasadena city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '56348', name: 'Pearland city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '58016', name: 'Plano city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '61796', name: 'Richardson city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '63500', name: 'Round Rock city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '65000', name: 'San Antonio city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '70808', name: 'Sugar Land city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '74144', name: 'Tyler city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '76000', name: 'Waco city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '79000', name: 'Wichita Falls city', stateAbbrev: 'TX', stateName: 'Texas' },
  { placeFips: '62470', name: 'Provo city', stateAbbrev: 'UT', stateName: 'Utah' },
  { placeFips: '67000', name: 'Salt Lake City city', stateAbbrev: 'UT', stateName: 'Utah' },
  { placeFips: '65330', name: 'St. George city', stateAbbrev: 'UT', stateName: 'Utah' },
  { placeFips: '82950', name: 'West Jordan city', stateAbbrev: 'UT', stateName: 'Utah' },
  { placeFips: '83470', name: 'West Valley City city', stateAbbrev: 'UT', stateName: 'Utah' },
  { placeFips: '01000', name: 'Alexandria city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '16000', name: 'Chesapeake city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '35000', name: 'Hampton city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '56000', name: 'Newport News city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '57000', name: 'Norfolk city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '67000', name: 'Richmond city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '76432', name: 'Suffolk city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '82000', name: 'Virginia Beach city', stateAbbrev: 'VA', stateName: 'Virginia' },
  { placeFips: '05210', name: 'Bellevue city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '22640', name: 'Everett city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '35415', name: 'Kent city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '57745', name: 'Renton city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '63000', name: 'Seattle city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '67167', name: 'Spokane Valley city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '67000', name: 'Spokane city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '70000', name: 'Tacoma city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '74060', name: 'Vancouver city', stateAbbrev: 'WA', stateName: 'Washington' },
  { placeFips: '31000', name: 'Green Bay city', stateAbbrev: 'WI', stateName: 'Wisconsin' },
  { placeFips: '48000', name: 'Madison city', stateAbbrev: 'WI', stateName: 'Wisconsin' },
  { placeFips: '53000', name: 'Milwaukee city', stateAbbrev: 'WI', stateName: 'Wisconsin' },
];

/**
 * Get unique state names that have places with 100k+ population
 */
export function getPlaceStateNames(): { value: string; label: string }[] {
  const names = new Set(US_PLACES_OVER_100K.map((p) => p.stateName));
  return Array.from(names)
    .sort()
    .map((name) => ({ value: name, label: name }));
}

/**
 * Filter places by state name
 */
export function filterPlacesByState(stateName: string): PlaceOption[] {
  if (!stateName) {
    return [];
  }
  return US_PLACES_OVER_100K.filter((p) => p.stateName === stateName);
}

/**
 * Convert a PlaceOption to a region string for the API
 * Format: "place/{STATE_ABBREV}-{PLACE_FIPS}"
 * Example: "place/NJ-57000"
 */
export function placeToRegionString(place: PlaceOption): string {
  return `place/${place.stateAbbrev}-${place.placeFips}`;
}

/**
 * Parse a place region string into state abbreviation and place FIPS
 * Format: "place/{STATE_ABBREV}-{PLACE_FIPS}"
 * Returns null if not a valid place region string
 */
export function parsePlaceRegionString(
  regionString: string
): { stateAbbrev: string; placeFips: string } | null {
  if (!regionString.startsWith('place/')) {
    return null;
  }
  const parts = regionString.replace('place/', '').split('-');
  if (parts.length !== 2) {
    return null;
  }
  return { stateAbbrev: parts[0], placeFips: parts[1] };
}

/**
 * Find a PlaceOption from a region string
 */
export function findPlaceFromRegionString(regionString: string): PlaceOption | undefined {
  const parsed = parsePlaceRegionString(regionString);
  if (!parsed) {
    return undefined;
  }
  return US_PLACES_OVER_100K.find(
    (p) => p.stateAbbrev === parsed.stateAbbrev && p.placeFips === parsed.placeFips
  );
}

/**
 * Get US states from metadata (filters by type)
 */
export function getUSStates(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === US_REGION_TYPES.STATE)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
    }));
}

/**
 * Get US congressional districts from metadata (filters by type)
 * Districts include state_abbreviation and state_name from the API
 */
export function getUSCongressionalDistricts(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === US_REGION_TYPES.CONGRESSIONAL_DISTRICT)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
      stateAbbreviation: r.state_abbreviation,
      stateName: r.state_name,
    }));
}

/**
 * Filter congressional districts by state name
 * @param districts - All district options (must include stateName from API)
 * @param stateName - Full state name (e.g., "California")
 * @returns Districts belonging to the specified state
 */
export function filterDistrictsByState(
  districts: RegionOption[],
  stateName: string
): RegionOption[] {
  if (!stateName) {
    return [];
  }
  return districts.filter((d) => d.stateName === stateName);
}

/**
 * Get the state name from a district option
 * @param districtValue - District value (e.g., "congressional_district/CA-01")
 * @param districts - All district options with state info
 * @returns State name or empty string if not found
 */
export function getStateNameFromDistrict(districtValue: string, districts: RegionOption[]): string {
  const district = districts.find((d) => d.value === districtValue);
  return district?.stateName || '';
}

/**
 * Format district options for display in a dropdown
 * - Single-district states show "At-large"
 * - Multi-district states show just the district number (e.g., "1st", "2nd")
 * @param districts - Districts filtered by state
 * @returns Formatted district options
 */
export function formatDistrictOptionsForDisplay(districts: RegionOption[]): RegionOption[] {
  if (districts.length === 1) {
    return districts.map((d) => ({ ...d, label: 'At-large' }));
  }
  return districts.map((d) => {
    const match = d.label.match(/(\d+(?:st|nd|rd|th)?)/i);
    return { ...d, label: match ? match[1] : d.label };
  });
}

/**
 * Get UK countries from metadata (filters by type)
 */
export function getUKCountries(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === UK_REGION_TYPES.COUNTRY)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
    }));
}

/**
 * Get UK constituencies from metadata (filters by type)
 */
export function getUKConstituencies(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === UK_REGION_TYPES.CONSTITUENCY)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
    }));
}

/**
 * Get UK local authorities from metadata (filters by type)
 */
export function getUKLocalAuthorities(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === UK_REGION_TYPES.LOCAL_AUTHORITY)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
    }));
}

/**
 * Extract display value from a region identifier
 * Strips "constituency/" or "country/" prefix for UK regions for display purposes
 * Returns value as-is for US regions
 *
 * @param fullValue - The full region value (e.g., "constituency/Sheffield Central", "ca")
 * @returns The display value (e.g., "Sheffield Central", "ca")
 */
export function extractRegionDisplayValue(fullValue: string): string {
  if (fullValue.includes('/')) {
    return fullValue.split('/').pop() || fullValue;
  }
  return fullValue;
}

/**
 * Create a Geography object from scope selection
 * @param scope - The selected scope type
 * @param countryId - The current country ID
 * @param selectedRegion - The selected region value (if any)
 * @returns Geography object or null if household scope
 */
export function createGeographyFromScope(
  scope: ScopeType,
  countryId: (typeof countryIds)[number],
  selectedRegion?: string
): {
  id: string;
  countryId: (typeof countryIds)[number];
  scope: 'national' | 'subnational';
  geographyId: string;
} | null {
  // Household scope doesn't create geography
  if (scope === 'household') {
    return null;
  }

  // National scope uses country ID
  if (scope === US_REGION_TYPES.NATIONAL) {
    return {
      id: countryId,
      countryId,
      scope: 'national',
      geographyId: countryId,
    };
  }

  // Subnational scopes need a selected region
  if (!selectedRegion) {
    return null;
  }

  // Store the full prefixed value for all regions
  // For UK: selectedRegion is "constituency/Sheffield Central" or "country/england"
  // For US: selectedRegion is "state/ca" or "congressional_district/CA-01"
  // We store the FULL value with prefix

  const displayValue = extractRegionDisplayValue(selectedRegion);

  return {
    id: `${countryId}-${displayValue}`, // ID uses display value for backward compat
    countryId,
    scope: 'subnational',
    geographyId: selectedRegion, // STORE FULL PREFIXED VALUE
  };
}
