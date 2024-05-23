export const unsigned_deploy_example = {
  hash: '8a3660d3db52821ec0019ba2a76cb43535bdebe1d99e3f307ecd81c3e8fe1366',
  header: {
    account:
      '01b13b07ff048402868c95632091db57b0d5225f2cf50fc59f9a9a18b2da17792c',
    timestamp: '2024-05-22T15:57:43.000Z',
    ttl: '30m',
    gas_price: 1,
    body_hash:
      'e095a865c228d8e436a7789ee083634ad3344c1ca270ac6ea333de6611aafd78',
    dependencies: [],
    chain_name: 'casper',
  },
  payment: {
    ModuleBytes: {
      module_bytes: '',
      args: [
        [
          'amount',
          {
            cl_type: 'U512',
            bytes: '0400e1f505',
            parsed: '100000000',
          },
        ],
      ],
    },
  },
  session: {
    Transfer: {
      args: [
        [
          'amount',
          {
            cl_type: 'U512',
            bytes: '0400f90295',
            parsed: '2500000000',
          },
        ],
        [
          'target',
          {
            cl_type: 'PublicKey',
            bytes:
              '0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54',
            parsed:
              '0187adb3e0f60a983ecc2ddb48d32b3deaa09388ad3bc41e14aeb19959ecc60b54',
          },
        ],
        [
          'id',
          {
            cl_type: {
              Option: 'U64',
            },
            bytes: '0151b2fb978bc7b412',
            parsed: 1347921590854857200,
          },
        ],
      ],
    },
  },
  approvals: [],
};
