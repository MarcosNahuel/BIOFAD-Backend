import { Router, Response } from 'express';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest, CreateDeterminacionDTO } from '../types/index';

const router = Router();

// GET /api/determinaciones - Listar determinaciones
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('determinaciones')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error listando determinaciones:', error);
    res.status(500).json({ error: 'Error al listar determinaciones' });
  }
});

// GET /api/determinaciones/:id - Obtener determinación
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('determinaciones')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;

    if (!data) {
      res.status(404).json({ error: 'Determinación no encontrada' });
      return;
    }

    res.json(data);
  } catch (error) {
    console.error('Error obteniendo determinación:', error);
    res.status(500).json({ error: 'Error al obtener determinación' });
  }
});

// POST /api/determinaciones - Crear determinación
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data: CreateDeterminacionDTO = req.body;

    const { data: determinacion, error } = await supabase
      .from('determinaciones')
      .insert({
        nbu: data.nbu,
        nombre: data.nombre,
        ub: data.ub || null,
        metodo: data.metodo || null,
        es_perfil: data.esPerfil || false,
        hijos_nbu: data.hijosNbu || null,
        tipo_resultado: data.tipoResultado || 'numerico',
        unidades_resultado: data.unidadesResultado || null,
        valores_referencia: data.valoresReferencia || null,
        opciones_lista: data.opcionesLista || null,
        activo: true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(400).json({ error: 'Ya existe una determinación con ese NBU' });
        return;
      }
      throw error;
    }

    res.status(201).json({ success: true, id: determinacion.id });
  } catch (error) {
    console.error('Error creando determinación:', error);
    res.status(500).json({ error: 'Error al crear determinación' });
  }
});

// PUT /api/determinaciones/:id - Actualizar determinación
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: Partial<CreateDeterminacionDTO> = req.body;

    const updateData: any = {};
    if (data.nbu !== undefined) updateData.nbu = data.nbu;
    if (data.nombre !== undefined) updateData.nombre = data.nombre;
    if (data.ub !== undefined) updateData.ub = data.ub;
    if (data.metodo !== undefined) updateData.metodo = data.metodo;
    if (data.esPerfil !== undefined) updateData.es_perfil = data.esPerfil;
    if (data.hijosNbu !== undefined) updateData.hijos_nbu = data.hijosNbu;
    if (data.tipoResultado !== undefined) updateData.tipo_resultado = data.tipoResultado;
    if (data.unidadesResultado !== undefined) updateData.unidades_resultado = data.unidadesResultado;
    if (data.valoresReferencia !== undefined) updateData.valores_referencia = data.valoresReferencia;
    if (data.opcionesLista !== undefined) updateData.opciones_lista = data.opcionesLista;

    const { data: determinacion, error } = await supabase
      .from('determinaciones')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, determinacion });
  } catch (error) {
    console.error('Error actualizando determinación:', error);
    res.status(500).json({ error: 'Error al actualizar determinación' });
  }
});

// DELETE /api/determinaciones/:id - Eliminar determinación (soft delete)
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('determinaciones')
      .update({ activo: false })
      .eq('id', parseInt(id));

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error eliminando determinación:', error);
    res.status(500).json({ error: 'Error al eliminar determinación' });
  }
});

export default router;
