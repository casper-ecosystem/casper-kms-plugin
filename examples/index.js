"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var casper_sdk_1 = require("casper-sdk");
var axios_1 = require("axios");
var url = 'http://127.0.0.1';
var port = 4000;
var endpoint_generate = 'generateKeypair';
var endpoint_sign = 'sign';
var generateKeyAddress = "".concat(url, ":").concat(port, "/").concat(endpoint_generate);
var signAddress = "".concat(url, ":").concat(port, "/").concat(endpoint_sign);
function fetchPublicKey() {
    return __awaiter(this, void 0, void 0, function () {
        var response, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, axios_1.default.post(generateKeyAddress)];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response.data];
                case 2:
                    error_1 = _a.sent();
                    console.error('Error:', error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
var sign = function (public_key, deploy_hash) { return __awaiter(void 0, void 0, void 0, function () {
    var response, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, axios_1.default.post(signAddress, {
                        public_key: public_key,
                        deploy_hash: deploy_hash,
                    })];
            case 1:
                response = _a.sent();
                return [2 /*return*/, response.data];
            case 2:
                error_2 = _a.sent();
                console.error('Error:', error_2);
                return [2 /*return*/, null];
            case 3: return [2 /*return*/];
        }
    });
}); };
var example1 = function () { return __awaiter(void 0, void 0, void 0, function () {
    var sdk, chain_name, public_key, payment_amount, contract_name, entry_point, deploy_params, token_owner, session_params, payment_params, deploy_result, deploy_result_as_json, signature, signed_deploy;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                sdk = new casper_sdk_1.SDK();
                chain_name = 'casper-net-1';
                public_key = '02033e419ebfa015d05c51984277dff16ca47e8f08d5a47bc30beb477c6e88c02963';
                payment_amount = '5000000000';
                contract_name = 'cep-78-contract';
                entry_point = 'mint';
                deploy_params = new casper_sdk_1.DeployStrParams(chain_name, public_key);
                token_owner = 'account-hash-878985c8c07064e09e67cc349dd21219b8e41942a0adc4bfa378cf0eace32611';
                session_params = new casper_sdk_1.SessionStrParams();
                session_params.session_name = contract_name;
                session_params.session_entry_point = entry_point;
                session_params.session_args_simple = ["token_meta_data:String='test_meta_data'", "token_owner:Key='".concat(token_owner, "'")];
                payment_params = new casper_sdk_1.PaymentStrParams(payment_amount);
                deploy_result = sdk.make_deploy(deploy_params, session_params, payment_params);
                deploy_result_as_json = deploy_result.toJson();
                // console.debug(jsonPrettyPrint(deploy_result_as_json, Verbosity.Medium));
                console.debug('deploy hash to sign', deploy_result.hash.toString());
                console.debug('public key to sign', public_key);
                return [4 /*yield*/, sign(public_key, deploy_result.hash.toString())];
            case 1:
                signature = _a.sent();
                console.debug('signature', signature);
                signed_deploy = deploy_result.addSignature(public_key, signature);
                console.debug('signed deploy', (0, casper_sdk_1.jsonPrettyPrint)(signed_deploy.toJson(), casper_sdk_1.Verbosity.Medium));
                console.log('validate Deploy Size', signed_deploy.validateDeploySize());
                return [2 /*return*/];
        }
    });
}); };
example1();