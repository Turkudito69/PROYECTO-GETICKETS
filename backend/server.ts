import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DomainError, store } from './store.js';
import { office3dHtml } from './office3dEmbed.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));
const require = createRequire(import.meta.url);
const threePackageRoot = path.resolve(path.dirname(require.resolve('three')), '..');
app.use('/vendor/three', express.static(threePackageRoot, { maxAge: '1d' }));

app.get('/office3d-embed', (_req, res) => {
  res.type('html').send(office3dHtml);
});

function handleError(err: unknown, res: Response) {
  if (err instanceof DomainError) {
    return res.status(err.status).json({ msj: err.message });
  }
  const message = err instanceof Error ? err.message : 'Error interno del servidor';
  return res.status(500).json({ msj: message });
}

function wrap(fn: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, _next: NextFunction) => {
    try {
      fn(req, res);
    } catch (err) {
      handleError(err, res);
    }
  };
}

// --- LoginController ---
app.post(
  '/api/Login',
  wrap((req, res) => {
    const correo = req.body.correo ?? req.body.Correo ?? '';
    const contrasena = req.body.contrasena ?? req.body.Contrasena ?? '';
    if (!correo || !contrasena) {
      return res.status(400).json({ msj: 'Correo y contraseña requeridos.' });
    }
    const user = store.validarLogin(correo, contrasena);
    if (!user) {
      return res.status(401).json({ mensaje: 'Correo o contraseña incorrectos.' });
    }
    return res.json({
      mensaje: 'Inicio de sesión correcto.',
      usuario: user,
    });
  })
);

// --- TicketController ---
app.get(
  '/api/Ticket',
  wrap((_req, res) => {
    res.json(store.listarTickets());
  })
);

const createTicketHandler = wrap((req, res) => {
  const result = store.nuevoTicket({
    descripcion: req.body.descripcion ?? req.body.Descripcion,
    idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
    idCategoria: req.body.idCategoria ?? req.body.IdCategoria,
    idPrioridad: req.body.idPrioridad ?? req.body.IdPrioridad,
  });
  res.status(201).json({ mensaje: 'Ticket agregado correctamente', ...result });
});

app.post('/api/Ticket', createTicketHandler);
app.post('/api/Ticket/Insertar%20ticket', createTicketHandler);

app.put(
  '/api/Ticket/Asignar',
  wrap((req, res) => {
    store.asignarTicket({
      idTicket: req.body.idTicket ?? req.body.IdTicket,
      idTecnico: req.body.idTecnico ?? req.body.IdTecnico,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
    });
    res.status(204).send();
  })
);

app.put(
  '/api/Ticket/IniciarAtencion',
  wrap((req, res) => {
    store.iniciarAtencion({
      idTicket: req.body.idTicket ?? req.body.IdTicket,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
    });
    res.status(204).send();
  })
);

app.put(
  '/api/Ticket/GuardarObservacion',
  wrap((req, res) => {
    store.guardarObservacion({
      idTicket: req.body.idTicket ?? req.body.IdTicket,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
      observacion: req.body.observacion ?? req.body.Observacion,
    });
    res.status(204).send();
  })
);

app.put(
  '/api/Ticket/Finalizar',
  wrap((req, res) => {
    store.finalizarTicket({
      idTicket: req.body.idTicket ?? req.body.IdTicket,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
      diagnostico: req.body.diagnostico ?? req.body.Diagnostico,
      solucion: req.body.solucion ?? req.body.Solucion,
    });
    res.status(204).send();
  })
);

app.put(
  '/api/Ticket/ConfirmarCompletado',
  wrap((req, res) => {
    store.confirmarCompletado({
      idTicket: req.body.idTicket ?? req.body.IdTicket,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
    });
    res.status(204).send();
  })
);

app.put(
  '/api/Ticket/Reabrir',
  wrap((req, res) => {
    store.reabrirTicket({
      idTicket: req.body.idTicket ?? req.body.IdTicket,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
      motivo: req.body.motivo ?? req.body.Motivo,
    });
    res.status(204).send();
  })
);

// --- DetalleTicketController & DetalleTicketGeneralController ---
app.get(
  '/api/DetalleTicket/:idTicket',
  wrap((req, res) => {
    res.json(store.listarDetalleTicket(String(req.params.idTicket)));
  })
);

app.get(
  '/api/DetalleTicketGeneral',
  wrap((_req, res) => {
    res.json(store.listarDetalleTicketGeneral());
  })
);

// --- SeguimientoTicketController ---
app.get(
  '/api/SeguimientoTicket/:idTicket',
  wrap((req, res) => {
    res.json(store.listarSeguimiento(String(req.params.idTicket)));
  })
);

// --- AuditoriaController ---
app.get(
  '/api/Auditoria',
  wrap((_req, res) => {
    res.json(store.listarAuditoria());
  })
);

// --- UsuarioController ---
app.get('/api/Usuario', wrap((_req, res) => res.json(store.listarUsuarios())));
app.post(
  '/api/Usuario',
  wrap((req, res) => {
    const out = store.nuevoUsuario({
      nombre: req.body.nombre ?? req.body.Nombre,
      apellido: req.body.apellido ?? req.body.Apellido,
      correo: req.body.correo ?? req.body.Correo,
      contrasena: req.body.contrasena ?? req.body.Contrasena,
      idRol: req.body.idRol ?? req.body.IdRol,
      fotoUrl: req.body.fotoUrl ?? req.body.FotoUrl ?? null,
      asignarPuesto: req.body.asignarPuesto,
      idPuesto: req.body.idPuesto ?? null,
      idUsuarioAccion: req.body.idUsuarioAccion,
    });
    res.status(201).json({ mensaje: 'Usuario agregado correctamente', ...out });
  })
);
app.put(
  '/api/Usuario/Editar/:id',
  wrap((req, res) => {
    store.editarUsuario(Number(req.params.id), {
      nombre: req.body.nombre ?? req.body.Nombre,
      apellido: req.body.apellido ?? req.body.Apellido,
      correo: req.body.correo ?? req.body.Correo,
      contrasena: req.body.contrasena ?? req.body.Contrasena,
      idRol: req.body.idRol ?? req.body.IdRol,
      idEstado: req.body.idEstado ?? req.body.IdEstado ?? 1,
      fotoUrl: req.body.fotoUrl ?? req.body.FotoUrl,
    });
    res.status(204).send();
  })
);
app.put(
  '/api/Usuario/Foto/:id',
  wrap((req, res) => {
    store.actualizarFotoUsuario(
      Number(req.params.id),
      req.body.fotoUrl ?? req.body.FotoUrl ?? null
    );
    res.status(204).send();
  })
);
app.delete(
  '/api/Usuario/Eliminar/:id',
  wrap((req, res) => {
    store.eliminarUsuario(Number(req.params.id));
    res.status(204).send();
  })
);

// --- TecnicoController ---
app.get('/api/Tecnico', wrap((_req, res) => res.json(store.listarTecnicos())));
app.post(
  '/api/Tecnico',
  wrap((req, res) => {
    const out = store.nuevoTecnico({
      especialidad: req.body.especialidad ?? req.body.Especialidad,
      correo: req.body.correo ?? req.body.Correo,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
    });
    res.status(201).json({ mensaje: 'Técnico agregado correctamente', ...out });
  })
);
app.put(
  '/api/Tecnico/Editar/:id',
  wrap((req, res) => {
    store.editarTecnico(Number(req.params.id), {
      especialidad: req.body.especialidad ?? req.body.Especialidad,
      correo: req.body.correo ?? req.body.Correo,
      idUsuario: req.body.idUsuario ?? req.body.IdUsuario,
      idEstado: req.body.idEstado ?? req.body.IdEstado ?? 1,
    });
    res.status(204).send();
  })
);
app.delete(
  '/api/Tecnico/Eliminar/:id',
  wrap((req, res) => {
    store.eliminarTecnico(Number(req.params.id));
    res.status(204).send();
  })
);

// --- CategoriaController ---
app.get('/api/Categoria', wrap((_req, res) => res.json(store.listarCategorias())));
app.post(
  '/api/Categoria',
  wrap((req, res) => {
    const out = store.nuevaCategoria({
      nombreCategoria: req.body.nombreCategoria ?? req.body.NombreCategoria,
      icono: req.body.icono ?? req.body.Icono ?? null,
      descripcion: req.body.descripcion ?? req.body.Descripcion ?? null,
    });
    res.status(201).json({ mensaje: 'Categoría agregada correctamente', ...out });
  })
);
app.put(
  '/api/Categoria/Editar/:id',
  wrap((req, res) => {
    store.editarCategoria(Number(req.params.id), {
      nombreCategoria: req.body.nombreCategoria ?? req.body.NombreCategoria,
      icono: req.body.icono ?? req.body.Icono,
      descripcion: req.body.descripcion ?? req.body.Descripcion,
      idEstado: req.body.idEstado ?? req.body.IdEstado ?? 1,
    });
    res.status(204).send();
  })
);
app.delete(
  '/api/Categoria/Eliminar/:id',
  wrap((req, res) => {
    store.eliminarCategoria(Number(req.params.id));
    res.status(204).send();
  })
);

// --- PrioridadController ---
app.get('/api/Prioridad', wrap((_req, res) => res.json(store.listarPrioridades())));
app.post(
  '/api/Prioridad',
  wrap((req, res) => {
    const out = store.nuevaPrioridad({
      nombrePrioridad: req.body.nombrePrioridad ?? req.body.NombrePrioridad,
    });
    res.status(201).json({ mensaje: 'Prioridad agregada correctamente', ...out });
  })
);
app.put(
  '/api/Prioridad/Editar/:id',
  wrap((req, res) => {
    store.editarPrioridad(Number(req.params.id), {
      nombrePrioridad: req.body.nombrePrioridad ?? req.body.NombrePrioridad,
      idEstado: req.body.idEstado ?? req.body.IdEstado ?? 1,
    });
    res.status(204).send();
  })
);
app.delete(
  '/api/Prioridad/Eliminar/:id',
  wrap((req, res) => {
    store.eliminarPrioridad(Number(req.params.id));
    res.status(204).send();
  })
);

// --- EstadoTicketController ---
app.get('/api/EstadoTicket', wrap((_req, res) => res.json(store.listarEstadosTicket())));
app.post(
  '/api/EstadoTicket',
  wrap((req, res) => {
    const out = store.nuevoEstadoTicket({
      nombreEstado: req.body.nombreEstado ?? req.body.NombreEstado,
    });
    res.status(201).json({ mensaje: 'Estado de ticket agregado correctamente', ...out });
  })
);
app.put(
  '/api/EstadoTicket/Editar/:id',
  wrap((req, res) => {
    store.editarEstadoTicket(Number(req.params.id), {
      nombreEstado: req.body.nombreEstado ?? req.body.NombreEstado,
      idEstado: req.body.idEstado ?? req.body.IdEstado ?? 1,
    });
    res.status(204).send();
  })
);
app.delete(
  '/api/EstadoTicket/Eliminar/:id',
  wrap((req, res) => {
    store.eliminarEstadoTicket(Number(req.params.id));
    res.status(204).send();
  })
);

// --- RolController ---
app.get('/api/Rol', wrap((_req, res) => res.json(store.listarRoles())));
app.post(
  '/api/Rol',
  wrap((req, res) => {
    const out = store.nuevoRol({
      nombreRol: req.body.nombreRol ?? req.body.NombreRol,
      descripcion: req.body.descripcion ?? req.body.Descripcion ?? null,
      permisos: req.body.permisos ?? req.body.Permisos ?? [],
    });
    res.status(201).json({ mensaje: 'Rol agregado correctamente', ...out });
  })
);
app.put(
  '/api/Rol/Editar/:id',
  wrap((req, res) => {
    store.editarRol(Number(req.params.id), {
      nombreRol: req.body.nombreRol ?? req.body.NombreRol,
      descripcion: req.body.descripcion ?? req.body.Descripcion,
      permisos: req.body.permisos ?? req.body.Permisos,
      idEstado: req.body.idEstado ?? req.body.IdEstado ?? 1,
    });
    res.status(204).send();
  })
);
app.delete(
  '/api/Rol/Eliminar/:id',
  wrap((req, res) => {
    store.eliminarRol(Number(req.params.id));
    res.status(204).send();
  })
);

// --- EstadoController ---
app.get('/api/Estado', wrap((_req, res) => res.json(store.listarEstados())));

// --- PuestoTrabajoController ---
app.get('/api/Puesto', wrap((_req, res) => res.json(store.listarPuestos())));
app.get(
  '/api/Puesto/Historial',
  wrap((_req, res) => res.json(store.listarHistorialPuesto()))
);
app.get(
  '/api/Puesto/Historial/:idPuesto',
  wrap((req, res) => res.json(store.listarHistorialPuesto(Number(req.params.idPuesto))))
);
app.post(
  '/api/Puesto',
  wrap((req, res) => {
    const out = store.nuevoPuesto({
      codigoPuesto: req.body.codigoPuesto,
      nombrePuesto: req.body.nombrePuesto,
      zona: req.body.zona,
      idUsuarioActual: req.body.idUsuarioActual ?? null,
      idUsuarioAccion: req.body.idUsuarioAccion,
      motivo: req.body.motivo,
    });
    res.status(201).json({ mensaje: 'Puesto creado correctamente', ...out });
  })
);
app.put(
  '/api/Puesto/Asignar',
  wrap((req, res) => {
    store.asignarPuesto({
      idPuesto: req.body.idPuesto,
      idUsuario: req.body.idUsuario ?? null,
      motivo: req.body.motivo,
      idUsuarioAccion: req.body.idUsuarioAccion,
      swap: Boolean(req.body.swap),
    });
    res.status(204).send();
  })
);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`GETICKETS API running on http://0.0.0.0:${PORT}`);
});
