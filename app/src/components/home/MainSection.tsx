import { Container } from '@/components/ui';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';

export default function MainSection() {
  const countryId = useCurrentCountry();

  return (
    <Container size="xl" className="tw:py-5xl">
      <div className="tw:flex tw:flex-col tw:items-center tw:mx-auto tw:max-w-[976px] tw:gap-3xl">
        <h1 className="tw:text-[clamp(28px,5vw,48px)] tw:font-bold tw:text-center tw:text-primary-800 tw:leading-tight">
          Start simulating
        </h1>

        <p className="tw:text-2xl tw:text-center tw:leading-normal tw:text-[#132F46]">
          Free, open-source tax and benefit analysis.
          <br />
          {countryId === 'uk'
            ? 'Model policy reforms across the UK.'
            : 'Model policy reforms across all 50 states.'}
          <br />
          Power benefit access tools with accurate rules.
        </p>
      </div>
    </Container>
  );
}
