import { MotResult } from '@dto/mot-result';
import { faker } from '@faker-js/faker';
import { logger } from '@shared';

export async function getMotUseCase(id: string): Promise<MotResult> {
  // Note: For this example we will use Faker instead of creating a database with example api results
  // from our garage api, however this is mimicking the fact the data can change over time and is not determinstic.
  const generateRandomMotResult = (id: string): MotResult => ({
    id,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    vehicle: {
      registration: faker.vehicle.vrm(),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      color: faker.vehicle.color(),
      yearOfManufacture: faker.number.int({ min: 2000, max: 2023 }),
    },
    motResult: {
      testDate: faker.date.past().toISOString().split('T')[0],
      expiryDate: faker.date.future().toISOString().split('T')[0],
      result: faker.helpers.arrayElement(['PASS', 'FAIL']),
      testCenter: {
        name: faker.company.name(),
        location: {
          addressLine1: faker.location.streetAddress(),
          town: faker.location.city(),
          postcode: faker.location.zipCode(),
        },
      },
      mileage: faker.number.int({ min: 10000, max: 100000 }),
      defects: faker.helpers.arrayElements(
        [
          {
            code: 'D001',
            description: 'Brake pads worn below minimum thickness',
          },
          { code: 'D002', description: 'Headlamp aim too high' },
        ],
        faker.number.int({ min: 0, max: 2 }),
      ),
      advisories: faker.helpers.arrayElements(
        [
          {
            code: 'A001',
            description: 'Nearside front tyre worn close to legal limit',
          },
          {
            code: 'A002',
            description: 'Slight play in steering rack inner joint',
          },
        ],
        faker.number.int({ min: 0, max: 2 }),
      ),
    },
  });

  const motResult = generateRandomMotResult(id);

  logger.info(
    `mot result retrieved: ${JSON.stringify(motResult)} for id ${id}`,
  );

  return motResult;
}
