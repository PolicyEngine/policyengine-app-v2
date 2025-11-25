// Organization logos
import arnoldVentures from '@/images/logos/orgs/arnold-ventures.png';
import asi from '@/images/logos/orgs/asi.png';
import cec from '@/images/logos/orgs/cec.svg';
import dpga from '@/images/logos/orgs/dpga.svg';
import centre from '@/images/logos/orgs/centre.png';
import cfi from '@/images/logos/orgs/cfi.png';
import cgo from '@/images/logos/orgs/cgo.png';
import cps from '@/images/logos/orgs/cps.png';
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
    dpga: {
      name: 'Digital Public Goods Alliance',
      logo: dpga,
      link: 'https://digitalpublicgoods.net/',
    },
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
    dpga: {
      name: 'Digital Public Goods Alliance',
      logo: dpga,
      link: 'https://digitalpublicgoods.net/',
    },
    arnold_ventures: {
      name: 'Arnold Ventures',
      logo: arnoldVentures,
      link: 'https://www.arnoldventures.org/',
    },
    niskanen_center: {
      name: 'Niskanen Center',
      logo: nisk,
      link: 'https://www.niskanencenter.org/',
    },
    cfi: {
      name: 'Colorado Fiscal Institute',
      logo: cfi,
      link: 'https://www.coloradofiscal.org/',
    },
    pn3policy: {
      name: 'Prenatal-to-3 Policy Impact Center',
      logo: pn3policy,
      link: 'https://www.pn3policy.org/',
    },
    mothers_outreach_network: {
      name: 'Mothers Outreach Network',
      logo: mothersOutreach,
      link: 'https://www.mothersoutreachnetwork.org/',
    },
    mfb: {
      name: 'MyFriendBen',
      logo: myfriendben,
      link: 'https://www.myfriendben.org/',
    },
    gary: {
      name: 'Gary Community Ventures',
      logo: gary,
      link: 'https://garycommunity.org/',
    },
    f4gi: {
      name: 'Fund for Guaranteed Income',
      logo: f4gi,
      link: 'https://www.f4gi.org/',
    },
    mca: {
      name: 'Maryland Child Alliance',
      logo: mca,
      link: 'https://www.marylandchildalliance.org/',
    },
    epmt: {
      name: 'End Poverty Make Trillions',
      logo: epmt,
      link: 'https://endpovertymaketrillions.com/',
    },
    cgo: {
      name: 'Center for Growth and Opportunity',
      logo: cgo,
      link: 'https://www.thecgo.org/',
    },
    ubicenter: {
      name: 'UBI Center',
      logo: ubicenterLogo,
      link: 'https://www.ubicenter.org/',
    },
    umich: {
      name: 'University of Michigan',
      logo: umich,
      link: 'https://umich.edu/',
    },
    usc: {
      name: 'University of Southern California',
      logo: usc,
      link: 'https://www.usc.edu/',
    },
    jacobin: {
      name: 'Jacobin',
      logo: jacobin,
      link: 'https://jacobin.com/',
    },
    mirza: {
      name: 'Mirza',
      logo: mirza,
      link: 'https://heymirza.com/',
    },
    starlight: {
      name: 'Starlight',
      logo: starlight,
      link: 'https://www.get-starlight.com/',
    },
    ppp: {
      name: "People's Policy Project",
      logo: ppp,
      link: 'https://www.peoplespolicyproject.org/',
    },
  },
};
