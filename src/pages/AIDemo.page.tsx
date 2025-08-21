import { Embed } from "../components/Embed/Embed";

export default function AIDemoPage() {
  return (
    <div style={{ padding: 24 }}>
      <Embed
        header="Watch Our AI Demo"
        kind="youtube"
        src="https://www.youtube.com/watch?v=fnuDyLKpt90" // replace with real ID
      />
    </div>
  );
}

