const config = () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  aws: {
    region: process.env.AWS_REGION,
    sign: {
      accessKeyId: process.env.KMS_SIGN_ID,
      secretAccessKey: process.env.KMS_SIGN_KEY,
    },
    create: {
      accessKeyId: process.env.KMS_CREATE_ID,
      secretAccessKey: process.env.KMS_CREATE_KEY,
    },
  },
  dev_mode: process.env.NODE_ENV == 'development' || false,
  mock_testing_mode: process.env.MOCK_TESTING_MODE == 'true' || false,
});

export type ConfigType = ReturnType<typeof config>;

export default config;
