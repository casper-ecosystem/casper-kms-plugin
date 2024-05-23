import { Deploy, DeployStrParams, PaymentStrParams, SDK, SessionStrParams, Verbosity, jsonPrettyPrint } from 'casper-ts-sdk';
import axios from 'axios';

const url = 'http://localhost';
const port = 4000;
const endpoint_generate = 'generateKeypair';
const endpoint_sign_deploy_hash = 'signDeployHash';
const endpoint_sign_deploy = 'signDeploy';
const generateKey_address = `${url}:${port}/${endpoint_generate}`;
const sign_deploy_hash_address = `${url}:${port}/${endpoint_sign_deploy_hash}`;
const sign_deploy_address = `${url}:${port}/${endpoint_sign_deploy}`;

// signDeploy
const example_0 = async () => {
  const sdk = new SDK();
  const chain_name = 'casper-net-1';

  // Creates public key in kms
  const public_key = await fetchPublicKey();

  const payment_amount = '5000000000';
  const contract_name = 'cep-78-contract';
  const entry_point = 'mint';
  const deploy_params = new DeployStrParams(chain_name, public_key);

  const token_owner =
    'account-hash-878985c8c07064e09e67cc349dd21219b8e41942a0adc4bfa378cf0eace32611';

  const session_params = new SessionStrParams();
  session_params.session_name = contract_name;
  session_params.session_entry_point = entry_point;
  session_params.session_args_simple = ["token_meta_data:String='test_meta_data'", `token_owner:Key='${token_owner}'`];

  const payment_params = new PaymentStrParams(payment_amount);

  const unsigned_deploy = sdk.make_deploy(deploy_params, session_params, payment_params);
  // const unsigned_deploy_as_json = unsigned_deploy.toJson();
  // console.debug(jsonPrettyPrint(unsigned_deploy_as_json, Verbosity.Medium));
  console.debug('deploy hash to sign', unsigned_deploy.hash.toString());
  console.debug('public key to sign', public_key);

  // Sign the deploy with public key in kms
  const signed_deploy_string = await sign_deploy(unsigned_deploy, public_key);

  const signed_deploy = new Deploy(signed_deploy_string);
  console.debug('signed deploy', jsonPrettyPrint(signed_deploy.toJson(), Verbosity.Medium));
  console.debug('validate Deploy Size', signed_deploy.validateDeploySize());
  // console.debug(signed_deploy.isValid()); // 2.0
  // console.debug(signed_deploy.approvalsHash()); // 2.0
};

// signDeployHash
const example_1 = async () => {
  const sdk = new SDK();
  const chain_name = 'casper-net-1';

  // Creates public key in kms
  const public_key = await fetchPublicKey();

  const payment_amount = '5000000000';
  const contract_name = 'cep-78-contract';
  const entry_point = 'mint';
  const deploy_params = new DeployStrParams(chain_name, public_key);

  const token_owner =
    'account-hash-878985c8c07064e09e67cc349dd21219b8e41942a0adc4bfa378cf0eace32611';

  const session_params = new SessionStrParams();
  session_params.session_name = contract_name;
  session_params.session_entry_point = entry_point;
  session_params.session_args_simple = ["token_meta_data:String='test_meta_data'", `token_owner:Key='${token_owner}'`];

  const payment_params = new PaymentStrParams(payment_amount);

  const unsigned_deploy = sdk.make_deploy(deploy_params, session_params, payment_params);
  // const unsigned_deploy_as_json = unsigned_deploy.toJson();
  // console.debug(jsonPrettyPrint(unsigned_deploy_as_json, Verbosity.Medium));
  console.debug('deploy hash to sign', unsigned_deploy.hash.toString());
  console.debug('public key to sign', public_key);

  // Get a signature for the deploy hash
  const signature = await sign_deploy_hash(public_key, unsigned_deploy.hash.toString());
  console.debug('signature', signature);

  // Add signature to the deploy with SDK // or use addSignature API entry point (deploy, public_key, signature)
  const signed_deploy = unsigned_deploy.addSignature(public_key, signature);

  console.debug('signed deploy', jsonPrettyPrint(signed_deploy.toJson(), Verbosity.Medium));
  console.debug('validate Deploy Size', signed_deploy.validateDeploySize());
  // console.debug(signed_deploy.isValid()); // 2.0
  // console.debug(signed_deploy.approvalsHash()); // 2.0
};

const fetchPublicKey = async () => {
  try {
    const response = await axios.post(generateKey_address);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

const sign_deploy_hash = async (public_key: string, deploy_hash: string) => {
  try {
    const response = await axios.get(sign_deploy_hash_address, {
      params: {
        public_key,
        deploy_hash,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

const sign_deploy = async (deploy: Deploy, public_key: string,) => {
  try {
    const response = await axios.post(sign_deploy_address, {
      deploy: deploy.toJson(),
    }, {
      params: {
        public_key,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

example_0();
