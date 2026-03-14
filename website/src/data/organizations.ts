export type CountryId = "uk" | "us";

export interface Organization {
  name: string;
  logo: string;
  link: string;
  countries: CountryId[];
}

export const organizations: Organization[] = [
  // Both UK and US
  {
    name: "Digital Public Goods Alliance",
    logo: "/assets/logos/orgs/dpga.svg",
    link: "https://digitalpublicgoods.net/",
    countries: ["uk", "us"],
  },
  {
    name: "UBI Center",
    logo: "/assets/logos/orgs/ubicenter.png",
    link: "https://www.ubicenter.org/",
    countries: ["uk", "us"],
  },

  // UK only
  {
    name: "UK in a Changing Europe",
    logo: "/assets/logos/orgs/ukeu.svg",
    link: "https://ukandeu.ac.uk/",
    countries: ["uk"],
  },
  {
    name: "National Institute of Economic and Social Research",
    logo: "/assets/logos/orgs/niesr.png",
    link: "https://www.niesr.ac.uk/",
    countries: ["uk"],
  },
  {
    name: "Green Party of England and Wales",
    logo: "/assets/logos/orgs/gpew.png",
    link: "https://www.greenparty.org.uk/",
    countries: ["uk"],
  },
  {
    name: "Centre Think Tank",
    logo: "/assets/logos/orgs/centre.png",
    link: "https://centrethinktank.co.uk/",
    countries: ["uk"],
  },
  {
    name: "Social Market Foundation",
    logo: "/assets/logos/orgs/smf.png",
    link: "https://www.smf.co.uk/",
    countries: ["uk"],
  },
  {
    name: "Centre for Policy Studies",
    logo: "/assets/logos/orgs/cps.png",
    link: "https://www.cps.org.uk/",
    countries: ["uk"],
  },
  {
    name: "UBILabs",
    logo: "/assets/logos/orgs/ubilabs.png",
    link: "https://www.ubilabnetwork.org/",
    countries: ["uk"],
  },
  {
    name: "The Liberal Party",
    logo: "/assets/logos/orgs/liberal-party.png",
    link: "http://www.liberal.org.uk/",
    countries: ["uk"],
  },
  {
    name: "Adam Smith Institute",
    logo: "/assets/logos/orgs/asi.png",
    link: "https://www.adamsmith.org/",
    countries: ["uk"],
  },
  {
    name: "Citizens' Economic Council",
    logo: "/assets/logos/orgs/cec.svg",
    link: "https://citizenseconomiccouncil.org/",
    countries: ["uk"],
  },

  // US only
  {
    name: "Arnold Ventures",
    logo: "/assets/logos/orgs/arnold-ventures.png",
    link: "https://www.arnoldventures.org/",
    countries: ["us"],
  },
  {
    name: "Niskanen Center",
    logo: "/assets/logos/orgs/niskanen-center.png",
    link: "https://www.niskanencenter.org/",
    countries: ["us"],
  },
  {
    name: "Colorado Fiscal Institute",
    logo: "/assets/logos/orgs/cfi.png",
    link: "https://www.coloradofiscal.org/",
    countries: ["us"],
  },
  {
    name: "Prenatal-to-3 Policy Impact Center",
    logo: "/assets/logos/orgs/pn3policy.png",
    link: "https://www.pn3policy.org/",
    countries: ["us"],
  },
  {
    name: "Mothers Outreach Network",
    logo: "/assets/logos/orgs/mothers-outreach-network.png",
    link: "https://www.mothersoutreachnetwork.org/",
    countries: ["us"],
  },
  {
    name: "MyFriendBen",
    logo: "/assets/logos/orgs/myfriendben.png",
    link: "https://www.myfriendben.org/",
    countries: ["us"],
  },
  {
    name: "Gary Community Ventures",
    logo: "/assets/logos/orgs/gary-community-ventures.png",
    link: "https://garycommunity.org/",
    countries: ["us"],
  },
  {
    name: "Fund for Guaranteed Income",
    logo: "/assets/logos/orgs/f4gi.png",
    link: "https://www.f4gi.org/",
    countries: ["us"],
  },
  {
    name: "Maryland Child Alliance",
    logo: "/assets/logos/orgs/mca.png",
    link: "https://www.marylandchildalliance.org/",
    countries: ["us"],
  },
  {
    name: "End Poverty Make Trillions",
    logo: "/assets/logos/orgs/epmt.png",
    link: "https://endpovertymaketrillions.com/",
    countries: ["us"],
  },
  {
    name: "Center for Growth and Opportunity",
    logo: "/assets/logos/orgs/cgo.png",
    link: "https://www.thecgo.org/",
    countries: ["us"],
  },
  {
    name: "University of Michigan",
    logo: "/assets/logos/orgs/umich.png",
    link: "https://umich.edu/",
    countries: ["us"],
  },
  {
    name: "University of Southern California",
    logo: "/assets/logos/orgs/usc.png",
    link: "https://www.usc.edu/",
    countries: ["us"],
  },
  {
    name: "Jacobin",
    logo: "/assets/logos/orgs/jacobin.png",
    link: "https://jacobin.com/",
    countries: ["us"],
  },
  {
    name: "Mirza",
    logo: "/assets/logos/orgs/mirza.png",
    link: "https://heymirza.com/",
    countries: ["us"],
  },
  {
    name: "Starlight",
    logo: "/assets/logos/orgs/starlight.png",
    link: "https://www.get-starlight.com/",
    countries: ["us"],
  },
  {
    name: "People's Policy Project",
    logo: "/assets/logos/orgs/peoples-policy-project.png",
    link: "https://www.peoplespolicyproject.org/",
    countries: ["us"],
  },
];

export function getOrgsForCountry(countryId: string): Organization[] {
  return organizations.filter((org) =>
    org.countries.includes(countryId as CountryId),
  );
}
