const PolicyEngineLogo = '/assets/logos/policyengine/white.svg';

export default function SidebarLogo() {
  return (
    <div className="tw:flex tw:justify-center tw:items-center">
      <img
        src={PolicyEngineLogo}
        alt="PolicyEngine"
        style={{
          height: 24,
          width: 'auto',
        }}
      />
    </div>
  );
}
