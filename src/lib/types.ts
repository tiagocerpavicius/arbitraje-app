export interface Caucion {
  id: string;
  descripcion: string;
  monto: number;
  tna: number;
  plazo: number;
  fechaInicio: string;
}

export interface Cedear {
  id: string;
  ticker: string;
  cantidad: number;
  precioARS: number;
  precioUSD: number;
  caucionId?: string;
}

export interface AppConfig {
  ccl: number;
  mep: number;
}
