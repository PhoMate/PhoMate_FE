// src/declarations.d.ts

declare module '@toast-ui/react-image-editor' {
  import { Component } from 'react';

  export interface ImageEditorProps {
    includeUi?: any;
    cssMaxHeight?: number;
    cssMaxWidth?: number;
    selectionStyle?: any;
    usageStatistics?: boolean;
  }

  export default class ImageEditor extends Component<ImageEditorProps> {
    getInstance(): any;
  }
}