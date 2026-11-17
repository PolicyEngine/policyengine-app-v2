import { useId, type ReactNode, type Ref } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';

interface AdminCardProps {
  title: ReactNode;
  /** One sentence under the title, as the account settings' cards have. */
  description?: ReactNode;
  /** The title's ID, for a control that the title labels too; one is made when it is not given. */
  titleId?: string;
  /** The title, for focus to move to; it can take focus only when this is set. */
  titleRef?: Ref<HTMLDivElement>;
  children?: ReactNode;
}

/**
 * One block of an admin page, laid out like the account settings' cards
 * (the account page's details and "Delete my account", "Download my data"):
 * a title, an optional description, and the block's content. The card is a
 * region named by its title, which is a level-2 heading under the page's
 * level-1 title.
 */
export default function AdminCard({
  title,
  description,
  titleId,
  titleRef,
  children,
}: AdminCardProps) {
  const madeTitleId = useId();
  const cardTitleId = titleId ?? madeTitleId;
  return (
    <Card role="region" aria-labelledby={cardTitleId}>
      <CardHeader>
        <CardTitle
          id={cardTitleId}
          ref={titleRef}
          role="heading"
          aria-level={2}
          tabIndex={titleRef ? -1 : undefined}
        >
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
