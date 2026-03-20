import type { DesktopAppBootstrap } from './index';
import { renderDesktopApp } from './index';

export function DesktopRenderer(data: DesktopAppBootstrap): JSX.Element {
  return renderDesktopApp(data);
}
