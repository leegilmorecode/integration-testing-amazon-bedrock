import {
  clearTable,
  generateRandomId,
  getParameter,
  httpCall,
  putItem,
} from '@packages/aws-async-test-library';
import {
  AssertionsMet,
  Tone,
  responseAssertions,
} from '@packages/aws-async-test-library/ai-assertions';

// constants
let customerEndpoint: string;
const testHarnessTable = `api-test-harness-table-test`;

describe('api-responses-journey', () => {
  beforeAll(async () => {
    // we get the customer endpoint from ssm for our api test harness
    customerEndpoint = await getParameter(`/test/customer-api-url`);
    await clearTable(testHarnessTable, 'pk', 'sk');
  }, 12000);

  beforeEach(async () => {
    await clearTable(testHarnessTable, 'pk', 'sk');
  }, 12000);

  afterAll(async () => {
    await clearTable(testHarnessTable, 'pk', 'sk');
  }, 12000);

  describe('validation', () => {
    it('should validate with a higher confidence score of 8 or more', async () => {
      expect.assertions(3);

      // arrange - 1. setup our api test harness response from the internal garage api
      // and create a determinstic api response which will be fed to bedrock in the garage service
      const testId = generateRandomId();

      await putItem(testHarnessTable, {
        pk: testId,
        sk: 1,
        statusCode: 200,
        response: {
          id: '1',
          created: '2024-11-02T14:38:06.004Z',
          updated: '2024-11-02T14:38:06.004Z',
          vehicle: {
            registration: 'RI56DMZ',
            make: 'NIO',
            model: 'XC90',
            color: 'ivory',
            yearOfManufacture: 2019,
          },
          motResult: {
            testDate: '2024-04-04',
            expiryDate: '2025-03-25',
            result: 'FAIL',
            testCenter: {
              name: 'Harvey and Nader',
              location: {
                addressLine1: '8902 Paris Mountains',
                town: 'Savannaworth',
                postcode: '18488-6552',
              },
            },
            mileage: 58567,
            defects: [],
            advisories: [
              {
                code: 'A002',
                description: 'Brokens rack inner joint',
              },
            ],
          },
        },
      });

      // act - we call the external customer facing api (which will use our api test harness in test stage within the garage service)
      const response = await httpCall(
        customerEndpoint,
        `v1/customers/3/results/1`,
        'GET',
      );

      // assert - we test the summary response is correct with a set of assertions
      const assertionPrompt = `
      - It states that the car failed the inspection regardless of advisories.
      - It states the test centre name and the address where the inspection took place.
      - It details the date of inspection of 4th April 2024 and the expiry date of 25th March 2025.
      - It states that the vehicle make is NIO with a model of XC90 and is a ivory color.
      - It states that there is one advisory and gives the details of it.`;

      const assertionResponse = await responseAssertions({
        prompt: assertionPrompt,
        text: response.summary,
      });

      expect(assertionResponse.assertionsMet).toEqual(AssertionsMet.yes); // it passes the assertions supplied
      expect(assertionResponse.tone).toEqual(Tone.neutral);
      expect(assertionResponse.score).toBeGreaterThanOrEqual(8); // it has a high confidence score
    }, 120000);

    it('should successfully fail validation with a wrong test date', async () => {
      expect.assertions(3);

      // arrange - 1. setup our api test harness response from the internal garage api
      // and create a determinstic api response which will be fed to bedrock in the garage service
      const testId = generateRandomId();

      await putItem(testHarnessTable, {
        pk: testId,
        sk: 1,
        statusCode: 200,
        response: {
          id: '1',
          created: '2024-11-02T14:38:06.004Z',
          updated: '2024-11-02T14:38:06.004Z',
          vehicle: {
            registration: 'LS11DMA',
            make: 'Ford',
            model: 'Kuga',
            color: 'black',
            yearOfManufacture: 2024,
          },
          motResult: {
            testDate: '2024-02-01',
            expiryDate: '2025-03-25',
            result: 'PASS',
            testCenter: {
              name: 'Harvey and Nader',
              location: {
                addressLine1: '8902 Paris Mountains',
                town: 'Savannaworth',
                postcode: '18488-6552',
              },
            },
            mileage: 1567,
            defects: [],
            advisories: [
              {
                code: 'A002',
                description: 'Slight play in steering rack inner joint',
              },
            ],
          },
        },
      });

      // act - we call the external customer facing api (which will use our api test harness in test stage in the garage service)
      const response = await httpCall(
        customerEndpoint,
        `v1/customers/3/results/1`,
        'GET',
      );

      // assert - we test the response is correct with a set of assertions
      // The date of inspection is stated as February 1, 2024, which does not match the assertion of December 1, 2024.
      const assertionPrompt = `
      - The car inspection result was a 'PASS'.
      - The text includes the test centre name and the address where the inspection took place.
      - The car inspection was conducted specifically on December 1, 2024.
      - The text includes the vehicle make is Ford with a model of Kuga and is black.
      - The text includes that there is one advisory and gives the details of it.`;

      const assertionResponse = await responseAssertions({
        prompt: assertionPrompt,
        text: response.summary,
      });

      expect(assertionResponse.assertionsMet).toEqual(AssertionsMet.no); // it successfully asserts that assertions are not met
      expect(assertionResponse.tone).toEqual(Tone.neutral);
      expect(assertionResponse.score).toBeLessThan(8); // it has a high confidence score
    }, 120000);

    it('should successfully validate tone of response as angry', async () => {
      expect.assertions(3);

      // arrange - we dont use the api test harness in this test - but we ensure the summary is angry in tone
      const text = `
      The vehicle which is a 2024 black Ford Kuga, passed the inspection conducted on February 1, 2024, at the Harvey and Nader test center located at 8902 Paris Mountains
      in Savannaworth, 18488-6552. The next expiry date is March 25, 2025.
      However, let's not gloss over the fact that the customer who dropped off the vehicle was late and downright obnoxious! 
      Rude behavior during drop-off? Totally unacceptable! Im so angry! We will not deal with them again! The technicians managed to overlook their terrible attitude and still identified a 'slight play'
      in the steering rack inner joint, which was merely noted as an advisory and the inspection was still passed successfully.
      Despite that, no other defects were found, and the vehicle's mileage is just 1,567 miles.`;

      // act / assert - we test the response is correct
      // The tone should be angry, with all other criteria being met.
      const assertionPrompt = `
        - It states that the car inspection result was a 'PASS'.
        - It states the test centre name and the address where the inspection took place.
        - It states that the vehicle make is Ford with a model of Kuga and is black.
        - It states that there is one advisory and gives the details of it.`;

      const assertionResponse = await responseAssertions({
        prompt: assertionPrompt,
        text: text,
      });

      expect(assertionResponse.assertionsMet).toEqual(AssertionsMet.yes); // it successfully asserts the text supplied
      expect(assertionResponse.tone).toEqual(Tone.angry); // it successfully asserts the response is angry in tone
      expect(assertionResponse.score).toBeGreaterThanOrEqual(8);
    }, 120000);

    it('should successfully validate tone of response as happy', async () => {
      expect.assertions(3);

      // arrange - we dont use the api test harness in this test - but we ensure the summary is happy in tone
      const text = `
        I am delighted to declare that this car inspection was a joy to do, and the customer made my day by bringing me a fresh take out coffee when they dropped the car off!
        The vehicle which is a 2024 black Ford Kuga, passed the inspection conducted on February 1, 2024, at the Harvey and Nader test center located at 8902 Paris Mountains
        in Savannaworth, 18488-6552. The next expiry date is March 25, 2025.
        The technicians identified a 'slight play' in the steering rack inner joint, which was merely noted as an advisory and the inspection was still passed successfully.
        Despite that, no other defects were found, and the vehicle's mileage is just 1,567 miles.`;

      // act / assert - we test the response is correct
      // The tone should be happy, with all other criteria being met.
      const assertionPrompt = `
          - It states that the car inspection result was a 'PASS'.
          - It states the test centre name and the address where the inspection took place.
          - It states that the vehicle make is Ford with a model of Kuga and is black.
          - It states that there is one advisory and gives the details of it.`;

      const assertionResponse = await responseAssertions({
        prompt: assertionPrompt,
        text: text,
      });

      expect(assertionResponse.assertionsMet).toEqual(AssertionsMet.yes); // it successfully asserts the text supplied
      expect(assertionResponse.tone).toEqual(Tone.happy); // it successfully asserts the response is angry in tone
      expect(assertionResponse.score).toBeGreaterThanOrEqual(8);
    }, 120000);

    it('should validate with a low confidence score of less than or equal to 5', async () => {
      expect.assertions(2);

      // arrange - 1. setup our api test harness response from the internal garage api
      // and create a determinstic api response which will be fed to bedrock in the garage service
      const testId = generateRandomId();

      await putItem(testHarnessTable, {
        pk: testId,
        sk: 1,
        statusCode: 200,
        response: {
          id: '1',
          created: '2024-11-02T14:38:06.004Z',
          updated: '2024-11-02T14:38:06.004Z',
          vehicle: {
            registration: 'RI56DMZ',
            make: 'NIO',
            model: 'XC90',
            color: 'ivory',
            yearOfManufacture: 2019,
          },
          motResult: {
            testDate: '2024-04-04',
            expiryDate: '2025-03-25',
            result: 'FAIL',
            testCenter: {
              name: 'Harvey and Nader',
              location: {
                addressLine1: '8902 Paris Mountains',
                town: 'Savannaworth',
                postcode: '18488-6552',
              },
            },
            mileage: 58567,
            defects: [],
            advisories: [
              {
                code: 'A002',
                description: 'Slight play in steering rack inner joint',
              },
            ],
          },
        },
      });

      // act - we call the external customer facing api (which will use our api test harness in test stage in the garage service)
      const response = await httpCall(
        customerEndpoint,
        `v1/customers/4/results/2`,
        'GET',
      );

      // assert - we test a very wrong set of assertions for the data returned from the api summary
      const assertionPrompt = `
        - It states that the car inspection result was a 'PASS'.
        - It states that the test centre is located in London, the UK.
        - It details the date of inspection of 4th April 2024 and the expiry date of 25th March 2025.
        - It states that the registration is 'L13 TRT'.
        - It states that the vehicle is a large lorry that is green and model 'transatlantic.
        - It states that there is thirty advisory's and gives the details of it.`;

      const assertionResponse = await responseAssertions({
        prompt: assertionPrompt,
        text: response.summary,
      });

      expect(assertionResponse.assertionsMet).toEqual(AssertionsMet.no); // it doesn't pass the criteria
      expect(assertionResponse.score).toBeLessThanOrEqual(5); // confidence in the text supplied is low as it is very wrong
    }, 120000);
  });
});
