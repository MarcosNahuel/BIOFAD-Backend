import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface CreatePacienteDTO {
  dni?: string;
  apellidoNombre: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  obraSocial?: string;
  nroAfiliado?: string;
}

export interface CreateOrdenDTO {
  dniPaciente?: string;
  apellidoNombre: string;
  fechaNacimiento?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  obraSocial?: string;
  nroAfiliado?: string;
  matriculaMedico?: string;
  nombreMedico?: string;
  listaDeterminaciones: string[];
}

export interface UpdateResultadosDTO {
  paciente: {
    nombre: string;
    dni?: string;
    os?: string;
    email?: string;
    domicilio?: string;
    telefono?: string;
    medico?: string;
  };
  resultados: Array<{
    nbu: string;
    valor: string;
  }>;
}

export interface CreateDeterminacionDTO {
  nbu: string;
  nombre: string;
  ub?: string;
  metodo?: string;
  esPerfil?: boolean;
  hijosNbu?: string;
  tipoResultado?: string;
  unidadesResultado?: string;
  valoresReferencia?: string;
  opcionesLista?: string;
}
