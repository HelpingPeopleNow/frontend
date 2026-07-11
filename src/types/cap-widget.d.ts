import { JSX } from 'preact';

declare module 'cap-widget' {
  // Web component — no JS exports needed
}

// Augment Preact's intrinsic elements for the cap-widget web component
declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'cap-widget': {
        'data-cap-api-endpoint'?: string;
        'data-cap-hidden-field-name'?: string;
        'data-cap-worker-count'?: number;
        'data-cap-disable-haptics'?: boolean;
        onsolve?: (e: CustomEvent<{ token: string }>) => void;
        onprogress?: (e: CustomEvent<{ progress: number }>) => void;
        onerror?: (e: CustomEvent<{ message: string }>) => void;
      };
    }
  }
}
