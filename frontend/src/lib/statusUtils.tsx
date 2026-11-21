import type { IconName } from '../components/Icons';

export const CATEGORY_ICON_OPTIONS: { key: IconName; label: string; hint: string; color: string; tile: string }[] = [
  { key: 'cpu', label: 'Hardware', hint: 'Equipos y PCs', color: '#0284C7', tile: '#E0F2FE' },
  { key: 'app', label: 'Software', hint: 'Apps y licencias', color: '#4F46E5', tile: '#EEF0FF' },
  { key: 'wifi', label: 'Redes', hint: 'Wi-Fi y VPN', color: '#0D9488', tile: '#CCFBF1' },
  { key: 'key', label: 'Accesos', hint: 'Cuentas y claves', color: '#F59E0B', tile: '#FEF3C7' },
  { key: 'printer', label: 'Impresoras', hint: 'Periféricos', color: '#E11D48', tile: '#FFE4E6' },
  { key: 'sparkles', label: 'Función futura', hint: 'IA y automatización', color: '#7C3AED', tile: '#F3E8FF' },
  { key: 'cloud', label: 'Nube / Cloud', hint: 'Servidores remotos', color: '#0891B2', tile: '#CFFAFE' },
  { key: 'shield', label: 'Seguridad', hint: 'Ciberseguridad', color: '#059669', tile: '#D1FAE5' },
  { key: 'smartphone', label: 'Móviles', hint: 'Celulares y tablets', color: '#2563EB', tile: '#DBEAFE' },
  { key: 'database', label: 'Datos / ERP', hint: 'Bases de datos', color: '#9333EA', tile: '#F3E8FF' },
  { key: 'video', label: 'Salas / Video', hint: 'Videoconferencia', color: '#C026D3', tile: '#FAE8FF' },
  { key: 'headphones', label: 'Audio / Voz', hint: 'Telefonía IP', color: '#EA580C', tile: '#FFEDD5' },
  { key: 'zap', label: 'Energía / UPS', hint: 'Respaldo eléctrico', color: '#CA8A04', tile: '#FEF9C3' },
];

export const TICKET_WORKFLOW_STEPS = [
  { label: 'Recibido', hint: 'En cola' },
  { label: 'Asignado', hint: 'Con técnico' },
  { label: 'En atención', hint: 'Trabajando' },
  { label: 'Resuelto', hint: 'Por confirmar' },
  { label: 'Completado', hint: 'Confirmado' },
] as const;

export function ticketWorkflowIndex(status: string): number {
  const normalized = status.toLocaleLowerCase();
  if (normalized.includes('complet') || normalized.includes('cerrad')) return 4;
  if (normalized.includes('resuelt')) return 3;
  if (normalized.includes('proceso') || normalized.includes('atenci')) return 2;
  if (normalized.includes('asign')) return 1;
  return 0;
}

export function categoryIconFor(name: string, storedIcon?: string | null): IconName {
  const stored = CATEGORY_ICON_OPTIONS.find((option) => option.key === storedIcon?.toLocaleLowerCase());
  if (stored) return stored.key;
  const normalized = `${name} ${storedIcon ?? ''}`.toLocaleLowerCase();
  if (normalized.includes('hardware') || normalized.includes('equipo')) return 'cpu';
  if (normalized.includes('software') || normalized.includes('app')) return 'app';
  if (normalized.includes('red') || normalized.includes('wifi') || normalized.includes('conect')) return 'wifi';
  if (normalized.includes('cuenta') || normalized.includes('acceso') || normalized.includes('key')) return 'key';
  if (normalized.includes('impres') || normalized.includes('perif') || normalized.includes('print')) return 'printer';
  if (normalized.includes('cloud') || normalized.includes('nube')) return 'cloud';
  if (normalized.includes('seguridad') || normalized.includes('shield')) return 'shield';
  if (normalized.includes('movil') || normalized.includes('móvil') || normalized.includes('celular')) return 'smartphone';
  if (normalized.includes('dato') || normalized.includes('erp') || normalized.includes('base')) return 'database';
  if (normalized.includes('video') || normalized.includes('sala')) return 'video';
  if (normalized.includes('audio') || normalized.includes('voz') || normalized.includes('telefon')) return 'headphones';
  if (normalized.includes('energ') || normalized.includes('ups')) return 'zap';
  if (normalized.includes('futura') || normalized.includes('automat') || normalized.includes('ia')) return 'sparkles';
  return 'grid-outline';
}
