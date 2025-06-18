// src/types/react-flow-globals.d.ts

// Global type overrides for React Flow compatibility
declare module '@xyflow/react' {
    interface Node<T = any> {
      id: string;
      type?: string;
      data: T;
      position: { x: number; y: number };
      sourcePosition?: string;
      targetPosition?: string;
      hidden?: boolean;
      selected?: boolean;
      dragging?: boolean;
      dragHandle?: string;
      width?: number;
      height?: number;
      parentNode?: string;
      zIndex?: number;
      extent?: 'parent' | [[number, number], [number, number]];
      expandParent?: boolean;
      positionAbsolute?: { x: number; y: number };
      ariaLabel?: string;
      focusable?: boolean;
      style?: React.CSSProperties;
      className?: string;
      [key: string]: any;
    }
  
    interface Edge<T = any> {
      id: string;
      source: string;
      target: string;
      sourceHandle?: string | null;
      targetHandle?: string | null;
      label?: string | React.ReactNode;
      labelStyle?: React.CSSProperties;
      labelShowBg?: boolean;
      labelBgStyle?: React.CSSProperties;
      labelBgPadding?: [number, number];
      labelBgBorderRadius?: number;
      style?: React.CSSProperties;
      animated?: boolean;
      hidden?: boolean;
      deletable?: boolean;
      focusable?: boolean;
      className?: string;
      type?: string;
      markerStart?: string;
      markerEnd?: string;
      zIndex?: number;
      ariaLabel?: string;
      interactionWidth?: number;
      data?: T;
      [key: string]: any;
    }
  }