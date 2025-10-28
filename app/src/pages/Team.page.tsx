import HeroSection from '@/components/shared/static/HeroSection';
import StaticPageLayout from '@/components/shared/static/StaticPageLayout';
import TeamSection from '@/components/shared/static/TeamSection';
import { TeamMember } from '@/components/shared/static/TeamMemberCard';

const founders: TeamMember[] = [
  {
    name: 'Max Ghenis',
    bio: 'is the co-founder and CEO of PolicyEngine. He previously founded and served as president of the UBI Center, a think tank researching universal basic income policies, and worked at Google as a data scientist, leading projects to make internal operations and products more inclusive across the world. Max earned a bachelor\'s degree in operations research from UC Berkeley and a master\'s degree in Data, Economics, and Development Policy from MIT.',
    image: '/assets/team/max-ghenis.png',
  },
  {
    name: 'Nikhil Woodruff',
    bio: 'is the co-founder and CTO of PolicyEngine. He previously served as UK Research Director at the UBI Center, a think tank researching universal basic income policies, and worked at Caspian as a data scientist, improving anti-money laundering investigations. Nikhil earned a bachelor\'s degree in Computer Science from the University of Durham.',
    image: '/assets/team/nikhil-woodruff.png',
  },
];

const staff: TeamMember[] = [
  {
    name: 'Pavel Makarchuk',
    bio: 'is a Policy Modeling Manager at PolicyEngine. He earned a bachelor\'s degree in Economics from Marist College where he researched the economic implications of forced migration.',
    image: '/assets/team/pavel-makarchuk.png',
  },
  {
    name: 'Anthony Volk',
    bio: 'is a full-stack engineer at PolicyEngine. He has a passion for using full-stack technologies and web development best practices to build digital tools that empower society. Previously, he conducted research into international infrastructure and digital development with the Institute for State Effectiveness. Anthony earned bachelor\'s degrees in Government and East Asian Studies from Harvard University.',
    image: '/assets/team/anthony-volk.jpg',
  },
  {
    name: 'Vahid Ahmadi',
    bio: 'is a research associate at PolicyEngine. Previously, he served as a pre-doctoral researcher at the Centre for Macroeconomics (CFM) at the London School of Economics (LSE). Vahid holds a master\'s degree in Economics from the University of Munich (LMU) and a bachelor\'s degree in Electrical Engineering from the Sharif University of Technology.',
    image: '/assets/team/vahid-ahmadi.jpeg',
  },
  {
    name: 'Daphne Hansell',
    bio: 'is a research associate at PolicyEngine. She focuses on the intersection of healthcare and the tax code. Previously, she was a health policy intern at the Niskanen Center and a policy fellow at the Progressive Policy Institute. Daphne holds an B.A. in Public Health from Bryn Mawr College.',
    image: '/assets/team/daphne-hansell.jpeg',
  },
  {
    name: 'David Trimmer',
    bio: 'is a policy research fellow at PolicyEngine. He is also a contributor at the People\'s Policy Project. Previously, he was a social policy intern at the Niskanen Center and a staff writer for Policy Perspectives. David holds an MPA from The George Washington University and a B.S. in Political Science from The Rochester Institute of Technology.',
    image: '/assets/team/david-trimmer.jpeg',
  },
  {
    name: 'María Juaristi',
    bio: 'is a policy modeling intern at PolicyEngine. She is also pursuing an undergraduate degree in political science and data science at Minerva University. Previously, she was a research intern at the University of Chicago.',
    image: '/assets/team/maria-juaristi.png',
  },
  {
    name: 'Ziming Hua',
    bio: 'is a policy modeling fellow at PolicyEngine. He focuses on implementing and analyzing tax and benefit systems. He develops simulation models to evaluate the impacts of policy reforms. Ziming holds a bachelor\'s degree in mathematical finance from the University of California, Irvine, and a master\'s degree in business analytics from Boston University.',
    image: '/assets/team/ziming-hua.jpg',
  },
];

export default function TeamPage() {
  return (
    <StaticPageLayout title="Team">
      <HeroSection
        title="Our people"
        description="PolicyEngine's team leads a global movement of open-source contributors."
      />

      <TeamSection title="Founders" members={founders} variant="primary" />

      <TeamSection title="Team" members={staff} variant="accent" />
    </StaticPageLayout>
  );
}
