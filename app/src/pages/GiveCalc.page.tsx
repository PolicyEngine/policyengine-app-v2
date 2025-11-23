import StreamlitEmbed from '@/components/StreamlitEmbed';

export default function GiveCalcPage() {
  return (
    <StreamlitEmbed
      embedUrl="https://givecalc.streamlit.app?embedded=true"
      directUrl="https://givecalc.streamlit.app"
      title="GiveCalc"
    />
  );
}
