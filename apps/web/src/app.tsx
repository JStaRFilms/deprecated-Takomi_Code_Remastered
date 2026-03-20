import type { ReactElement } from 'react';
import type { WebAppBootstrap } from './index';
import { renderWebApp } from './index';

export function WebAppView(data: WebAppBootstrap): ReactElement {
  return renderWebApp(data);
}
