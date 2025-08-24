export interface ClientDoc {
  id?: string;             // Firestore id
  companyId: string;       // parent company

  // basics
  name: string;            // "Intel Ofis"
  taxId?: string;          // "МК93851975" (ЕДБ)
  address?: string;        // street + city
  email?: string;
  phone?: string;
  notes?: string;

  isActive: boolean;

  createdAt: number;       // Date.now()
  updatedAt: number;       // Date.now()
}
