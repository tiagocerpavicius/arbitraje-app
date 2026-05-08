export interface Caucion {
  id: string;
  descripcion: string;
  monto: number;
  tna: number;
  plazo: number;
  fechaInicio: string;
  renovaciones: number;
}

export interface Cedear {
  id: string;
  ticker: string;
  cantidad: number;
  precioCompra: number;
  precioActual: number;
  caucionId?: string;
}
