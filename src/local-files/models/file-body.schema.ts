const fileBodySchema = {
  type: 'object',
  properties: {
    file: {
      type: 'string',
      format: 'binary',
    },
  },
};

export { fileBodySchema };
