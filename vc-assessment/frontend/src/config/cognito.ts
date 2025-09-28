// Conditional import to prevent errors when AWS dependencies aren't installed
let Amplify: any = null;
let cognitoConfig: any = null;

try {
  // Try to import AWS Amplify
  const amplifyModule = require('aws-amplify');
  Amplify = amplifyModule.Amplify;

  cognitoConfig = {
    Auth: {
      Cognito: {
        userPoolId: process.env.REACT_APP_AWS_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.REACT_APP_AWS_COGNITO_CLIENT_ID!,
        loginWith: {
          email: true,
        },
        signUpVerificationMethod: 'code',
        userAttributes: {
          email: {
            required: true,
          },
          given_name: {
            required: true,
          },
          family_name: {
            required: true,
          },
          'custom:CompanyName': {
            required: false,
          },
          'custom:JobTitle': {
            required: false,
          },
          'custom:PhoneNumber': {
            required: false,
          },
        },
        passwordFormat: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialCharacters: true,
        },
      },
    },
  };

  // Configure Amplify if available
  if (Amplify && cognitoConfig) {
    Amplify.configure(cognitoConfig);
    console.log('✅ AWS Amplify configured successfully');
  }
} catch (error) {
  console.warn('⚠️ AWS Amplify not available - authentication features disabled');
  console.warn('Run "npm install" to install AWS dependencies');
}

export default cognitoConfig;
export { Amplify };
