export interface TeamMember {
  name: string;
  bio: string;
  image: string;
}

export interface TeamMemberCardProps {
  member: TeamMember;
  variant?: "default" | "inverted";
}

export default function TeamMemberCard({
  member,
  variant = "default",
}: TeamMemberCardProps) {
  const isInverted = variant === "inverted";
  const textColor = isInverted ? "#FFFFFF" : "#000000";
  const borderColor = isInverted ? "#FFFFFF" : "#000000";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "stretch",
        gap: "5vw",
        marginTop: "50px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={member.image}
        alt={member.name}
        width={250}
        height={250}
        loading="lazy"
        style={{
          width: 250,
          height: 250,
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />

      <div
        style={{
          height: "100%",
          paddingBottom: "50px",
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <p
          style={{
            fontSize: "16px",
            lineHeight: 1.625,
            color: textColor,
            margin: 0,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {member.name}
          </span>{" "}
          {member.bio}
        </p>
      </div>
    </div>
  );
}
