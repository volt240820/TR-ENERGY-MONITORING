
export interface TransformerDataPoint {
  timestamp: string;
  [key: string]: number | string | null; // Allow null for idle transformers
}

export interface TransformerConfig {
  id: string;
  name: string;
  color: string;
  fillColor: string;
}

// A diverse palette of colors to assign dynamically to transformers
export const CHART_PALETTE = [
  { color: '#F4A261', fillColor: 'rgba(244, 162, 97, 0.2)' }, // Orange
  { color: '#2A9D8F', fillColor: 'rgba(42, 157, 143, 0.2)' }, // Teal
  { color: '#E9C46A', fillColor: 'rgba(233, 196, 106, 0.2)' }, // Yellow
  { color: '#E76F51', fillColor: 'rgba(231, 111, 81, 0.2)' }, // Burnt Sienna
  { color: '#264653', fillColor: 'rgba(38, 70, 83, 0.2)' }, // Dark Blue
  { color: '#8AB17D', fillColor: 'rgba(138, 177, 125, 0.2)' }, // Green
  { color: '#B5838D', fillColor: 'rgba(181, 131, 141, 0.2)' }, // Pink
  { color: '#FFB4A2', fillColor: 'rgba(255, 180, 162, 0.2)' }, // Peach
  { color: '#6D6875', fillColor: 'rgba(109, 104, 117, 0.2)' }, // Purple
  { color: '#A5A58D', fillColor: 'rgba(165, 165, 141, 0.2)' }, // Olive
  { color: '#F4D35E', fillColor: 'rgba(244, 211, 94, 0.2)' }, // Bright Yellow
  { color: '#EE964B', fillColor: 'rgba(238, 150, 75, 0.2)' }, // Orange Pop
  { color: '#F95738', fillColor: 'rgba(249, 87, 56, 0.2)' }, // Red
  { color: '#4CC9F0', fillColor: 'rgba(76, 201, 240, 0.2)' }, // Cyan
  { color: '#7209B7', fillColor: 'rgba(114, 9, 183, 0.2)' }, // Violet
];
