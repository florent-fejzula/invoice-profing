export interface Environment {
    production: boolean;
    firebaseConfig: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
      measurementId: string;
    };
    company: {
      name: string;
      address: string;
      phone: string;
      accountNo: string;
      bank: string;
      EDB: string;
      email?: string;
      ownerName?: string;
    };
  }