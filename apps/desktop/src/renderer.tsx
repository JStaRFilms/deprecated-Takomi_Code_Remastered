import type { ReactElement } from 'react';
import type { DesktopAppBootstrap } from './index';
import { renderDesktopApp } from './index';

export function DesktopRenderer(data: DesktopAppBootstrap): ReactElement {
  return renderDesktopApp(data);
}
