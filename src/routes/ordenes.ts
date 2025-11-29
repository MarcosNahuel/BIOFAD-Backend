import { Router, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { AuthenticatedRequest, CreateOrdenDTO, UpdateResultadosDTO } from '../types/index.js';

const router = Router();

// GET /api/ordenes - Listar órdenes
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data: ordenes, error } = await supabase
      .from('ordenes')
      .select(`
        id,
        protocolo,
        estado,
        fecha_creacion,
        id_paciente,
        id_medico,
        pacientes!inner (
          apellido_nombre,
          dni
        ),
        medicos (
          nombre_completo
        )
      `)
      .order('fecha_creacion', { ascending: false });

    if (error) throw error;

    // Formatear respuesta
    const result = (ordenes || []).map((o: any) => ({
      id: o.id,
      protocolo: o.protocolo,
      fecha_creacion: o.fecha_creacion,
      estado: o.estado,
      apellido_nombre: o.pacientes?.apellido_nombre || '',
      dni: o.pacientes?.dni || '',
      medico_nombre: o.medicos?.nombre_completo || null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error listando órdenes:', error);
    res.status(500).json({ error: 'Error al listar órdenes' });
  }
});

// GET /api/ordenes/:id - Detalle de orden
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const { data: orden, error } = await supabase
      .from('ordenes')
      .select(`
        *,
        pacientes (*),
        medicos (*)
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) throw error;

    if (!orden) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    // Obtener resultados
    const { data: resultados } = await supabase
      .from('resultados')
      .select('*')
      .eq('id_orden', parseInt(id));

    // Obtener datos de determinaciones para los resultados
    const resultadosConDeterminacion = await Promise.all(
      (resultados || []).map(async (r: any) => {
        const { data: det } = await supabase
          .from('determinaciones')
          .select('*')
          .eq('nbu', r.nbu)
          .single();

        return {
          nbu: r.nbu,
          valor: r.valor,
          nombre: det?.nombre || r.nbu,
          tipo: det?.tipo_resultado || 'numerico',
          unidades: det?.unidades_resultado || '',
          vr: det?.valores_referencia || '',
          opciones_lista: det?.opciones_lista || '',
          es_perfil: det?.es_perfil || false,
          hijos_nbu: det?.hijos_nbu || ''
        };
      })
    );

    // Buscar siguiente orden pendiente
    const { data: siguienteOrden } = await supabase
      .from('ordenes')
      .select('id')
      .gt('id', parseInt(id))
      .eq('estado', 'Pendiente')
      .order('id', { ascending: true })
      .limit(1)
      .single();

    // Formatear respuesta compatible con el frontend actual
    res.json({
      id: orden.id,
      protocolo: orden.protocolo,
      estado: orden.estado,
      lista_determinaciones_nbu: orden.lista_determinaciones_nbu,
      apellido_nombre: orden.pacientes?.apellido_nombre || '',
      dni: orden.pacientes?.dni || '',
      email: orden.pacientes?.email || '',
      obra_social: orden.pacientes?.obra_social || '',
      domicilio: orden.pacientes?.domicilio || '',
      telefono: orden.pacientes?.telefono || '',
      nro_afiliado: orden.pacientes?.nro_afiliado || '',
      fecha_nacimiento: orden.pacientes?.fecha_nacimiento || '',
      medico_nombre: orden.medicos?.nombre_completo || '',
      resultados_guardados: resultadosConDeterminacion,
      siguiente_id: siguienteOrden?.id || null
    });
  } catch (error) {
    console.error('Error obteniendo orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
});

// POST /api/ordenes - Crear orden
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data: CreateOrdenDTO = req.body;

    // 1. Buscar o crear paciente
    let paciente = null;
    if (data.dniPaciente) {
      const { data: existingPaciente } = await supabase
        .from('pacientes')
        .select('*')
        .eq('dni', data.dniPaciente)
        .single();
      paciente = existingPaciente;
    }

    if (!paciente) {
      const { data: newPaciente, error: pacienteError } = await supabase
        .from('pacientes')
        .insert({
          dni: data.dniPaciente || null,
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

      if (pacienteError) throw pacienteError;
      paciente = newPaciente;
    }

    // 2. Buscar o crear médico
    let medico = null;
    if (data.nombreMedico) {
      if (data.matriculaMedico) {
        const { data: existingMedico } = await supabase
          .from('medicos')
          .select('*')
          .eq('matricula', data.matriculaMedico)
          .single();
        medico = existingMedico;
      }
      if (!medico) {
        const { data: newMedico, error: medicoError } = await supabase
          .from('medicos')
          .insert({
            matricula: data.matriculaMedico || null,
            nombre_completo: data.nombreMedico
          })
          .select()
          .single();

        if (medicoError) throw medicoError;
        medico = newMedico;
      }
    }

    // 3. Crear orden
    const protocolo = new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      Math.floor(Math.random() * 900 + 100);

    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .insert({
        protocolo,
        id_paciente: paciente.id,
        id_medico: medico?.id || null,
        lista_determinaciones_nbu: data.listaDeterminaciones,
        estado: 'Pendiente'
      })
      .select()
      .single();

    if (ordenError) throw ordenError;

    // 4. Crear resultados vacíos
    if (data.listaDeterminaciones?.length > 0) {
      const resultadosData = data.listaDeterminaciones.map(nbu => ({
        id_orden: orden.id,
        nbu,
        estado: 'Pendiente'
      }));

      await supabase.from('resultados').insert(resultadosData);
    }

    res.status(201).json({
      success: true,
      id: orden.id,
      protocolo
    });
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({ error: 'Error al crear orden' });
  }
});

// PUT /api/ordenes/:id/resultados - Actualizar resultados (UPSERT)
router.put('/:id/resultados', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateResultadosDTO = req.body;
    const ordenId = parseInt(id);

    // 1. Obtener orden
    const { data: orden, error: ordenError } = await supabase
      .from('ordenes')
      .select('*, pacientes(*), medicos(*)')
      .eq('id', ordenId)
      .single();

    if (ordenError || !orden) {
      res.status(404).json({ error: 'Orden no encontrada' });
      return;
    }

    // 2. Actualizar paciente
    if (data.paciente) {
      await supabase
        .from('pacientes')
        .update({
          apellido_nombre: data.paciente.nombre,
          dni: data.paciente.dni || null,
          obra_social: data.paciente.os || null,
          email: data.paciente.email || null,
          domicilio: data.paciente.domicilio || null,
          telefono: data.paciente.telefono || null
        })
        .eq('id', orden.id_paciente);
    }

    // 3. Actualizar o crear médico
    if (data.paciente?.medico) {
      if (orden.id_medico) {
        await supabase
          .from('medicos')
          .update({ nombre_completo: data.paciente.medico })
          .eq('id', orden.id_medico);
      } else {
        const { data: nuevoMedico } = await supabase
          .from('medicos')
          .insert({
            matricula: 'S/M',
            nombre_completo: data.paciente.medico
          })
          .select()
          .single();

        if (nuevoMedico) {
          await supabase
            .from('ordenes')
            .update({ id_medico: nuevoMedico.id })
            .eq('id', ordenId);
        }
      }
    }

    // 4. UPSERT resultados
    for (const resultado of data.resultados) {
      // Intentar actualizar primero
      const { data: existing } = await supabase
        .from('resultados')
        .select('id')
        .eq('id_orden', ordenId)
        .eq('nbu', resultado.nbu)
        .single();

      if (existing) {
        await supabase
          .from('resultados')
          .update({
            valor: resultado.valor,
            estado: 'Cargado',
            fecha_carga: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('resultados')
          .insert({
            id_orden: ordenId,
            nbu: resultado.nbu,
            valor: resultado.valor,
            estado: 'Cargado',
            fecha_carga: new Date().toISOString()
          });
      }
    }

    // 5. Eliminar resultados que ya no están
    const nbusActuales = data.resultados.map(r => r.nbu);
    if (nbusActuales.length > 0) {
      await supabase
        .from('resultados')
        .delete()
        .eq('id_orden', ordenId)
        .not('nbu', 'in', `(${nbusActuales.join(',')})`);
    }

    // 6. Actualizar estado de la orden
    await supabase
      .from('ordenes')
      .update({ estado: 'En Proceso' })
      .eq('id', ordenId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error actualizando resultados:', error);
    res.status(500).json({ success: false, error: 'Error al guardar resultados' });
  }
});

export default router;
