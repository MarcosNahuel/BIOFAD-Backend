import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest, CreatePacienteDTO } from '../types/index.js';

const router = Router();

// GET /api/pacientes?dni=X - Buscar paciente por DNI
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { dni } = req.query;

    if (!dni || typeof dni !== 'string') {
      res.json(null);
      return;
    }

    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('dni', dni)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    res.json(data || null);
  } catch (error) {
    console.error('Error buscando paciente:', error);
    res.status(500).json({ error: 'Error al buscar paciente' });
  }
});

// GET /api/pacientes/:id - Obtener paciente por ID
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: paciente, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;

    if (!paciente) {
      res.status(404).json({ error: 'Paciente no encontrado' });
      return;
    }

    // Obtener últimas 10 órdenes del paciente
    const { data: ordenes } = await supabase
      .from('ordenes')
      .select('*')
      .eq('id_paciente', parseInt(id))
      .order('fecha_creacion', { ascending: false })
      .limit(10);

    res.json({ ...paciente, ordenes: ordenes || [] });
  } catch (error) {
    console.error('Error obteniendo paciente:', error);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

// POST /api/pacientes - Crear paciente
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data: CreatePacienteDTO = req.body;

    const { data: paciente, error } = await supabase
      .from('pacientes')
      .insert({
        dni: data.dni || null,
        apellido_nombre: data.apellidoNombre,
        fecha_nacimiento: data.fechaNacimiento || null,
        telefono: data.telefono || null,
        email: data.email || null,
        domicilio: data.domicilio || null,
        obra_social: data.obraSocial || null,
        nro_afiliado: data.nroAfiliado || null
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(paciente);
  } catch (error) {
    console.error('Error creando paciente:', error);
    res.status(500).json({ error: 'Error al crear paciente' });
  }
});

// PUT /api/pacientes/:id - Actualizar paciente
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<CreatePacienteDTO> = req.body;

    const updateData: any = {};
    if (data.dni !== undefined) updateData.dni = data.dni;
    if (data.apellidoNombre !== undefined) updateData.apellido_nombre = data.apellidoNombre;
    if (data.fechaNacimiento !== undefined) updateData.fecha_nacimiento = data.fechaNacimiento;
    if (data.telefono !== undefined) updateData.telefono = data.telefono;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.domicilio !== undefined) updateData.domicilio = data.domicilio;
    if (data.obraSocial !== undefined) updateData.obra_social = data.obraSocial;
    if (data.nroAfiliado !== undefined) updateData.nro_afiliado = data.nroAfiliado;

    const { data: paciente, error } = await supabase
      .from('pacientes')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    res.json(paciente);
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({ error: 'Error al actualizar paciente' });
  }
});

export default router;
