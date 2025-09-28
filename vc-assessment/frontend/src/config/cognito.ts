import { Amplify } from 'aws-amplify';

const cognitoConfig = {
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

// Configure Amplify
Amplify.configure(cognitoConfig);

export default cognitoConfig;
