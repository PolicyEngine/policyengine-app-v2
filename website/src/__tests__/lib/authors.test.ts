import fc from "fast-check";
import { describe, expect, test } from "vitest";

import {
  articleJsonLdAuthors,
  formatAuthorSlug,
  getAuthorName,
  type AuthorLookup,
} from "@/lib/authors";

// Invariants, for any author lookup and any list of slugs:
//   1. a slug whose own record has a non-blank name gets that name, trimmed;
//   2. any other slug gets its title-cased form;
//   3. the JSON-LD author array has one schema.org Person per slug, in the
//      order the slugs come, each named by getAuthorName.

const AUTHORS: AuthorLookup = {
  "david-trimmer": { name: "David Trimmer" },
  "jason-debacker": { name: "Jason DeBacker" },
  "maria-juaristi": { name: "María Juaristi" },
  "chat-gpt": { name: "ChatGPT" },
  "padded-name": { name: "  Padded Name  " },
  "blank-name": { name: "   " },
  "no-name": {},
};

const UNKNOWN_SLUG = "former-contributor";

const slugArb = fc.stringMatching(/^[a-z0-9]{1,8}(-[a-z0-9]{1,8}){0,3}$/);
const nameArb = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((name) => name.trim().length > 0);

describe("getAuthorName", () => {
  test("given a slug with a record then returns the record's name", () => {
    expect(getAuthorName("david-trimmer", AUTHORS)).toBe("David Trimmer");
  });

  test("given a name the slug can't spell then returns the record's spelling", () => {
    expect(getAuthorName("jason-debacker", AUTHORS)).toBe("Jason DeBacker");
    expect(getAuthorName("maria-juaristi", AUTHORS)).toBe("María Juaristi");
    expect(getAuthorName("chat-gpt", AUTHORS)).toBe("ChatGPT");
  });

  test("given a name with surrounding spaces then trims it", () => {
    expect(getAuthorName("padded-name", AUTHORS)).toBe("Padded Name");
  });

  test("given a slug with no record then falls back to the title-cased slug", () => {
    expect(getAuthorName(UNKNOWN_SLUG, AUTHORS)).toBe("Former Contributor");
  });

  test("given a record with a blank or missing name then falls back to the title-cased slug", () => {
    expect(getAuthorName("blank-name", AUTHORS)).toBe("Blank Name");
    expect(getAuthorName("no-name", AUTHORS)).toBe("No Name");
  });

  test.each(["constructor", "toString", "__proto__", "hasOwnProperty"])(
    "given the Object.prototype key %s then falls back to the slug, not an inherited name",
    (slug) => {
      expect(getAuthorName(slug, AUTHORS)).toBe(formatAuthorSlug(slug));
    },
  );

  test("given the site's authors.json then resolves a real author by default", () => {
    expect(getAuthorName("david-trimmer")).toBe("David Trimmer");
  });

  test("given any slug with a named record then returns that name, trimmed", () => {
    fc.assert(
      fc.property(slugArb, nameArb, (slug, name) => {
        expect(getAuthorName(slug, { [slug]: { name } })).toBe(name.trim());
      }),
    );
  });

  test("given any slug with no record then returns its title-cased form", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        const name = getAuthorName(slug, {});
        expect(name).toBe(formatAuthorSlug(slug));
        expect(name).not.toContain("-");
      }),
    );
  });
});

describe("formatAuthorSlug", () => {
  test("given a hyphenated slug then capitalises each word", () => {
    expect(formatAuthorSlug("max-ghenis")).toBe("Max Ghenis");
  });

  test("given any slug then keeps one word per slug segment", () => {
    fc.assert(
      fc.property(slugArb, (slug) => {
        expect(formatAuthorSlug(slug).split(" ")).toHaveLength(
          slug.split("-").length,
        );
      }),
    );
  });
});

describe("articleJsonLdAuthors", () => {
  test("given known slugs then lists each author as a Person with their name", () => {
    expect(
      articleJsonLdAuthors(["david-trimmer", "maria-juaristi"], AUTHORS),
    ).toEqual([
      { "@type": "Person", name: "David Trimmer" },
      { "@type": "Person", name: "María Juaristi" },
    ]);
  });

  test("given an unknown slug then names that author by the title-cased slug", () => {
    expect(
      articleJsonLdAuthors(["david-trimmer", UNKNOWN_SLUG], AUTHORS),
    ).toEqual([
      { "@type": "Person", name: "David Trimmer" },
      { "@type": "Person", name: "Former Contributor" },
    ]);
  });

  test("given no slugs then returns an empty list", () => {
    expect(articleJsonLdAuthors([], AUTHORS)).toEqual([]);
  });

  test("given any lookup and slugs then lists one Person per slug, in order, named by its record or slug", () => {
    const lookupArb = fc.dictionary(slugArb, fc.record({ name: nameArb }));
    fc.assert(
      fc.property(lookupArb, fc.array(slugArb), (lookup, extraSlugs) => {
        const slugs = [...Object.keys(lookup), ...extraSlugs];
        const people = articleJsonLdAuthors(slugs, lookup);
        expect(people).toHaveLength(slugs.length);
        people.forEach((person, i) => {
          const slug = slugs[i];
          const expectedName = Object.prototype.hasOwnProperty.call(
            lookup,
            slug,
          )
            ? lookup[slug].name.trim()
            : formatAuthorSlug(slug);
          expect(person).toEqual({ "@type": "Person", name: expectedName });
        });
      }),
    );
  });
});
