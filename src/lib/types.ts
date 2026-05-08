export interface Caucion {
  id: string;
  descripcion: string;
  monto: number;
  tna: number;
  plazo: number;
  fechaInicio: string;
  renovaciones: number;
}

export interface CaucionPeriodo {
  id: string;
  caucionId: string;
  monto: number;
  tna: number;
  plazo: number;
  fechaInicio: string;
  intereses: number;
}

export interface Cedear {
  id: string;
  ticker: string;
  cantidad: number;
  precioCompra: number;
  precioActual: number;
  precioVenta?: number;
  fechaVenta?: string;
}
