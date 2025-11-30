import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcrypt';

const router = Router();

// POST /api/portal/login - Login para pacientes
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { dni, password } = req.body;

    if (!dni || !password) {
      res.status(400).json({ error: 'DNI y contraseña son requeridos' });
      return;
    }

    // Buscar usuario por DNI
    const { data: usuario, error: userError } = await supabase
      .from('pacientes_usuarios')
      .select('*, pacientes(*)')
      .eq('dni', dni)
      .eq('activo', true)
      .single();

    if (userError || !usuario) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciales inválidas' });
      return;
    }

    // Actualizar último acceso
    await supabase
      .from('pacientes_usuarios')
      .update({ ultimo_acceso: new Date().toISOString() })
      .eq('id', usuario.id);

    // Retornar datos del paciente (sin la contraseña)
    res.json({
      success: true,
      paciente: {
        id: usuario.pacientes.id,
        nombre: usuario.pacientes.apellido_nombre,
        dni: usuario.dni,
        email: usuario.pacientes.email,
        telefono: usuario.pacientes.telefono
      }
    });

  } catch (error) {
    console.error('Error en login de portal:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// GET /api/portal/resultados/:dni - Obtener resultados del paciente
router.get('/resultados/:dni', async (req: Request, res: Response) => {
  try {
    const { dni } = req.params;

    // Buscar paciente
    const { data: paciente, error: pacienteError } = await supabase
      .from('pacientes')
      .select('id')
      .eq('dni', dni)
      .single();

    if (pacienteError || !paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    // Obtener órdenes del paciente
    const { data: ordenes, error: ordenesError } = await supabase
      .from('ordenes')
      .select(`
        id,
        protocolo,
        fecha_creacion,
        estado,
        medicos (nombre_completo)
      `)
      .eq('id_paciente', paciente.id)
      .eq('estado', 'Completado') // Solo órdenes completadas
      .order('fecha_creacion', { ascending: false });

    if (ordenesError) throw ordenesError;

    // Formatear respuesta
    const resultados = (ordenes || []).map(o => ({
      protocolo: o.protocolo,
      fecha: o.fecha_creacion,
      medico: o.medicos?.nombre_completo || 'Sin especificar',
      estado: o.estado,
      id_orden: o.id
    }));

    res.json(resultados);

  } catch (error) {
    console.error('Error obteniendo resultados:', error);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
});

// GET /api/portal/orden/:id - Obtener detalle de una orden específica
router.get('/orden/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dni } = req.query;

    if (!dni) {
      res.status(400).json({ error: 'DNI es requerido' });
      return;
    }

    // Obtener orden con validación de pertenencia al paciente
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select(`
        *,
        pacientes!inner (dni, apellido_nombre, fecha_nacimiento),
        medicos (nombre_completo, matricula)
      `)
      .eq('id', parseInt(id))
      .eq('pacientes.dni', dni as string)
      .single();

    if (ordenError || !orden) {
      res.status(404).json({ error: 'Orden no encontrada o no tiene acceso' });
      return;
    }

    // Obtener resultados de la orden
    const { data: resultados } = await supabase
      .from('resultados')
      .select('*')
      .eq('id_orden', parseInt(id));

    // Obtener información de determinaciones
    const resultadosConDatos = await Promise.all(
      (resultados || []).map(async (r: any) => {
        const { data: det } = await supabase
          .from('determinaciones')
          .select('nombre, unidades_resultado, valores_referencia')
          .eq('nbu', r.nbu)
          .single();

        return {
          nbu: r.nbu,
          nombre: det?.nombre || r.nbu,
          valor: r.valor,
          unidades: det?.unidades_resultado || '',
          valores_referencia: det?.valores_referencia || ''
        };
      })
    );

    res.json({
      protocolo: orden.protocolo,
      fecha: orden.fecha_creacion,
      paciente: orden.pacientes.apellido_nombre,
      medico: orden.medicos?.nombre_completo || 'Sin especificar',
      resultados: resultadosConDatos
    });

  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
});

// POST /api/portal/registro - Crear usuario para paciente existente
router.post('/registro', async (req: Request, res: Response) => {
  try {
    const { dni, password, id_paciente } = req.body;

    if (!dni || !password || !id_paciente) {
      res.status(400).json({ error: 'Datos incompletos' });
      return;
    }

    // Verificar que el paciente existe
    const { data: paciente, error: pacienteError } = await supabase
      .from('pacientes')
      .select('id, dni')
      .eq('id', id_paciente)
      .single();

    if (pacienteError || !paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    // Verificar que el DNI coincide
    if (paciente.dni !== dni) {
      res.status(400).json({ error: 'DNI no coincide con el paciente' });
      return;
    }

    // Verificar que no exista ya un usuario
    const { data: existingUser } = await supabase
      .from('pacientes_usuarios')
      .select('id')
      .eq('dni', dni)
      .single();

    if (existingUser) {
      res.status(409).json({ error: 'Ya existe un usuario con este DNI' });
      return;
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const { data: newUser, error: insertError } = await supabase
      .from('pacientes_usuarios')
      .insert({
        dni,
        password_hash: passwordHash,
        id_paciente,
        activo: true
      })
      .select()
      .single();

    if (insertError) throw insertError;

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente'
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

export default router;
