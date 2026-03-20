import type { WebAppBootstrap } from './index';
import { renderWebApp } from './index';

export function WebAppView(data: WebAppBootstrap): JSX.Element {
  return renderWebApp(data);
}
