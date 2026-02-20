import { toPng, toSvg } from 'html-to-image';

const EXPORT_EXCLUDE_ATTR = 'data-export-exclude';

interface MapExportOptions {
  filename: string;
  backgroundColor?: string;
  pixelRatio?: number;
}

async function withExcludedElementsHidden<T>(
  node: HTMLElement,
  callback: () => Promise<T>
): Promise<T> {
  const excluded = node.querySelectorAll(`[${EXPORT_EXCLUDE_ATTR}]`);
  const originalDisplayValues: string[] = [];

  excluded.forEach((el, i) => {
    const htmlEl = el as HTMLElement;
    originalDisplayValues[i] = htmlEl.style.display;
    htmlEl.style.display = 'none';
  });

  try {
    return await callback();
  } finally {
    excluded.forEach((el, i) => {
      (el as HTMLElement).style.display = originalDisplayValues[i];
    });
  }
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
}

export async function downloadMapAsPng(
  node: HTMLElement,
  options: MapExportOptions
): Promise<void> {
  const dataUrl = await withExcludedElementsHidden(node, () =>
    toPng(node, {
      backgroundColor: options.backgroundColor ?? '#ffffff',
      pixelRatio: options.pixelRatio ?? 2,
    })
  );
  triggerDownload(dataUrl, `${options.filename}.png`);
}

export async function downloadMapAsSvg(
  node: HTMLElement,
  options: MapExportOptions
): Promise<void> {
  const dataUrl = await withExcludedElementsHidden(node, () =>
    toSvg(node, {
      backgroundColor: options.backgroundColor ?? '#ffffff',
    })
  );
  triggerDownload(dataUrl, `${options.filename}.svg`);
}
