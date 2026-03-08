import { describe, it, expect } from 'vitest';
import { spacing } from '../tokens/spacing';

describe('spacing', () => {
  describe('base spacing scale', () => {
    it('should have a complete spacing scale', () => {
      expect(spacing.xs).toBe('4px');
      expect(spacing.sm).toBe('8px');
      expect(spacing.md).toBe('12px');
      expect(spacing.lg).toBe('16px');
      expect(spacing.xl).toBe('20px');
      expect(spacing['2xl']).toBe('24px');
      expect(spacing['3xl']).toBe('32px');
      expect(spacing['4xl']).toBe('48px');
      expect(spacing['5xl']).toBe('64px');
    });

    it('should follow a consistent progression', () => {
      // xs -> sm should double
      const xs = parseInt(spacing.xs);
      const sm = parseInt(spacing.sm);
      expect(sm).toBe(xs * 2);
    });
  });

  describe('component spacing', () => {
    it('should have button spacing', () => {
      expect(spacing.component.button.padding).toBe('8px 14px');
      expect(spacing.component.button.height).toBe('36px');
    });

    it('should have input spacing', () => {
      expect(spacing.component.input.padding).toBe('8px 12px');
      expect(spacing.component.input.height).toBe('40px');
      expect(spacing.component.input.compactWidth).toBe('120px');
    });

    it('should have menu spacing', () => {
      expect(spacing.component.menu.itemPadding).toBeDefined();
      expect(spacing.component.menu.itemHeight).toBe('40px');
    });
  });

  describe('layout spacing', () => {
    it('should have consistent header height', () => {
      expect(spacing.layout.header).toBe('58px');
      expect(spacing.appShell.header.height).toBe('58px');
    });

    it('should have sidebar dimensions', () => {
      expect(spacing.layout.sidebarWidth).toBe('280px');
      expect(spacing.appShell.navbar.width).toBe('300px');
    });

    it('should have container width', () => {
      expect(spacing.layout.container).toBe('976px');
    });
  });

  describe('appShell tokens', () => {
    it('should have header config', () => {
      expect(spacing.appShell.header.height).toBe('58px');
      expect(spacing.appShell.header.padding).toBe('8px 16px');
    });

    it('should have navbar config', () => {
      expect(spacing.appShell.navbar.width).toBe('300px');
      expect(spacing.appShell.navbar.breakpoint).toBe('sm');
    });

    it('should have footer config', () => {
      expect(spacing.appShell.footer.height).toBe('60px');
      expect(spacing.appShell.footer.padding).toBe('12px 24px');
    });

    it('should have main content config', () => {
      expect(spacing.appShell.main.padding).toBe('24px');
      expect(spacing.appShell.main.minHeight).toBe('100dvh');
    });
  });

  describe('border radius', () => {
    it('should have a complete semantic radius scale', () => {
      expect(spacing.radius.none).toBe('0px');
      expect(spacing.radius.chip).toBe('2px');
      expect(spacing.radius.element).toBe('4px');
      expect(spacing.radius.container).toBe('8px');
      expect(spacing.radius.feature).toBe('12px');
    });
  });

  describe('container padding', () => {
    it('should have responsive container padding', () => {
      expect(spacing.container.xs).toBe('16px');
      expect(spacing.container.sm).toBe('24px');
      expect(spacing.container.md).toBe('32px');
      expect(spacing.container.lg).toBe('48px');
      expect(spacing.container.xl).toBe('64px');
      expect(spacing.container['2xl']).toBe('80px');
    });
  });
});
