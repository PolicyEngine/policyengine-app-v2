// UK logos
import ukeu from '@/images/logos/orgs/ukeu.svg';
import niesr from '@/images/logos/orgs/niesr.jpeg';
import gpew from '@/images/logos/orgs/gpew.png';
import centre from '@/images/logos/orgs/centre.png';
import smf from '@/images/logos/orgs/smf.png';
import cps from '@/images/logos/orgs/cps.png';
import ubilabs from '@/images/logos/orgs/ubilabs.png';
import liberalParty from '@/images/logos/orgs/liberal-party.jpeg';
import ubicenterLogo from '@/images/logos/orgs/ubicenter.png';
import asi from '@/images/logos/orgs/asi.webp';
import cec from '@/images/logos/orgs/cec.svg';

// US logos
import cgo from '@/images/logos/orgs/cgo.jpg';
import epmt from '@/images/logos/orgs/epmt.jpg';
import f4gi from '@/images/logos/orgs/f4gi.jpg';
import mca from '@/images/logos/orgs/mca.jpg';
import myfriendben from '@/images/logos/orgs/myfriendben.png';
import nisk from '@/images/logos/orgs/niskanen-center.png';
import pn3policy from '@/images/logos/orgs/pn3policy.png';
import mothersOutreach from '@/images/logos/orgs/mothers-outreach-network.png';

interface Organization {
  name: string;
  logo: string;
  link: string;
}

interface OrgData {
  uk: Record<string, Organization>;
  us: Record<string, Organization>;
}

export const orgData: OrgData = {
  uk: {
    ukeu: {
      name: 'UK in a Changing Europe',
      logo: ukeu,
      link: 'https://ukandeu.ac.uk/',
    },
    niesr: {
      name: 'National Institute of Economic and Social Research',
      logo: niesr,
      link: 'https://www.niesr.ac.uk/',
    },
    green_party: {
      name: 'Green Party of England and Wales',
      logo: gpew,
      link: 'https://www.greenparty.org.uk/',
    },
    centre: {
      name: 'Centre Think Tank',
      logo: centre,
      link: 'https://centrethinktank.co.uk/',
    },
    smf: {
      name: 'Social Market Foundation',
      logo: smf,
      link: 'https://www.smf.co.uk/',
    },
    cps: {
      name: 'Centre for Policy Studies',
      logo: cps,
      link: 'https://www.cps.org.uk/',
    },
    ubilabs: {
      name: 'UBILabs',
      logo: ubilabs,
      link: 'https://www.ubilabnetwork.org/',
    },
    liberal: {
      name: 'The Liberal Party',
      logo: liberalParty,
      link: 'http://www.liberal.org.uk/',
    },
    ubicenter: {
      name: 'UBI Center',
      logo: ubicenterLogo,
      link: 'https://www.ubicenter.org/',
    },
    asi: {
      name: 'Adam Smith Institute',
      logo: asi,
      link: 'https://www.adamsmith.org/',
    },
    cec: {
      name: "Citizens' Economic Council",
      logo: cec,
      link: 'https://citizenseconomiccouncil.org/',
    },
  },
  us: {
    f4gi: {
      name: 'Fund for Guaranteed Income',
      logo: f4gi,
      link: 'https://www.f4gi.org/',
    },
    mca: {
      name: 'Maryland Child Alliance',
      logo: mca,
      link: 'https://www.marylandchildalliance.org/revenue-raisers',
    },
    epmt: {
      name: 'End Poverty Make Trillions',
      logo: epmt,
      link: 'https://endpovertymaketrillions.com/',
    },
    pn3policy: {
      name: 'Prenatal-to-3 Policy Impact Center',
      logo: pn3policy,
      link: 'https://www.pn3policy.org/',
    },
    mfb: {
      name: 'MyFriendBen',
      logo: myfriendben,
      link: 'https://www.myfriendben.org/',
    },
    niskanen_center: {
      name: 'Niskanen Center',
      logo: nisk,
      link: 'https://www.niskanencenter.org/building-a-stronger-foundation-for-american-families-options-for-child-tax-credit-reform/',
    },
    cgo: {
      name: 'Center for Growth and Opportunity',
      logo: cgo,
      link: 'https://www.thecgo.org/research/how-does-targeted-cash-assistance-affect-incentives-to-work/',
    },
    ubicenter: {
      name: 'UBI Center',
      logo: ubicenterLogo,
      link: 'https://www.ubicenter.org/',
    },
    mothers_outreach_network: {
      name: 'Mothers Outreach Network',
      logo: mothersOutreach,
      link: 'https://www.mothersoutreachnetwork.org/',
    },
  },
};
