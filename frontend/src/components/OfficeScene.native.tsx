import { StyleSheet, View } from 'react-native';
import type { SeatItem, TechnicianItem, TicketItem } from '../types';

export interface OfficeSceneProps {
  seats: SeatItem[];
  tickets: TicketItem[];
  technicians: TechnicianItem[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: SeatItem) => void;
  height: number;
}

/**
 * The native office screen embeds the existing API scene in a WebView.
 * Keep this platform module free of Three.js so Expo Go can load the route
 * tree without evaluating a web-only 3D runtime.
 */
export default function OfficeScene({ height }: OfficeSceneProps) {
  return <View pointerEvents="none" style={[styles.frame, { height }]} />;
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', borderRadius: 16, backgroundColor: 'transparent' },
});
