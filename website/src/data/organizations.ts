// Organization logos — imported from Vite app source so they're
// processed by webpack (hashed filenames, cache-busting).
import arnoldVentures from "../../../app/src/images/logos/orgs/arnold-ventures.png";
import asi from "../../../app/src/images/logos/orgs/asi.png";
import cec from "../../../app/src/images/logos/orgs/cec.svg";
import centre from "../../../app/src/images/logos/orgs/centre.png";
import cfi from "../../../app/src/images/logos/orgs/cfi.png";
import cgo from "../../../app/src/images/logos/orgs/cgo.png";
import cps from "../../../app/src/images/logos/orgs/cps.png";
import dpga from "../../../app/src/images/logos/orgs/dpga.svg";
import epmt from "../../../app/src/images/logos/orgs/epmt.png";
import f4gi from "../../../app/src/images/logos/orgs/f4gi.png";
import gary from "../../../app/src/images/logos/orgs/gary-community-ventures.png";
import gpew from "../../../app/src/images/logos/orgs/gpew.png";
import jacobin from "../../../app/src/images/logos/orgs/jacobin.png";
import liberalParty from "../../../app/src/images/logos/orgs/liberal-party.png";
import mca from "../../../app/src/images/logos/orgs/mca.png";
import mirza from "../../../app/src/images/logos/orgs/mirza.png";
import mothersOutreach from "../../../app/src/images/logos/orgs/mothers-outreach-network.png";
import myfriendben from "../../../app/src/images/logos/orgs/myfriendben.png";
import niesr from "../../../app/src/images/logos/orgs/niesr.png";
import nisk from "../../../app/src/images/logos/orgs/niskanen-center.png";
import ppp from "../../../app/src/images/logos/orgs/peoples-policy-project.png";
import pn3policy from "../../../app/src/images/logos/orgs/pn3policy.png";
import smf from "../../../app/src/images/logos/orgs/smf.png";
import starlight from "../../../app/src/images/logos/orgs/starlight.png";
import ubicenterLogo from "../../../app/src/images/logos/orgs/ubicenter.png";
import ubilabs from "../../../app/src/images/logos/orgs/ubilabs.png";
import ukeu from "../../../app/src/images/logos/orgs/ukeu.svg";
import ggf from "../../../app/src/images/logos/orgs/good-growth-foundation.png";
import houseOfLords from "../../../app/src/images/logos/orgs/house-of-lords.svg";
import nef from "../../../app/src/images/logos/orgs/new-economics-foundation.png";
import no10 from "../../../app/src/images/logos/orgs/no10-data-science.svg";
import tpa from "../../../app/src/images/logos/orgs/tax-policy-associates.svg";
import wpi from "../../../app/src/images/logos/orgs/wpi-economics.svg";
import umich from "../../../app/src/images/logos/orgs/umich.png";
import usc from "../../../app/src/images/logos/orgs/usc.png";

export type CountryId = "uk" | "us";

export type UseCategory = "government" | "research" | "services";

/**
 * The groups on the users page and their headings, in page order. The record
 * type makes a new category a compile error until it has a heading here.
 */
const useCategoryTitles: Record<UseCategory, string> = {
  government: "Government",
  research: "Research",
  services: "Benefit services",
};

export const USE_CATEGORIES = (
  Object.keys(useCategoryTitles) as UseCategory[]
).map((id) => ({ id, title: useCategoryTitles[id] }));

/**
 * What an organization does with PolicyEngine, for the users page
 * (/[countryId]/users). Each entry makes a public claim about a third party:
 * get approval for the wording before adding or changing one.
 */
export interface OrganizationUse {
  category: UseCategory;
  /** Position within the category, ascending. */
  rank: number;
  /** One active-voice sentence on what the organization does with PolicyEngine. */
  description: string;
  /**
   * The organization's own site, for the name on the users page. Set it where
   * `link`, which the logo strip uses, points at one article instead.
   */
  site?: string;
  /** The pages or documents that show the use, in the order the page lists them. */
  sources: [OrganizationUseSource, ...OrganizationUseSource[]];
}

export interface OrganizationUseSource {
  label: string;
  url: string;
  /**
   * Who published the source: the organization itself, or PolicyEngine where
   * no page of the organization's describes the use.
   */
  publisher: "organization" | "policyengine";
}

export interface Organization {
  name: string;
  /** Organizations without a logo stay out of the home page logo strip. */
  logo?: { src: string };
  link: string;
  countries: CountryId[];
  /** Render a white-on-transparent logo in black. */
  darkenLogo?: boolean;
  /** Shown first in the logo strip, in ascending order; the rest are shuffled. */
  priority?: number;
  /** Lists the organization on the users page. */
  use?: OrganizationUse;
}

export type LogoOrganization = Organization & { logo: { src: string } };

export type OrganizationWithUse = Organization & { use: OrganizationUse };

export const organizations: Record<string, Organization> = {
  // Both UK and US
  dpga: {
    name: "Digital Public Goods Alliance",
    logo: dpga,
    link: "https://digitalpublicgoods.net/",
    countries: ["uk", "us"],
  },
  ubicenter: {
    name: "UBI Center",
    logo: ubicenterLogo,
    link: "https://www.ubicenter.org/",
    countries: ["uk", "us"],
  },

  // UK only
  no10: {
    name: "No 10 data science team",
    logo: no10,
    link: "https://www.policyengine.org/uk/research/policyengine-10-downing-street",
    countries: ["uk"],

    priority: 1,
    use: {
      category: "government",
      rank: 1,
      description:
        "The data science team at No 10 Downing Street and PolicyEngine co-founder Nikhil Woodruff, a No10 Innovation Fellow from summer 2025, built the 10ds-microsim package on PolicyEngine to estimate how policy reforms affect living standards and local area incomes, and their distributional impacts; the team uses the results as supplementary, experimental analysis.",
      site: "https://www.gov.uk/government/organisations/prime-ministers-office-10-downing-street",
      sources: [
        {
          label:
            "Nikhil Woodruff's No10 Innovation Fellowship article, January 2026",
          url: "https://fellows.ai.gov.uk/articles/nikhil-woodruff-micro-simulation/",
          publisher: "organization",
        },
        {
          label: "PolicyEngine blog post, January 2026",
          url: "https://www.policyengine.org/uk/research/policyengine-10-downing-street",
          publisher: "policyengine",
        },
      ],
    },
  },
  houseOfLords: {
    name: "House of Lords",
    logo: houseOfLords,
    link: "https://hansard.parliament.uk/Lords/2026-02-24/debates/A381F7D6-0A3C-48FD-8D9E-67751E25877A/NationalInsuranceContributions(EmployerPensionsContributions)Bill",
    countries: ["uk"],

    priority: 2,
  },
  tpa: {
    name: "Tax Policy Associates",
    logo: tpa,
    link: "https://taxpolicy.org.uk/2026/09/10/universities-uk-national-insurance-proposal/",
    countries: ["uk"],

    priority: 3,
    use: {
      category: "research",
      rank: 3,
      description:
        "Tax Policy Associates ran PolicyEngine UK to check its own cost estimate for Universities UK's proposed employer National Insurance exemption for under-25s.",
      site: "https://taxpolicy.org.uk/",
      sources: [
        {
          label: "Tax Policy Associates article, September 2026",
          url: "https://taxpolicy.org.uk/2026/09/10/universities-uk-national-insurance-proposal/",
          publisher: "organization",
        },
      ],
    },
  },
  nef: {
    name: "New Economics Foundation",
    logo: nef,
    link: "https://neweconomics.org/2026/07/insecure-low-quality-work-a-major-driver-of-uks-neets-and-inactivity-crisis",
    countries: ["uk"],

    priority: 5,
    use: {
      category: "research",
      rank: 5,
      description:
        "The New Economics Foundation, with modelling help from PolicyEngine staff, used a microsimulation model that PolicyEngine built to compare an employer National Insurance exemption for hiring inactive or disabled workers with the previous government's planned cut to Personal Independence Payment.",
      site: "https://neweconomics.org/",
      sources: [
        {
          label: "New Economics Foundation press release, July 2026",
          url: "https://neweconomics.org/2026/07/insecure-low-quality-work-a-major-driver-of-uks-neets-and-inactivity-crisis",
          publisher: "organization",
        },
      ],
    },
  },
  ggf: {
    name: "Good Growth Foundation",
    logo: ggf,
    link: "https://www.goodgrowthfoundation.org/",
    countries: ["uk"],
    darkenLogo: true,

    priority: 6,
  },
  wpi: {
    name: "WPI Economics",
    logo: wpi,
    link: "https://wpieconomics.com/",
    countries: ["uk"],

    priority: 7,
  },
  ukeu: {
    name: "UK in a Changing Europe",
    logo: ukeu,
    link: "https://ukandeu.ac.uk/",
    countries: ["uk"],
  },
  niesr: {
    name: "National Institute of Economic and Social Research",
    logo: niesr,
    link: "https://www.niesr.ac.uk/",
    countries: ["uk"],
    use: {
      category: "research",
      rank: 2,
      description:
        "The National Institute of Economic and Social Research, with help from PolicyEngine staff, used PolicyEngine in its UK Living Standards Review 2025 to estimate how tax and benefit changes would affect poverty and the incomes of the bottom tenth of earners, and what each would cost.",
      sources: [
        {
          label:
            "National Institute of Economic and Social Research report, March 2025",
          url: "https://niesr.ac.uk/wp-content/uploads/2025/03/JC871-NIESR-UK-Living-Standards-Review-2025-final-version.pdf",
          publisher: "organization",
        },
      ],
    },
  },
  green_party: {
    name: "Green Party of England and Wales",
    logo: gpew,
    link: "https://www.greenparty.org.uk/",
    countries: ["uk"],
  },
  centre: {
    name: "Centre Think Tank",
    logo: centre,
    link: "https://centrethinktank.co.uk/",
    countries: ["uk"],
  },
  smf: {
    name: "Social Market Foundation",
    logo: smf,
    link: "https://www.smf.co.uk/",
    countries: ["uk"],
  },
  cps: {
    name: "Centre for Policy Studies",
    logo: cps,
    link: "https://www.cps.org.uk/",
    countries: ["uk"],

    priority: 4,
  },
  ubilabs: {
    name: "UBILabs",
    logo: ubilabs,
    link: "https://www.ubilabnetwork.org/",
    countries: ["uk"],
  },
  liberal: {
    name: "The Liberal Party",
    logo: liberalParty,
    link: "http://www.liberal.org.uk/",
    countries: ["uk"],
  },
  asi: {
    name: "Adam Smith Institute",
    logo: asi,
    link: "https://www.adamsmith.org/",
    countries: ["uk"],
  },
  cec: {
    name: "Citizens' Economic Council",
    logo: cec,
    link: "https://citizenseconomiccouncil.org/",
    countries: ["uk"],
  },

  // US only
  arnold_ventures: {
    name: "Arnold Ventures",
    logo: arnoldVentures,
    link: "https://www.arnoldventures.org/",
    countries: ["us"],
  },
  niskanen_center: {
    name: "Niskanen Center",
    logo: nisk,
    link: "https://www.niskanencenter.org/",
    countries: ["us"],
  },
  cfi: {
    name: "Colorado Fiscal Institute",
    logo: cfi,
    link: "https://www.coloradofiscal.org/",
    countries: ["us"],
  },
  pn3policy: {
    name: "Prenatal-to-3 Policy Impact Center",
    logo: pn3policy,
    link: "https://www.pn3policy.org/",
    countries: ["us"],
  },
  mothers_outreach_network: {
    name: "Mothers Outreach Network",
    logo: mothersOutreach,
    link: "https://www.mothersoutreachnetwork.org/",
    countries: ["us"],
  },
  mfb: {
    name: "MyFriendBen",
    logo: myfriendben,
    link: "https://www.myfriendben.org/",
    countries: ["us"],
    use: {
      category: "services",
      rank: 1,
      description:
        "MyFriendBen powers the rules engine behind its benefits screener with PolicyEngine.",
      sources: [
        {
          label: "MyFriendBen About page",
          url: "https://www.myfriendben.org/about-us/",
          publisher: "organization",
        },
      ],
    },
  },
  gary: {
    name: "Gary Community Ventures",
    logo: gary,
    link: "https://garycommunity.org/",
    countries: ["us"],
  },
  f4gi: {
    name: "Fund for Guaranteed Income",
    logo: f4gi,
    link: "https://www.f4gi.org/",
    countries: ["us"],
  },
  mca: {
    name: "Maryland Child Alliance",
    logo: mca,
    link: "https://www.marylandchildalliance.org/",
    countries: ["us"],
  },
  epmt: {
    name: "End Poverty Make Trillions",
    logo: epmt,
    link: "https://endpovertymaketrillions.com/",
    countries: ["us"],
  },
  cgo: {
    name: "Center for Growth and Opportunity",
    logo: cgo,
    link: "https://www.thecgo.org/",
    countries: ["us"],
  },
  umich: {
    name: "University of Michigan",
    logo: umich,
    link: "https://umich.edu/",
    countries: ["us"],
  },
  usc: {
    name: "University of Southern California",
    logo: usc,
    link: "https://www.usc.edu/",
    countries: ["us"],
  },
  jacobin: {
    name: "Jacobin",
    logo: jacobin,
    link: "https://jacobin.com/",
    countries: ["us"],
  },
  mirza: {
    name: "Mirza",
    logo: mirza,
    link: "https://heymirza.com/",
    countries: ["us"],
    use: {
      category: "services",
      rank: 3,
      description:
        "Mirza uses PolicyEngine's API to screen families for federal and state benefit programs.",
      sources: [
        {
          label: "PolicyEngine blog post, December 2025",
          url: "https://www.policyengine.org/us/research/us-giving-tuesday-2025",
          publisher: "policyengine",
        },
      ],
    },
  },
  starlight: {
    name: "Starlight",
    logo: starlight,
    link: "https://www.get-starlight.com/",
    countries: ["us"],
    use: {
      category: "services",
      rank: 4,
      description:
        "Starlight has used PolicyEngine's API to power benefits discovery.",
      sources: [
        {
          label: "PolicyEngine 2025 year in review",
          url: "https://www.policyengine.org/us/2025-year-in-review",
          publisher: "policyengine",
        },
      ],
    },
  },
  ppp: {
    name: "People's Policy Project",
    logo: ppp,
    link: "https://www.peoplespolicyproject.org/",
    countries: ["us"],
  },

  // On the users page only: no logo in the strip
  bea: {
    name: "Bureau of Economic Analysis",
    link: "https://www.bea.gov/",
    countries: ["us"],
    use: {
      category: "government",
      rank: 2,
      description:
        "The Bureau of Economic Analysis runs PolicyEngine to estimate tax liabilities for 2021 and later years in its statistics on the distribution of personal income: the national series and the prototype state series.",
      sources: [
        {
          label: "Bureau of Economic Analysis technical document, June 2026",
          url: "https://apps.bea.gov/data/special-topics/distribution-of-personal-income/national/technical-document.pdf",
          publisher: "organization",
        },
        {
          label: "Bureau of Economic Analysis state methods summary, July 2026",
          url: "https://www.bea.gov/sites/default/files/2026-07/Summary%20of%20Methodological%20Updates%20to%20Distribution%20of%20Personal%20Income%20by%20State-July26.pdf",
          publisher: "organization",
        },
      ],
    },
  },
  jecRepublicans: {
    name: "Joint Economic Committee Republicans",
    link: "https://www.jec.senate.gov/public/index.cfm/republicans/",
    countries: ["us"],
    use: {
      category: "government",
      rank: 3,
      description:
        "The Joint Economic Committee Republicans used PolicyEngine's microsimulation model to estimate individual tax liability and SNAP benefits in their Immigration Fiscal Impact Calculator.",
      sources: [
        {
          label: "Joint Economic Committee Republicans calculator, March 2026",
          url: "https://www.jec.senate.gov/public/index.cfm/republicans/2026/3/immigration-fiscal-impact-calculator",
          publisher: "organization",
        },
      ],
    },
  },
  brookings: {
    name: "Brookings Institution",
    link: "https://www.brookings.edu/",
    countries: ["us"],
    use: {
      category: "research",
      rank: 1,
      description:
        "Brookings authors Sarah Calame and Tara Watson used the PolicyEngine microsimulation model to estimate the cost, poverty effects and distributional effects of a hypothetical plan to make the Earned Income Tax Credit a credit for workers only and pay child benefits only through the Child Tax Credit.",
      sources: [
        {
          label: "Brookings report, July 2026",
          url: "https://www.brookings.edu/wp-content/uploads/2026/06/Supporting_children_and_incentivizing_employment_July2026.pdf",
          publisher: "organization",
        },
      ],
    },
  },
  uhero: {
    name: "UHERO at the University of Hawaiʻi",
    link: "https://uhero.hawaii.edu/",
    countries: ["us"],
    use: {
      category: "research",
      rank: 4,
      description:
        "UHERO based its 2024 analysis of Hawaiʻi's SNAP benefit cliff on an enriched version of PolicyEngine's model, and used PolicyEngine US for the household calculations in its May 2026 brief on the cost of subsidizing child care.",
      sources: [
        {
          label: "UHERO analysis, September 2024",
          url: "https://uhero.hawaii.edu/hawai%CA%BBis-unnecessary-benefit-cliff-how-one-small-policy-change-could-deliver-in-45m-per-year-in-federally-funded-snap-benefits/",
          publisher: "organization",
        },
        {
          label: "UHERO brief, May 2026",
          url: "https://uhero.hawaii.edu/the-true-cost-of-subsidizing-childcare/",
          publisher: "organization",
        },
      ],
    },
  },
  ppi: {
    name: "Progress and Poverty Institute",
    link: "https://progressandpovertyinstitute.org/",
    countries: ["us"],
    use: {
      category: "research",
      rank: 6,
      description:
        "The Progress and Poverty Institute, with the Center for Land Economics, modeled three property-tax relief policies in PolicyEngine for the Maine Legislature's Real Estate Property Tax Relief Task Force.",
      sources: [
        {
          label:
            "Progress and Poverty Institute report to the Maine task force, June 2026",
          url: "https://legislature.maine.gov/doc/12515",
          publisher: "organization",
        },
      ],
    },
  },
  amplifi: {
    name: "Amplifi",
    link: "https://www.amplifi.org/",
    countries: ["us"],
    use: {
      category: "services",
      rank: 2,
      description:
        "Amplifi powers the eligibility screening calculations in its Benefit Navigator with PolicyEngine.",
      sources: [
        {
          label: "Amplifi Benefit Navigator page",
          url: "https://www.amplifi.org/about-benefit-navigator",
          publisher: "organization",
        },
      ],
    },
  },
  studentBasicNeedsCoalition: {
    name: "Student Basic Needs Coalition",
    link: "https://studentbasicneeds.com/",
    countries: ["us"],
    use: {
      category: "services",
      rank: 5,
      description:
        "The Student Basic Needs Coalition uses an Impactica Labs toolkit for SNAP benefit access that PolicyEngine powers.",
      sources: [
        {
          label: "PolicyEngine 2025 year in review",
          url: "https://www.policyengine.org/us/2025-year-in-review",
          publisher: "policyengine",
        },
      ],
    },
  },
};

/** The organizations in a country's home page logo strip. */
export function getOrgsForCountry(countryId: string): LogoOrganization[] {
  return Object.values(organizations).filter(
    (org): org is LogoOrganization =>
      org.logo !== undefined && org.countries.includes(countryId as CountryId),
  );
}

/** The users page's entries, grouped by category in page order. */
export function getOrganizationUses(
  source: Record<string, Organization> = organizations,
): {
  id: UseCategory;
  title: string;
  organizations: OrganizationWithUse[];
}[] {
  const withUse = Object.values(source).filter(
    (org): org is OrganizationWithUse => org.use !== undefined,
  );
  return USE_CATEGORIES.map((category) => ({
    ...category,
    organizations: withUse
      .filter((org) => org.use.category === category.id)
      .sort((a, b) => a.use.rank - b.use.rank),
  }));
}
