export interface AuthorFilterOption {
  key: string;
  name: string;
}

function formatLastFirst(name: string): string {
  const nameParts = name.trim().split(/\s+/);

  if (nameParts.length === 1) {
    return nameParts[0];
  }

  const lastName = nameParts.pop();
  return `${lastName}, ${nameParts.join(" ")}`;
}

export function buildAuthorFilterOptions(
  authors: Record<string, { name: string }>,
): AuthorFilterOption[] {
  return Object.entries(authors)
    .map(([key, author]) => ({
      key,
      name: formatLastFirst(author.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
