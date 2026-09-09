import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import { describe, expect, test } from 'vitest';

const SOURCE_ROOTS = [
  path.resolve(process.cwd(), 'src'),
  path.resolve(process.cwd(), '../website/src'),
  path.resolve(process.cwd(), '../calculator-app/src'),
];

const DISPLAY_PROPERTY_NAMES = new Set([
  'aria-label',
  'buttonLabel',
  'buttonText',
  'caption',
  'description',
  'header',
  'headerSubtitle',
  'headerTitle',
  'heading',
  'label',
  'message',
  'placeholder',
  'subtitle',
  'text',
  'title',
  'tooltip',
]);

const DISPLAY_IDENTIFIER_PATTERN =
  /(?:caption|description|header|heading|label|message|placeholder|subtitle|text|title|tooltip)$/i;

const ALLOWED_PHRASES = new Set([
  'Benefit Navigator',
  'Broad Rental Market Area',
  'Axiom Foundation',
  'Child and Dependent Care Credit',
  'Child Benefit',
  'Child Tax Credit',
  'Claude Code',
  'Downing Street',
  'Economic Mobility & Opportunity Fund',
  'Earned Income Tax Credit',
  'Family Resources Survey',
  'General Conference',
  'GitHub Pages',
  'IARIW General Conference',
  'Inherited from baseline simulation',
  'JetBrains Mono',
  'Local Housing Allowance',
  'National Insurance',
  'Northern Ireland',
  'Open Collective',
  'PolicyEngine API',
  'Social Security',
  'Spring Statement',
  'Supplemental Poverty Measure',
  'Tabler Icons',
  'UCLouvain Saint-Louis',
  'United Kingdom',
  'United States',
  'Universal Credit',
]);

const ALLOWED_CAPITALIZED_WORDS = new Set([
  'API',
  'Axiom',
  'August',
  'BEAMM',
  'Build',
  'CAPE',
  'Congress',
  'CSV',
  'Claude',
  'English',
  'Gini',
  'GitHub',
  'IRS',
  'June',
  'Medicaid',
  'MyFriendBen',
  'PolicyBench',
  'PolicyEngine',
  'PNG',
  'Populace',
  'Python',
  'Slack',
  'SVG',
  'UK',
  'US',
]);

const EXCLUDED_PATH_SEGMENTS = new Set([
  '__tests__',
  '_archived',
  'content',
  'data',
  'fixtures',
  'mocks',
  'node_modules',
  'tests',
]);

const EXCLUDED_LEGACY_PATH_PREFIXES = [
  'app/src/components/home/',
  'app/src/components/shared/static/',
  'app/src/components/Footer.tsx',
  'app/src/components/FooterSubscribe.tsx',
  'app/src/components/blog/BlogPostCard.tsx',
  'app/src/components/blog/BlogPostGrid.tsx',
  'app/src/components/blog/ResearchFilters.tsx',
  'app/src/components/blog/blogStyles.ts',
  'app/src/pages/AppPage.tsx',
  'app/src/pages/Blog.page.tsx',
  'app/src/pages/Brand',
  'app/src/pages/Citations.page.tsx',
  'app/src/pages/Donate.page.tsx',
  'app/src/pages/Home.page.tsx',
  'app/src/pages/Privacy.page.tsx',
  'app/src/pages/Research.page.tsx',
  'app/src/pages/Supporters.page.tsx',
  'app/src/pages/Team.page.tsx',
  'app/src/pages/Terms.page.tsx',
  'website/src/app/[countryId]/brand/writing/',
  'website/src/app/[countryId]/events/',
  'website/src/app/[countryId]/privacy/',
  'website/src/app/[countryId]/terms/',
];

const EXCLUDED_JSX_ELEMENTS = new Set(['code', 'pre', 'Script', 'SyntaxHighlighter']);

type Candidate = {
  file: string;
  line: number;
  text: string;
};

function sourceFiles(root: string): string[] {
  if (!fs.existsSync(root)) {
    return [];
  }

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    if (EXCLUDED_PATH_SEGMENTS.has(entry.name)) {
      return [];
    }

    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(entryPath);
    }

    if (
      !entry.isFile() ||
      !/\.(?:ts|tsx)$/.test(entry.name) ||
      /\.(?:test|story)\.tsx?$/.test(entry.name) ||
      entry.name.endsWith('.d.ts')
    ) {
      return [];
    }

    return [entryPath];
  });
}

function propertyName(node: ts.PropertyName | ts.JsxAttributeName): string | null {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node)) {
    return node.text;
  }
  return null;
}

function staticText(node: ts.Node): string | null {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isJsxText(node)) {
    return node.getText().replace(/\s+/g, ' ').trim();
  }

  if (ts.isTemplateExpression(node)) {
    return [
      node.head.text,
      ...node.templateSpans.map((span) => `dynamicvalue${span.literal.text}`),
    ].join('');
  }

  return null;
}

function isInsideExcludedJsxElement(node: ts.Node): boolean {
  let current: ts.Node | undefined = node;
  while (current.parent) {
    current = current.parent;
    if (ts.isJsxElement(current)) {
      const tagName = current.openingElement.tagName.getText();
      if (EXCLUDED_JSX_ELEMENTS.has(tagName)) {
        return true;
      }
    }
  }
  return false;
}

function identifierName(node: ts.Node): string | null {
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  return null;
}

function isDisplayContext(node: ts.Node): boolean {
  if (isInsideExcludedJsxElement(node)) {
    return false;
  }

  if (ts.isJsxText(node)) {
    return true;
  }

  let current: ts.Node = node;

  while (current.parent !== undefined) {
    const parent: ts.Node = current.parent;

    if (ts.isJsxAttribute(parent)) {
      const name = propertyName(parent.name);
      return name !== null && (DISPLAY_PROPERTY_NAMES.has(name) || name === 'name');
    }

    if (ts.isJsxExpression(parent) && ts.isJsxElement(parent.parent)) {
      return true;
    }

    if (ts.isPropertyAssignment(parent)) {
      const name = propertyName(parent.name);
      if (name !== null && DISPLAY_PROPERTY_NAMES.has(name)) {
        return true;
      }
    }

    if (ts.isVariableDeclaration(parent)) {
      const name = identifierName(parent.name);
      if (name !== null && DISPLAY_IDENTIFIER_PATTERN.test(name)) {
        return true;
      }
    }

    if (ts.isParameter(parent)) {
      const name = identifierName(parent.name);
      if (name !== null && DISPLAY_IDENTIFIER_PATTERN.test(name)) {
        return true;
      }
    }

    if (ts.isBindingElement(parent)) {
      const name = identifierName(parent.name);
      if (name !== null && DISPLAY_IDENTIFIER_PATTERN.test(name)) {
        return true;
      }
    }

    if (ts.isBinaryExpression(parent) && parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const name = identifierName(parent.left);
      if (name !== null && DISPLAY_IDENTIFIER_PATTERN.test(name)) {
        return true;
      }
    }

    if (
      (ts.isFunctionDeclaration(parent) || ts.isMethodDeclaration(parent)) &&
      parent.name &&
      DISPLAY_IDENTIFIER_PATTERN.test(parent.name.getText())
    ) {
      return true;
    }

    if (
      (ts.isArrowFunction(parent) || ts.isFunctionExpression(parent)) &&
      ts.isVariableDeclaration(parent.parent)
    ) {
      const name = identifierName(parent.parent.name);
      if (name !== null && DISPLAY_IDENTIFIER_PATTERN.test(name)) {
        return true;
      }
    }

    current = parent;
  }

  return false;
}

function isSentenceCaseViolation(text: string): boolean {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return false;
  }

  let textWithoutAllowedPhrases = normalized;
  for (const phrase of ALLOWED_PHRASES) {
    textWithoutAllowedPhrases = textWithoutAllowedPhrases.replaceAll(phrase, phrase.toLowerCase());
  }

  const clauses = textWithoutAllowedPhrases.split(/(?:[.!?]\s+|:\s+|\s+[—·/]\s+)/);
  return clauses.some((clause) => {
    const words = clause.match(/[A-Za-z][A-Za-z'-]*/g) ?? [];
    const firstWord = words[0];
    if (
      firstWord === undefined ||
      words.length < 2 ||
      (!/^[A-Z]/.test(firstWord) && !firstWord.startsWith('dynamicvalue'))
    ) {
      return false;
    }

    return words.slice(1, 7).some((word) => {
      if (ALLOWED_CAPITALIZED_WORDS.has(word) || /^[A-Z]{2,}$/.test(word)) {
        return false;
      }
      return /^[A-Z][a-z]/.test(word);
    });
  });
}

function violationsInFile(file: string): Candidate[] {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const violations: Candidate[] = [];

  function visit(node: ts.Node): void {
    const text = staticText(node);
    if (text !== null && isDisplayContext(node) && isSentenceCaseViolation(text)) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      violations.push({
        file: path.relative(path.resolve(process.cwd(), '..'), file),
        line: line + 1,
        text: text.replace(/\s+/g, ' ').trim(),
      });
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return violations;
}

describe('user-interface copy', () => {
  test.each(['Date Created', 'Open Calculator in New Tab', 'dynamicvalue Households'])(
    'detects title case in %s',
    (text) => {
      expect(isSentenceCaseViolation(text)).toBe(true);
    }
  );

  test.each([
    'Date created',
    'Download CSV',
    'United States',
    'Child Tax Credit',
    'Could not save the reform. Try again.',
  ])('accepts sentence case in %s', (text) => {
    expect(isSentenceCaseViolation(text)).toBe(false);
  });

  test('uses sentence case in static presentation text', () => {
    const violations = SOURCE_ROOTS.flatMap(sourceFiles)
      .filter((file) => {
        const relativePath = path.relative(path.resolve(process.cwd(), '..'), file);
        return !EXCLUDED_LEGACY_PATH_PREFIXES.some((prefix) => relativePath.startsWith(prefix));
      })
      .flatMap(violationsInFile);

    expect(violations).toEqual([]);
  });
});
