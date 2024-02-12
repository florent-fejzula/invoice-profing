export interface Environment {
    production: boolean;
    company: {
      name: string;
      address: string;
      phone: string;
      accountNo: string;
      bank: string;
      EDB: string;
      email?: string;
      ownerName: string;
    };
  }