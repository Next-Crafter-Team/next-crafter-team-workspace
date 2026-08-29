/**
 * Sistema de diseño "Cementerio de Ideas".
 * Tema oscuro cálido con acento rojo/ember. Es un tema comprometido:
 * no cambia con el color scheme del SO.
 */
import { Platform } from 'react-native';

export const Cementerio = {
  bg: '#0E0808',
  bgRaised: '#170D0D',
  bgCard: '#170D0D',
  bgInput: '#1D1211',
  stone: '#A8938C',
  stoneDim: '#5E4C48',
  bone: '#F3E9E1',
  bodyText: '#DCD0C8',
  ember: '#E3432A',
  emberDim: '#3A1013',
  gold: '#FCA35D',
  goldDim: '#3E2A15',
  line: 'rgba(243,233,225,0.09)',
} as const;

/**
 * Fuentes del sistema por plataforma. Cuando se agreguen los archivos
 * de Fraunces / Inter / JetBrains Mono vía expo-font, se reemplazan acá.
 */
export const CementerioFonts = Platform.select({
  ios: { serif: 'Georgia', mono: 'Menlo', sans: 'System' },
  android: { serif: 'serif', mono: 'monospace', sans: 'sans-serif' },
  web: {
    serif: "Georgia, 'Times New Roman', serif",
    mono: "ui-monospace, Menlo, Consolas, monospace",
    sans: "Inter, system-ui, sans-serif",
  },
  default: { serif: 'serif', mono: 'monospace', sans: 'System' },
})!;
