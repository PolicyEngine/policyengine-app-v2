import { Container } from '@/components/ui';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function TransformationStatement() {
  const countryId = useCurrentCountry();

  const statement =
    countryId === 'uk'
      ? 'Free, open-source, and trusted by researchers, think tanks, and benefit access tools across the UK.'
      : 'Free, open-source, and trusted by NBER, the Federal Reserve, and benefit access tools nationwide.';

  return (
    <Container size="xl" className="tw:py-4xl tw:mt-2xl">
      <p className="tw:text-xl tw:font-semibold tw:text-center tw:text-[#132F46]">{statement}</p>
    </Container>
  );
}
