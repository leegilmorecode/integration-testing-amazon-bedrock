// Note: For ease of the demo we have hardcoded values for each customer
// however this would usually be stored in a database table
export async function getCustomerCommunicationPreferences(
  customerId: string,
): Promise<string> {
  let communicationPreference;
  switch (customerId) {
    case '1':
      communicationPreference = 'bullet points';
      break;
    case '2':
      communicationPreference = 'concise summary';
      break;
    case '3':
      communicationPreference = 'detailed paragraphs';
      break;
    case '4':
      communicationPreference = 'Q&A';
      break;
    default:
      communicationPreference = 'concise summary';
      break;
  }
  return communicationPreference;
}
