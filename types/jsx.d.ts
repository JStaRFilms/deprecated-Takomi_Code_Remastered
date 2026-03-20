declare namespace JSX {
  type Element = {
    readonly type: string;
    readonly props: Record<string, unknown>;
  };

  interface IntrinsicElements {
    [elementName: string]: Record<string, unknown>;
  }
}
