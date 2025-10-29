import { LegalSection } from '@/components/shared/static/LegalPageLayout';

export const TEST_LEGAL_TITLE = 'Test Legal Document';

export const TEST_LEGAL_SECTION_SIMPLE: LegalSection = {
  heading: 'Simple Section',
  content: <p>This is a simple section with plain text.</p>,
};

export const TEST_LEGAL_SECTION_WITH_BOLD: LegalSection = {
  heading: 'Section with Bold',
  content: (
    <p>
      This section has <b>bold text</b> and <strong>strong text</strong>.
    </p>
  ),
};

export const TEST_LEGAL_SECTION_WITH_LINK: LegalSection = {
  heading: 'Section with Link',
  content: (
    <p>
      This section has a{' '}
      <a href="https://example.com" target="_blank" rel="noopener noreferrer">
        link to example
      </a>
      .
    </p>
  ),
};

export const TEST_LEGAL_SECTION_MULTIPLE_PARAGRAPHS: LegalSection = {
  heading: 'Multiple Paragraphs',
  content: (
    <>
      <p>First paragraph with some text.</p>
      <p>Second paragraph with more text.</p>
      <p>Third paragraph with final text.</p>
    </>
  ),
};

export const TEST_LEGAL_SECTIONS: LegalSection[] = [
  TEST_LEGAL_SECTION_SIMPLE,
  TEST_LEGAL_SECTION_WITH_BOLD,
  TEST_LEGAL_SECTION_WITH_LINK,
];
