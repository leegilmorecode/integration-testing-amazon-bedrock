export type Result = {
  id: string;
  created: string;
  updated: string;
  vehicle: {
    registration: string;
    make: string;
    model: string;
    color: string;
    yearOfManufacture: number;
  };
  motResult: {
    testDate: string;
    expiryDate: string;
    result: 'PASS' | 'FAIL';
    testCenter: {
      name: string;
      location: {
        addressLine1: string;
        town: string;
        postcode: string;
      };
    };
    mileage: number;
    defects: {
      code: string;
      description: string;
    }[];
    advisories: {
      code: string;
      description: string;
    }[];
  };
};
