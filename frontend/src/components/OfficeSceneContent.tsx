/* eslint-disable react/no-unknown-property -- React Three Fiber properties are Three.js props, not DOM attributes. */
import { useMemo } from 'react';
import type { SeatItem, TechnicianItem, TicketItem } from '../types';

export interface OfficeSceneContentProps {
  seats: SeatItem[];
  tickets: TicketItem[];
  technicians: TechnicianItem[];
  selectedSeatId: number | null;
  onSelectSeat: (seat: SeatItem) => void;
}

type Position = [number, number, number];
type StationModel = { seat: SeatItem; position: Position; rotation: number; status: string; statusColor: string; activeTickets: number };

export function OfficeSceneContent({ seats, tickets, technicians, selectedSeatId, onSelectSeat }: OfficeSceneContentProps) {
  const layout = useMemo(() => {
    const active = seats.filter((seat) => seat.estado.toLocaleLowerCase() === 'activo');
    const left = active.filter((seat) => seat.zona === 'Soporte TI' || seat.zona === 'Administración');
    const right = active.filter((seat) => seat.zona === 'Operaciones');
    const rows = Math.max(2, Math.ceil(left.length / 2), Math.ceil(right.length / 2));
    const depth = Math.max(12.2, rows * 3.1 + 5.6);
    const startZ = -depth / 2 + 3.4;

    const buildSide = (side: SeatItem[], rightSide: boolean) => side.map((seat, index): StationModel => {
      const row = Math.floor(index / 2);
      const column = index % 2;
      const x = rightSide ? (column === 0 ? 2.6 : 5.6) : (column === 0 ? -2.6 : -5.6);
      const occupantId = seat.idUsuarioActual;
      const technician = occupantId == null ? undefined : technicians.find((item) => item.idUsuario === occupantId);
      const occupied = occupantId != null && Boolean(seat.ocupanteNombre);
      const role = seat.ocupanteRol ?? 'Usuario';
      const assigned = tickets.filter((ticket) => {
        const state = ticket.estadoTicket.toLocaleLowerCase();
        if (!occupied || state === 'completado' || state === 'cancelado') return false;
        if (role === 'Tecnico' && technician) return ticket.idTecnico === technician.idTecnico;
        if (role === 'Administrador') return state === 'abierto';
        return ticket.idUsuario === occupantId;
      });
      const hasProgress = assigned.some((ticket) => ticket.estadoTicket.toLocaleLowerCase().includes('proceso'));
      const awaitingConfirmation = assigned.some((ticket) => ticket.estadoTicket.toLocaleLowerCase().includes('resuelt'));
      const status = !occupied ? 'Puesto libre' : hasProgress ? 'Atendiendo caso' : awaitingConfirmation ? 'Por confirmar' : assigned.length ? 'Caso activo' : 'Disponible';
      const statusColor = !occupied ? '#94A3B8' : hasProgress ? '#4F46E5' : awaitingConfirmation ? '#0D9488' : assigned.length ? '#F59E0B' : '#10B981';
      return {
        seat,
        position: [x, 0, startZ + row * 3],
        rotation: column === 0 ? 0 : rightSide ? -Math.PI / 6 : Math.PI / 6,
        status,
        statusColor,
        activeTickets: assigned.length,
      };
    });

    return { stations: [...buildSide(left, false), ...buildSide(right, true)], depth };
  }, [seats, tickets, technicians]);

  const depth = layout.depth;
  const backZ = -depth / 2 + 0.12;

  return <>
    <color attach="background" args={['#DCE5F0']} />
    <fog attach="fog" args={['#DCE5F0', 16, 34]} />
    <hemisphereLight args={['#F8FAFC', '#CBD5E1', 1.05]} />
    <directionalLight position={[10, 16, 12]} intensity={1.65} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <directionalLight position={[-10, 8, -10]} intensity={0.55} color="#BAE6FD" />

    <mesh position={[0, -0.16, 0]} receiveShadow>
      <boxGeometry args={[17.6, 0.28, depth]} />
      <meshStandardMaterial color="#F3F6FA" roughness={0.78} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]}>
      <planeGeometry args={[17.15, depth - 0.45]} />
      <meshStandardMaterial color="#EEF2F7" roughness={0.92} />
    </mesh>
    <gridHelper args={[17.1, 34, '#C7D2DF', '#D9E1EA']} position={[0, 0.002, 0]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.35, 0.006, 0]}>
      <planeGeometry args={[7.75, depth - 2.4]} />
      <meshStandardMaterial color="#E4F3F8" roughness={0.96} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.35, 0.006, 0]}>
      <planeGeometry args={[7.75, depth - 2.4]} />
      <meshStandardMaterial color="#ECEEF9" roughness={0.96} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
      <planeGeometry args={[1.1, depth - 1.6]} />
      <meshStandardMaterial color="#E2E8F0" roughness={1} />
    </mesh>
    <mesh position={[0, -0.31, 0]}>
      <boxGeometry args={[17.9, 0.14, depth + 0.3]} />
      <meshStandardMaterial color="#334155" roughness={0.62} />
    </mesh>

    <mesh position={[0, 1.6, backZ]} receiveShadow>
      <boxGeometry args={[17.6, 3.2, 0.24]} />
      <meshStandardMaterial color="#F8FAFC" roughness={0.86} />
    </mesh>
    <mesh position={[-8.71, 0.45, 0]}>
      <boxGeometry args={[0.18, 0.9, depth]} />
      <meshStandardMaterial color="#E2E8F0" roughness={0.75} />
    </mesh>
    <mesh position={[8.71, 0.45, 0]}>
      <boxGeometry args={[0.18, 0.9, depth]} />
      <meshStandardMaterial color="#E2E8F0" roughness={0.75} />
    </mesh>
    {[-4.6, 4.6].map((x) => <WindowPanel key={x} x={x} z={backZ} />)}
    <group position={[0, 2.08, backZ + 0.19]}>
      <mesh><boxGeometry args={[4.2, 1.05, 0.09]} /><meshStandardMaterial color="#152444" roughness={0.4} /></mesh>
      <mesh position={[-1.54, 0.02, 0.06]}><boxGeometry args={[0.56, 0.56, 0.035]} /><meshStandardMaterial color="#FBBF24" /></mesh>
      <mesh position={[-1.54, 0.02, 0.082]}><boxGeometry args={[0.28, 0.28, 0.02]} /><meshStandardMaterial color="#152444" /></mesh>
      <mesh position={[0.43, 0.19, 0.06]}><boxGeometry args={[2.8, 0.11, 0.025]} /><meshStandardMaterial color="#FFFFFF" /></mesh>
      <mesh position={[0.36, -0.12, 0.06]}><boxGeometry args={[2.1, 0.055, 0.025]} /><meshStandardMaterial color="#7DD3FC" /></mesh>
    </group>
    <mesh position={[0, 0.68, 0.25]}>
      <boxGeometry args={[0.06, 1.35, depth - 3]} />
      <meshPhysicalMaterial color="#BAE6FD" roughness={0.12} metalness={0.1} transparent opacity={0.25} depthWrite={false} />
    </mesh>

    <ServerRack position={[-7.6, 0, backZ + 0.9]} />
    <PrinterStation position={[-6.1, 0, backZ + 0.9]} />
    <Plant position={[-7.6, 0, depth / 2 - 1]} />
    <Plant position={[7.6, 0, backZ + 0.95]} />
    <Plant position={[7.6, 0, depth / 2 - 1]} />

    {layout.stations.map((station) => <DeskStation key={station.seat.idPuesto} station={station} selected={station.seat.idPuesto === selectedSeatId} onSelect={onSelectSeat} />)}
  </>;
}

function WindowPanel({ x, z }: { x: number; z: number }) {
  return <group position={[x, 1.85, z + 0.15]}>
    <mesh><boxGeometry args={[3.4, 1.5, 0.08]} /><meshStandardMaterial color="#1E293B" roughness={0.4} /></mesh>
    <mesh position={[0, 0, 0.055]}><boxGeometry args={[3.15, 1.28, 0.025]} /><meshStandardMaterial color="#BAE6FD" emissive="#E0F2FE" emissiveIntensity={0.35} roughness={0.2} /></mesh>
    <mesh position={[0, 0, 0.08]}><boxGeometry args={[0.045, 1.28, 0.025]} /><meshStandardMaterial color="#334155" /></mesh>
    <mesh position={[0, 0, 0.08]}><boxGeometry args={[3.15, 0.045, 0.025]} /><meshStandardMaterial color="#334155" /></mesh>
  </group>;
}

function DeskStation({ station, selected, onSelect }: { station: StationModel; selected: boolean; onSelect: (seat: SeatItem) => void }) {
  const { seat, position, rotation, statusColor, status, activeTickets } = station;
  const occupied = seat.idUsuarioActual != null && Boolean(seat.ocupanteNombre);
  const personColor = seat.ocupanteRol === 'Tecnico' ? '#0284C7' : seat.ocupanteRol === 'Administrador' ? '#1E3A8A' : '#6366F1';
  const topColor = selected ? '#38BDF8' : '#DEB887';
  return <group position={position} rotation={[0, rotation, 0]} onClick={(event) => { event.stopPropagation(); onSelect(seat); }}>
    <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
      <boxGeometry args={[2.05, 0.065, 0.96]} />
      <meshStandardMaterial color={topColor} roughness={0.58} />
    </mesh>
    <mesh position={[0, 0.54, -0.42]} castShadow>
      <boxGeometry args={[1.86, 0.34, 0.035]} />
      <meshStandardMaterial color="#C29B6C" roughness={0.68} />
    </mesh>
    {([-0.94, 0.94] as const).flatMap((x) => ([-0.4, 0.4] as const).map((z) => <mesh key={`${x}-${z}`} position={[x, 0.365, z]} castShadow>
      <boxGeometry args={[0.055, 0.71, 0.055]} /><meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
    </mesh>))}
    {[-0.94, 0.94].map((x) => <mesh key={`rail-${x}`} position={[x, 0.025, 0]}><boxGeometry args={[0.055, 0.045, 0.86]} /><meshStandardMaterial color="#475569" metalness={0.7} /></mesh>)}

    <DeskChair occupied={occupied} color={personColor} />
    {occupied ? <Collaborator color={personColor} id={seat.idUsuarioActual ?? 1} /> : null}
    <mesh position={[0, 0.94, -0.28]} castShadow><cylinderGeometry args={[0.025, 0.032, 0.34, 10]} /><meshStandardMaterial color="#475569" metalness={0.78} roughness={0.3} /></mesh>
    <mesh position={[0, 1.15, -0.23]} castShadow><boxGeometry args={[0.94, 0.54, 0.045]} /><meshStandardMaterial color="#1E293B" roughness={0.4} /></mesh>
    <mesh position={[0, 1.15, -0.202]}><planeGeometry args={[0.86, 0.46]} /><meshStandardMaterial color="#0F172A" emissive={statusColor} emissiveIntensity={0.22} roughness={0.25} /></mesh>
    <mesh position={[0, 1.27, -0.195]}><planeGeometry args={[0.72, 0.07]} /><meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.25} /></mesh>
    <mesh position={[-0.2, 1.11, -0.194]}><planeGeometry args={[0.28, 0.035]} /><meshStandardMaterial color="#38BDF8" /></mesh>
    <mesh position={[0.2, 1.11, -0.194]}><planeGeometry args={[0.18, 0.035]} /><meshStandardMaterial color="#34D399" /></mesh>
    <mesh position={[0, 0.777, 0.08]}><boxGeometry args={[0.78, 0.008, 0.34]} /><meshStandardMaterial color="#334155" roughness={0.9} /></mesh>
    <mesh position={[-0.06, 0.79, 0.07]}><boxGeometry args={[0.44, 0.018, 0.14]} /><meshStandardMaterial color="#1E293B" /></mesh>
    <mesh position={[0.24, 0.79, 0.08]}><boxGeometry args={[0.06, 0.022, 0.1]} /><meshStandardMaterial color="#1E293B" /></mesh>
    <mesh position={[0.72, 0.82, 0.12]} castShadow><cylinderGeometry args={[0.042, 0.038, 0.095, 12]} /><meshStandardMaterial color={personColor} roughness={0.25} /></mesh>
    <mesh position={[-0.82, 0.795, -0.3]}><cylinderGeometry args={[0.055, 0.065, 0.05, 14]} /><meshStandardMaterial color="#475569" metalness={0.65} /></mesh>
    <mesh position={[-0.82, 0.91, -0.3]}><cylinderGeometry args={[0.035, 0.035, 0.18, 14]} /><meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.7} roughness={0.25} /></mesh>

    <group position={[0, 1.82, 0.04]}>
      <mesh><boxGeometry args={[1.55, 0.4, 0.07]} /><meshStandardMaterial color="#0F172A" roughness={0.5} /></mesh>
      <mesh position={[-0.62, 0, 0.045]}><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.2} /></mesh>
      <mesh position={[0.08, 0.065, 0.045]}><boxGeometry args={[0.96, 0.055, 0.025]} /><meshStandardMaterial color="#FBBF24" /></mesh>
      <mesh position={[0.08, -0.075, 0.045]}><boxGeometry args={[0.72, 0.045, 0.025]} /><meshStandardMaterial color="#E2E8F0" /></mesh>
    </group>
    <mesh position={[0, 2.12, 0]}><boxGeometry args={[0.16, 0.025, 0.16]} /><meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.45} /></mesh>
    <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.6, 2.35]} /><meshBasicMaterial color="#0F172A" transparent opacity={0.07} depthWrite={false} /></mesh>
    {selected ? <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.08, 1.18, 36]} /><meshBasicMaterial color="#0284C7" transparent opacity={0.78} /></mesh> : null}
    <mesh position={[0, 0.025, 0.96]}><boxGeometry args={[0.01, 0.01, 0.01]} /><meshBasicMaterial transparent opacity={0} /></mesh>
    <mesh position={[0.87, 1.6, 0.2]}><sphereGeometry args={[0.045, 10, 8]} /><meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={0.15} /></mesh>
    <group userData={{ seatId: seat.idPuesto, status, activeTickets }} />
  </group>;
}

function DeskChair({ occupied, color }: { occupied: boolean; color: string }) {
  const chairColor = occupied ? color : '#64748B';
  return <group position={[0, 0, occupied ? 0.64 : 0.44]}>
    <mesh position={[0, 0.024, 0]}><cylinderGeometry args={[0.3, 0.28, 0.045, 5]} /><meshStandardMaterial color="#1E293B" /></mesh>
    <mesh position={[0, 0.23, 0]}><cylinderGeometry args={[0.032, 0.036, 0.38, 10]} /><meshStandardMaterial color="#64748B" metalness={0.3} /></mesh>
    <mesh position={[0, 0.44, 0]} castShadow><boxGeometry args={[0.5, 0.07, 0.46]} /><meshStandardMaterial color={chairColor} roughness={0.74} /></mesh>
    <mesh position={[0, 0.73, 0.21]} castShadow rotation={[-0.06, 0, 0]}><boxGeometry args={[0.46, 0.52, 0.065]} /><meshStandardMaterial color={chairColor} roughness={0.74} /></mesh>
    {([-0.26, 0.26] as const).map((x) => <mesh key={x} position={[x, 0.56, 0.02]}><boxGeometry args={[0.05, 0.22, 0.28]} /><meshStandardMaterial color="#1E293B" /></mesh>)}
  </group>;
}

function Collaborator({ color, id }: { color: string; id: number }) {
  const hair = id % 2 === 0 ? '#1E293B' : '#451A03';
  return <group position={[0, 0.475, 0.62]}>
    <mesh position={[0, 0.055, 0]}><boxGeometry args={[0.32, 0.11, 0.26]} /><meshStandardMaterial color="#1E293B" /></mesh>
    <mesh position={[0, 0.28, 0]} castShadow><boxGeometry args={[0.34, 0.36, 0.2]} /><meshStandardMaterial color={color} roughness={0.68} /></mesh>
    {([-0.18, 0.18] as const).map((x) => <mesh key={x} position={[x, 0.42, 0]}><sphereGeometry args={[0.075, 12, 10]} /><meshStandardMaterial color={color} /></mesh>)}
    {([-0.19, 0.19] as const).map((x) => <mesh key={`arm-${x}`} position={[x, 0.31, -0.13]} rotation={[Math.PI * 0.38, 0, 0]}><capsuleGeometry args={[0.045, 0.2, 4, 8]} /><meshStandardMaterial color={color} /></mesh>)}
    <mesh position={[0, 0.48, 0]}><cylinderGeometry args={[0.045, 0.05, 0.07, 10]} /><meshStandardMaterial color="#F1C29B" /></mesh>
    <mesh position={[0, 0.61, 0]} castShadow><sphereGeometry args={[0.132, 16, 14]} /><meshStandardMaterial color="#F1C29B" roughness={0.65} /></mesh>
    <mesh position={[0, 0.64, -0.035]}><sphereGeometry args={[0.138, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.56]} /><meshStandardMaterial color={hair} roughness={0.82} /></mesh>
  </group>;
}

function Plant({ position }: { position: Position }) {
  return <group position={position}>
    <mesh position={[0, 0.22, 0]} castShadow><cylinderGeometry args={[0.28, 0.22, 0.44, 14]} /><meshStandardMaterial color="#334155" roughness={0.55} /></mesh>
    <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.038, 0.048, 0.52, 8]} /><meshStandardMaterial color="#78350F" /></mesh>
    {[[-0.12, 1.02, 0], [0.13, 0.9, 0.1], [-0.15, 0.9, -0.1], [0.02, 1.22, -0.04]].map(([x, y, z]) => <mesh key={`${x}-${z}`} position={[x, y, z]} castShadow><dodecahedronGeometry args={[0.27, 1]} /><meshStandardMaterial color="#16A34A" roughness={0.62} /></mesh>)}
  </group>;
}

function ServerRack({ position }: { position: Position }) {
  return <group position={position}>
    <mesh position={[0, 1.025, 0]} castShadow><boxGeometry args={[1.1, 2.05, 0.9]} /><meshStandardMaterial color="#0F172A" metalness={0.7} roughness={0.35} /></mesh>
    <mesh position={[0, 1.025, 0.46]}><boxGeometry args={[0.94, 1.85, 0.04]} /><meshStandardMaterial color="#1E293B" transparent opacity={0.75} metalness={0.4} roughness={0.2} /></mesh>
    {[0, 1, 2, 3, 4].map((index) => <mesh key={index} position={[0, 0.42 + index * 0.31, 0.49]}><boxGeometry args={[0.72, 0.05, 0.045]} /><meshStandardMaterial color="#38BDF8" emissive="#0EA5E9" emissiveIntensity={0.85} /></mesh>)}
  </group>;
}

function PrinterStation({ position }: { position: Position }) {
  return <group position={position}>
    <mesh position={[0, 0.34, 0]} castShadow><boxGeometry args={[1, 0.68, 0.72]} /><meshStandardMaterial color="#E2E8F0" roughness={0.55} /></mesh>
    <mesh position={[0, 0.91, 0]} castShadow><boxGeometry args={[0.84, 0.46, 0.62]} /><meshStandardMaterial color="#FFFFFF" roughness={0.35} /></mesh>
    <mesh position={[0, 1.16, 0]}><boxGeometry args={[0.86, 0.08, 0.64]} /><meshStandardMaterial color="#152444" roughness={0.4} /></mesh>
  </group>;
}
