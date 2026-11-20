import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { StyleSheet, View } from 'react-native';
import type { SeatItem, TechnicianItem, TicketItem } from '../types';
import { OfficeSceneContent } from './OfficeSceneContent';

export interface OfficeSceneProps {
  seats: SeatItem[];
  tickets: TicketItem[];
  technicians: TechnicianItem[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: SeatItem) => void;
  height: number;
}

export default function OfficeScene({ seats, tickets, technicians, selectedSeatId, onSelectSeat, height }: OfficeSceneProps) {
  const leftRows = Math.ceil(seats.filter((seat) => seat.zona === 'Soporte TI' || seat.zona === 'Administración').length / 2);
  const rightRows = Math.ceil(seats.filter((seat) => seat.zona === 'Operaciones').length / 2);
  const depth = Math.max(12.2, Math.max(2, leftRows, rightRows) * 3.1 + 5.6);
  const cameraPosition: [number, number, number] = [0, Math.max(9.5, depth * 0.68), depth * 0.85];
  return <View style={[styles.frame, { height }]}><Canvas shadows dpr={[1, 1.5]} camera={{ position: cameraPosition, fov: 42 }}>
    <OfficeSceneContent seats={seats} tickets={tickets} technicians={technicians} selectedSeatId={selectedSeatId} onSelectSeat={onSelectSeat} />
    <OrbitControls makeDefault enablePan enableZoom minDistance={6} maxDistance={30} minPolarAngle={0.08} maxPolarAngle={1.48} target={[0, 0.7, 0]} />
  </Canvas></View>;
}

const styles = StyleSheet.create({ frame: { width: '100%', overflow: 'hidden', borderRadius: 16, backgroundColor: '#DDE5EF' } });
