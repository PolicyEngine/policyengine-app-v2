// Organization logos
import downingStreet from '@/images/logos/orgs/10-downing-street.png';
import arnoldVentures from '@/images/logos/orgs/arnold-ventures.png';
import asi from '@/images/logos/orgs/asi.png';
import cec from '@/images/logos/orgs/cec.svg';
import centre from '@/images/logos/orgs/centre.png';
import cfi from '@/images/logos/orgs/cfi.png';
import cgo from '@/images/logos/orgs/cgo.png';
import cps from '@/images/logos/orgs/cps.png';
import dpga from '@/images/logos/orgs/dpga.svg';
import epmt from '@/images/logos/orgs/epmt.png';
import f4gi from '@/images/logos/orgs/f4gi.png';
import gary from '@/images/logos/orgs/gary-community-ventures.png';
import gpew from '@/images/logos/orgs/gpew.png';
import jacobin from '@/images/logos/orgs/jacobin.png';
import liberalParty from '@/images/logos/orgs/liberal-party.png';
import mca from '@/images/logos/orgs/mca.png';
import mirza from '@/images/logos/orgs/mirza.png';
import mothersOutreach from '@/images/logos/orgs/mothers-outreach-network.png';
import myfriendben from '@/images/logos/orgs/myfriendben.png';
import niesr from '@/images/logos/orgs/niesr.png';
import nisk from '@/images/logos/orgs/niskanen-center.png';
import ppp from '@/images/logos/orgs/peoples-policy-project.png';
import pn3policy from '@/images/logos/orgs/pn3policy.png';
import smf from '@/images/logos/orgs/smf.png';
import starlight from '@/images/logos/orgs/starlight.png';
import ubicenterLogo from '@/images/logos/orgs/ubicenter.png';
import ubilabs from '@/images/logos/orgs/ubilabs.png';
import ukeu from '@/images/logos/orgs/ukeu.svg';
import umich from '@/images/logos/orgs/umich.png';
import usc from '@/images/logos/orgs/usc.png';

export type CountryId = 'uk' | 'us';

export interface Organization {
  name: string;
  logo: string;
  link: string;
  countries: CountryId[];
  /** If true, this org appears first on initial load (but still participates in shuffle) */
  initialFirst?: boolean;
}

export const organizations: Record<string, Organization> = {
  // Both UK and US
  dpga: {
    name: 'Digital Public Goods Alliance',
    logo: dpga,
    link: 'https://digitalpublicgoods.net/',
    countries: ['uk', 'us'],
  },
  ubicenter: {
    name: 'UBI Center',
    logo: ubicenterLogo,
    link: 'https://www.ubicenter.org/',
    countries: ['uk', 'us'],
  },

  // Featured organizations (shown first on initial load)
  downing_street: {
    name: '10 Downing Street',
    logo: downingStreet,
    link: 'https://fellows.ai.gov.uk/articles/nikhil-woodruff-micro-simulation',
    countries: ['uk', 'us'],
    initialFirst: true,
  },
  ukeu: {
    name: 'UK in a Changing Europe',
    logo: ukeu,
    link: 'https://ukandeu.ac.uk/',
    countries: ['uk'],
  },
  niesr: {
    name: 'National Institute of Economic and Social Research',
    logo: niesr,
    link: 'https://www.niesr.ac.uk/',
    countries: ['uk'],
  },
  green_party: {
    name: 'Green Party of England and Wales',
    logo: gpew,
    link: 'https://www.greenparty.org.uk/',
    countries: ['uk'],
  },
  centre: {
    name: 'Centre Think Tank',
    logo: centre,
    link: 'https://centrethinktank.co.uk/',
    countries: ['uk'],
  },
  smf: {
    name: 'Social Market Foundation',
    logo: smf,
    link: 'https://www.smf.co.uk/',
    countries: ['uk'],
  },
  cps: {
    name: 'Centre for Policy Studies',
    logo: cps,
    link: 'https://www.cps.org.uk/',
    countries: ['uk'],
  },
  ubilabs: {
    name: 'UBILabs',
    logo: ubilabs,
    link: 'https://www.ubilabnetwork.org/',
    countries: ['uk'],
  },
  liberal: {
    name: 'The Liberal Party',
    logo: liberalParty,
    link: 'http://www.liberal.org.uk/',
    countries: ['uk'],
  },
  asi: {
    name: 'Adam Smith Institute',
    logo: asi,
    link: 'https://www.adamsmith.org/',
    countries: ['uk'],
  },
  cec: {
    name: "Citizens' Economic Council",
    logo: cec,
    link: 'https://citizenseconomiccouncil.org/',
    countries: ['uk'],
  },

  // US only
  arnold_ventures: {
    name: 'Arnold Ventures',
    logo: arnoldVentures,
    link: 'https://www.arnoldventures.org/',
    countries: ['us'],
  },
  niskanen_center: {
    name: 'Niskanen Center',
    logo: nisk,
    link: 'https://www.niskanencenter.org/',
    countries: ['us'],
  },
  cfi: {
    name: 'Colorado Fiscal Institute',
    logo: cfi,
    link: 'https://www.coloradofiscal.org/',
    countries: ['us'],
  },
  pn3policy: {
    name: 'Prenatal-to-3 Policy Impact Center',
    logo: pn3policy,
    link: 'https://www.pn3policy.org/',
    countries: ['us'],
  },
  mothers_outreach_network: {
    name: 'Mothers Outreach Network',
    logo: mothersOutreach,
    link: 'https://www.mothersoutreachnetwork.org/',
    countries: ['us'],
  },
  mfb: {
    name: 'MyFriendBen',
    logo: myfriendben,
    link: 'https://www.myfriendben.org/',
    countries: ['us'],
  },
  gary: {
    name: 'Gary Community Ventures',
    logo: gary,
    link: 'https://garycommunity.org/',
    countries: ['us'],
  },
  f4gi: {
    name: 'Fund for Guaranteed Income',
    logo: f4gi,
    link: 'https://www.f4gi.org/',
    countries: ['us'],
  },
  mca: {
    name: 'Maryland Child Alliance',
    logo: mca,
    link: 'https://www.marylandchildalliance.org/',
    countries: ['us'],
  },
  epmt: {
    name: 'End Poverty Make Trillions',
    logo: epmt,
    link: 'https://endpovertymaketrillions.com/',
    countries: ['us'],
  },
  cgo: {
    name: 'Center for Growth and Opportunity',
    logo: cgo,
    link: 'https://www.thecgo.org/',
    countries: ['us'],
  },
  umich: {
    name: 'University of Michigan',
    logo: umich,
    link: 'https://umich.edu/',
    countries: ['us'],
  },
  usc: {
    name: 'University of Southern California',
    logo: usc,
    link: 'https://www.usc.edu/',
    countries: ['us'],
  },
  jacobin: {
    name: 'Jacobin',
    logo: jacobin,
    link: 'https://jacobin.com/',
    countries: ['us'],
  },
  mirza: {
    name: 'Mirza',
    logo: mirza,
    link: 'https://heymirza.com/',
    countries: ['us'],
  },
  starlight: {
    name: 'Starlight',
    logo: starlight,
    link: 'https://www.get-starlight.com/',
    countries: ['us'],
  },
  ppp: {
    name: "People's Policy Project",
    logo: ppp,
    link: 'https://www.peoplespolicyproject.org/',
    countries: ['us'],
  },
};

// Helper to get orgs for a specific country
export const getOrgsForCountry = (countryId: CountryId): Organization[] =>
  Object.values(organizations).filter((org) => org.countries.includes(countryId));

// Helper to get orgs sorted with initialFirst orgs at the beginning
export const getOrgsForCountrySorted = (countryId: CountryId): Organization[] => {
  const orgs = Object.values(organizations).filter((org) => org.countries.includes(countryId));
  // Put initialFirst orgs at the beginning, rest in original order
  const initialFirst = orgs.filter((org) => org.initialFirst);
  const rest = orgs.filter((org) => !org.initialFirst);
  return [...initialFirst, ...rest];
};
