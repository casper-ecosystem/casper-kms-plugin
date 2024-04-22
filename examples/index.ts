import { DeployStrParams, PaymentStrParams, SDK, SessionStrParams, Verbosity, jsonPrettyPrint } from 'casper-sdk';
import axios from 'axios';

const url = 'http://127.0.0.1';
const port = 4000;
const endpoint_generate = 'generateKeypair';
const endpoint_sign = 'sign';
const generateKeyAddress = `${url}:${port}/${endpoint_generate}`;
const signAddress = `${url}:${port}/${endpoint_sign}`;

async function fetchPublicKey() {
  try {
    const response = await axios.post(generateKeyAddress);
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

const sign = async (public_key: string, deploy_hash: string) => {
  try {
    const response = await axios.post(signAddress, {
      public_key,
      deploy_hash,
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

const example1 = async () => {
  const sdk = new SDK();
  const chain_name = 'casper-net-1';

  // const public_key = await fetchPublicKey();
  // console.debug(public_key);

  const public_key = '02033e419ebfa015d05c51984277dff16ca47e8f08d5a47bc30beb477c6e88c02963';

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

  const deploy_result = sdk.make_deploy(deploy_params, session_params, payment_params);
  const deploy_result_as_json = deploy_result.toJson();
  // console.debug(jsonPrettyPrint(deploy_result_as_json, Verbosity.Medium));
  console.debug('deploy hash to sign', deploy_result.hash.toString());
  console.debug('public key to sign', public_key);

  const signature = await sign(public_key, deploy_result.hash.toString());
  console.debug('signature', signature);
  const signed_deploy = deploy_result.addSignature(public_key, signature);
  console.debug('signed deploy', jsonPrettyPrint(signed_deploy.toJson(), Verbosity.Medium));
  console.log('validate Deploy Size', signed_deploy.validateDeploySize());
  // console.log(signed_deploy.isValid()); // 2.0
  // console.log(signed_deploy.approvalsHash()); // 2.0
};

example1();


