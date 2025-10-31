import cgo from '@/images/logos/orgs/cgo.jpg';
import epmt from '@/images/logos/orgs/epmt.jpg';
import f4gi from '@/images/logos/orgs/f4gi.jpg';
import mca from '@/images/logos/orgs/mca.jpg';
import myfriendben from '@/images/logos/orgs/myfriendben.png';
import nisk from '@/images/logos/orgs/niskanen-center.png';
import pn3policy from '@/images/logos/orgs/pn3policy.png';

export const orgData = [
  {
    id: '1',
    src: f4gi,
    alt: 'Fund for Guaranteed Income',
    onClick: () => window.open('https://www.f4gi.org/', '_blank'),
  },
  {
    id: '2',
    src: mca,
    alt: 'Maryland Child Alliance',
    onClick: () => window.open('https://www.marylandchildalliance.org/revenue-raisers', '_blank'),
  },
  {
    id: '3',
    src: epmt,
    alt: 'End Poverty Make Trillions',
    onClick: () => window.open('https://endpovertymaketrillions.com/', '_blank'),
  },
  {
    id: '4',
    src: pn3policy,
    alt: 'Prenatal-to-3 Policy Impact Center',
    onClick: () => window.open('https://www.pn3policy.org/', '_blank'),
  },
  {
    id: '5',
    src: myfriendben,
    alt: 'MyFriendBen',
    onClick: () => window.open('https://www.myfriendben.org/', '_blank'),
  },
  {
    id: '6',
    src: nisk,
    alt: 'Niskanen Center',
    onClick: () =>
      window.open(
        'https://www.niskanencenter.org/building-a-stronger-foundation-for-american-families-options-for-child-tax-credit-reform/',
        '_blank'
      ),
  },
  {
    id: '7',
    src: cgo,
    alt: 'Center for Growth and Opportunity',
    onClick: () =>
      window.open(
        'https://www.thecgo.org/research/how-does-targeted-cash-assistance-affect-incentives-to-work/',
        '_blank'
      ),
  },
];
