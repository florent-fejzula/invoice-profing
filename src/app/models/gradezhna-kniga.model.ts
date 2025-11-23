export interface GradezhnaKnigaTableRow {
  redenBrojArea: string;
  textAreaInput: string;
  kolicinaArea: string;
  merkaArea: string;
  cenaArea: string;
  vkupnoArea: string;
}

/**
 * Shape used for JSON import/export and Firestore payload.
 */
export interface GradezhnaKnigaPayload {
  gradbaBroj: string;
  gradbaInputValue: string;
  knigaInputValue: string;
  datumInputValue: string;
  investorInputValue: string;
  adresaInputValue: string;
  pozicijaInputValue: string;
  merkaInputValue: string;
  cenaInputValue: number | undefined;
  tableData: GradezhnaKnigaTableRow[];
  div4InputValue: number;
}

/**
 * Firestore document shape.
 */
export interface GradezhnaKnigaDoc extends GradezhnaKnigaPayload {
  id?: string;
  companyId: string;
  createdByUid?: string;
  createdAt?: number;
  updatedAt?: number;
}
