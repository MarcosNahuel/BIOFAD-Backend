/**
 * Script para crear usuario de paciente en el Portal
 * Uso: node crear_paciente_usuario.js
 */

const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const supabaseUrl = process.env.SUPABASE_URL || 'TU_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'TU_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function crearUsuarioPaciente() {
  try {
    console.log('🔧 Creando usuario de paciente...\n');

    // Datos del paciente de prueba
    const dni = '12345678';
    const password = 'test123'; // Contraseña de prueba
    const nombreCompleto = 'Juan Pérez';

    // 1. Verificar si existe el paciente en la tabla pacientes
    let { data: paciente, error: errorPaciente } = await supabase
      .from('pacientes')
      .select('*')
      .eq('dni', dni)
      .single();

    if (errorPaciente && errorPaciente.code === 'PGRST116') {
      // El paciente no existe, crearlo
      console.log('📝 Creando registro de paciente...');
      const { data: nuevoPaciente, error: errorCrear } = await supabase
        .from('pacientes')
        .insert({
          dni: dni,
          apellido_nombre: nombreCompleto,
          fecha_nacimiento: '1990-01-01',
          telefono: '2611234567',
          email: 'juan.perez@example.com'
        })
        .select()
        .single();

      if (errorCrear) {
        throw new Error(`Error creando paciente: ${errorCrear.message}`);
      }

      paciente = nuevoPaciente;
      console.log('✅ Paciente creado con ID:', paciente.id);
    } else if (errorPaciente) {
      throw new Error(`Error buscando paciente: ${errorPaciente.message}`);
    } else {
      console.log('✅ Paciente ya existe con ID:', paciente.id);
    }

    // 2. Verificar si ya existe usuario para este DNI
    const { data: usuarioExistente } = await supabase
      .from('pacientes_usuarios')
      .select('*')
      .eq('dni', dni)
      .single();

    if (usuarioExistente) {
      console.log('⚠️  Ya existe un usuario con DNI', dni);
      console.log('\n📋 CREDENCIALES EXISTENTES:');
      console.log('   DNI:', dni);
      console.log('   (La contraseña ya está configurada)');
      return;
    }

    // 3. Crear hash de la contraseña
    console.log('\n🔐 Generando hash de contraseña...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Insertar usuario en pacientes_usuarios
    console.log('💾 Guardando usuario en base de datos...');
    const { data: usuario, error: errorUsuario } = await supabase
      .from('pacientes_usuarios')
      .insert({
        dni: dni,
        password_hash: passwordHash,
        id_paciente: paciente.id,
        activo: true
      })
      .select()
      .single();

    if (errorUsuario) {
      throw new Error(`Error creando usuario: ${errorUsuario.message}`);
    }

    console.log('✅ Usuario creado exitosamente!\n');
    console.log('═'.repeat(50));
    console.log('📋 CREDENCIALES DE PRUEBA:');
    console.log('═'.repeat(50));
    console.log('   DNI:        ', dni);
    console.log('   Contraseña: ', password);
    console.log('   Paciente:   ', nombreCompleto);
    console.log('═'.repeat(50));
    console.log('\n💡 Usa estas credenciales en el Portal de Pacientes');
    console.log('   URL: http://localhost:3002 (sección "Portal de Pacientes")\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Ejecutar
crearUsuarioPaciente();
